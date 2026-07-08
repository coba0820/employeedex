import { Hono } from 'hono'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'

type Env = {
  Bindings: {
    DB: D1Database
  }
}

type AppContext = Context<Env>
type JsonRecord = Record<string, unknown>

type EmployeeRow = {
  id: string
  number: string | null
  name: string | null
  nickname: string | null
  photo: string | null
  photo_url?: string | null
  department: string | null
  position: string | null
  job_description: string | null
  gender: string | null
  birth_date: string | null
  birthdate?: string | null
  area: string | null
  join_date: string | null
  joined_at?: string | null
  catchphrase: string | null
  catch_copy?: string | null
  mbti: string | null
  love_mbti: string | null
  strengths: string | null
  weaknesses: string | null
  hobby: string | null
  hobbies?: string | null
  favorites: string | null
  work_style: string | null
  personality_type: string | null
  personality?: string | null
  character_in_office: string | null
  character_type?: string | null
  free_comment: string | null
  comment?: string | null
  rarity: string | null
  card_type: string | null
  tags: string | null
  stats: string | null
}

type Employee = {
  id: string
  number: string
  name: string
  nickname: string
  photo: string
  department: string
  position: string
  jobDescription: string
  gender: string
  birthDate: string
  area: string
  joinDate: string
  catchphrase: string
  mbti: string
  loveMbti: string
  strengths: string
  weaknesses: string
  hobby: string
  favorites: string
  workStyle: string
  personalityType: string
  characterInOffice: string
  freeComment: string
  rarity: string
  cardType: string
  stats: JsonRecord
  tags: string[]
}

const ADMIN_PASSCODE = 'EMPLOYEDEX2026'
const ADMIN_COOKIE = 'edx_admin_session'
const CLIENT_COOKIE = 'edx_client_id'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

const app = new Hono<Env>()

app.use('/static/*', serveStatic({ root: './' }))

function asText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asJsonRecord(value: unknown, fallback: JsonRecord = {}) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : fallback
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || value.trim() === '') return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

async function readJsonBody(c: AppContext): Promise<JsonRecord> {
  try {
    return asJsonRecord(await c.req.json())
  } catch {
    return {}
  }
}

function toEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    number: asText(row.number),
    name: asText(row.name),
    nickname: asText(row.nickname),
    photo: asText(row.photo, asText(row.photo_url)),
    department: asText(row.department),
    position: asText(row.position),
    jobDescription: asText(row.job_description),
    gender: asText(row.gender),
    birthDate: asText(row.birth_date, asText(row.birthdate)),
    area: asText(row.area),
    joinDate: asText(row.join_date, asText(row.joined_at)),
    catchphrase: asText(row.catchphrase, asText(row.catch_copy)),
    mbti: asText(row.mbti),
    loveMbti: asText(row.love_mbti),
    strengths: asText(row.strengths),
    weaknesses: asText(row.weaknesses),
    hobby: asText(row.hobby, asText(row.hobbies)),
    favorites: asText(row.favorites),
    workStyle: asText(row.work_style),
    personalityType: asText(row.personality_type, asText(row.personality)),
    characterInOffice: asText(row.character_in_office, asText(row.character_type)),
    freeComment: asText(row.free_comment, asText(row.comment)),
    rarity: asText(row.rarity, 'N'),
    cardType: asText(row.card_type),
    stats: parseJson<JsonRecord>(row.stats, {}),
    tags: parseJson<string[]>(row.tags, [])
  }
}

function mergeEmployee(body: JsonRecord, base: Employee): Employee {
  return {
    id: asText(body.id, base.id),
    number: asText(body.number, base.number),
    name: asText(body.name, base.name),
    nickname: asText(body.nickname, base.nickname),
    photo: asText(body.photo, base.photo),
    department: asText(body.department, base.department),
    position: asText(body.position, base.position),
    jobDescription: asText(body.jobDescription, base.jobDescription),
    gender: asText(body.gender, base.gender),
    birthDate: asText(body.birthDate, base.birthDate),
    area: asText(body.area, base.area),
    joinDate: asText(body.joinDate, base.joinDate),
    catchphrase: asText(body.catchphrase, base.catchphrase),
    mbti: asText(body.mbti, base.mbti),
    loveMbti: asText(body.loveMbti, base.loveMbti),
    strengths: asText(body.strengths, base.strengths),
    weaknesses: asText(body.weaknesses, base.weaknesses),
    hobby: asText(body.hobby, base.hobby),
    favorites: asText(body.favorites, base.favorites),
    workStyle: asText(body.workStyle, base.workStyle),
    personalityType: asText(body.personalityType, base.personalityType),
    characterInOffice: asText(body.characterInOffice, base.characterInOffice),
    freeComment: asText(body.freeComment, base.freeComment),
    rarity: asText(body.rarity, base.rarity || 'N'),
    cardType: asText(body.cardType, base.cardType),
    stats: asJsonRecord(body.stats, base.stats),
    tags: Array.isArray(body.tags) ? body.tags.map(String) : base.tags
  }
}

async function nextEmployeeNumber(db: D1Database) {
  const { results } = await db.prepare('SELECT number FROM employees').all<{ number: string | null }>()
  const max = results.reduce((currentMax, row) => {
    const n = Number.parseInt((row.number || '').replace(/\D/g, ''), 10)
    return Number.isNaN(n) ? currentMax : Math.max(currentMax, n)
  }, 0)
  return 'No.' + String(max + 1).padStart(3, '0')
}

async function insertEmployee(db: D1Database, employee: Employee) {
  await db.prepare(`
    INSERT INTO employees (
      id, number, name, nickname, photo, department, position, job_description,
      gender, birth_date, area, join_date, catchphrase, mbti, love_mbti,
      strengths, weaknesses, hobby, favorites, work_style, personality_type,
      character_in_office, free_comment, rarity, card_type, tags, stats
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    employee.id,
    employee.number,
    employee.name,
    employee.nickname,
    employee.photo,
    employee.department,
    employee.position,
    employee.jobDescription,
    employee.gender,
    employee.birthDate,
    employee.area,
    employee.joinDate,
    employee.catchphrase,
    employee.mbti,
    employee.loveMbti,
    employee.strengths,
    employee.weaknesses,
    employee.hobby,
    employee.favorites,
    employee.workStyle,
    employee.personalityType,
    employee.characterInOffice,
    employee.freeComment,
    employee.rarity,
    employee.cardType,
    JSON.stringify(employee.tags),
    JSON.stringify(employee.stats)
  ).run()
}

async function updateEmployeeRow(db: D1Database, employee: Employee) {
  await db.prepare(`
    UPDATE employees SET
      number = ?,
      name = ?,
      nickname = ?,
      photo = ?,
      department = ?,
      position = ?,
      job_description = ?,
      gender = ?,
      birth_date = ?,
      area = ?,
      join_date = ?,
      catchphrase = ?,
      mbti = ?,
      love_mbti = ?,
      strengths = ?,
      weaknesses = ?,
      hobby = ?,
      favorites = ?,
      work_style = ?,
      personality_type = ?,
      character_in_office = ?,
      free_comment = ?,
      rarity = ?,
      card_type = ?,
      tags = ?,
      stats = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    employee.number,
    employee.name,
    employee.nickname,
    employee.photo,
    employee.department,
    employee.position,
    employee.jobDescription,
    employee.gender,
    employee.birthDate,
    employee.area,
    employee.joinDate,
    employee.catchphrase,
    employee.mbti,
    employee.loveMbti,
    employee.strengths,
    employee.weaknesses,
    employee.hobby,
    employee.favorites,
    employee.workStyle,
    employee.personalityType,
    employee.characterInOffice,
    employee.freeComment,
    employee.rarity,
    employee.cardType,
    JSON.stringify(employee.tags),
    JSON.stringify(employee.stats),
    employee.id
  ).run()
}

async function getEmployeeRow(db: D1Database, id: string) {
  return db.prepare('SELECT * FROM employees WHERE id = ?').bind(id).first<EmployeeRow>()
}

function isAdmin(c: AppContext) {
  return getCookie(c, ADMIN_COOKIE) === '1'
}

function requireAdmin(c: AppContext) {
  if (isAdmin(c)) return null
  return c.json({ error: 'Unauthorized' }, 401)
}

function getClientId(c: AppContext) {
  let clientId = getCookie(c, CLIENT_COOKIE)
  if (!clientId) {
    clientId = crypto.randomUUID()
    setCookie(c, CLIENT_COOKIE, clientId, {
      httpOnly: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: ONE_YEAR_SECONDS
    })
  }
  return clientId
}

async function getFavoriteIds(db: D1Database, clientId: string) {
  const { results } = await db.prepare(`
    SELECT employee_id
    FROM favorite_employees
    WHERE client_id = ?
    ORDER BY created_at DESC
  `).bind(clientId).all<{ employee_id: string }>()
  return results.map((row) => row.employee_id)
}

async function getMasters(db: D1Database) {
  const row = await db
    .prepare("SELECT value FROM app_settings WHERE key = 'masters'")
    .first<{ value: string }>()
  return row ? parseJson<JsonRecord>(row.value, {}) : {}
}

async function saveMasters(db: D1Database, masters: JsonRecord) {
  await db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES ('masters', ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = CURRENT_TIMESTAMP
  `).bind(JSON.stringify(masters)).run()
}

// D1 connection check
app.get('/api/health', async (c) => {
  const result = await c.env.DB.prepare('SELECT 1 as ok').first()
  return c.json({ ok: true, db: result })
})

app.get('/api/admin/session', (c) => {
  return c.json({ loggedIn: isAdmin(c) })
})

app.post('/api/admin/login', async (c) => {
  const body = await readJsonBody(c)
  if (body.passcode !== ADMIN_PASSCODE) {
    return c.json({ loggedIn: false, error: 'Invalid passcode' }, 401)
  }

  setCookie(c, ADMIN_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: 60 * 60 * 12
  })
  return c.json({ loggedIn: true })
})

app.post('/api/admin/logout', (c) => {
  deleteCookie(c, ADMIN_COOKIE, { path: '/' })
  return c.json({ loggedIn: false })
})

app.get('/api/masters', async (c) => {
  return c.json(await getMasters(c.env.DB))
})

app.put('/api/masters', async (c) => {
  const unauthorized = requireAdmin(c)
  if (unauthorized) return unauthorized

  const body = await readJsonBody(c)
  await saveMasters(c.env.DB, body)
  return c.json(body)
})

app.get('/api/favorites', async (c) => {
  const clientId = getClientId(c)
  return c.json(await getFavoriteIds(c.env.DB, clientId))
})

app.post('/api/favorites/:id', async (c) => {
  const clientId = getClientId(c)
  const employeeId = c.req.param('id')

  await c.env.DB.prepare(`
    INSERT OR IGNORE INTO favorite_employees (client_id, employee_id)
    VALUES (?, ?)
  `).bind(clientId, employeeId).run()

  return c.json({
    favorite: true,
    favorites: await getFavoriteIds(c.env.DB, clientId)
  })
})

app.delete('/api/favorites/:id', async (c) => {
  const clientId = getClientId(c)
  const employeeId = c.req.param('id')

  await c.env.DB.prepare(`
    DELETE FROM favorite_employees
    WHERE client_id = ? AND employee_id = ?
  `).bind(clientId, employeeId).run()

  return c.json({
    favorite: false,
    favorites: await getFavoriteIds(c.env.DB, clientId)
  })
})

// Employee list
app.get('/api/employees', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT * FROM employees ORDER BY number ASC, created_at ASC')
    .all<EmployeeRow>()

  return c.json(results.map(toEmployee))
})

// Employee detail
app.get('/api/employees/:id', async (c) => {
  const employee = await getEmployeeRow(c.env.DB, c.req.param('id'))

  if (!employee) {
    return c.json({ error: 'Employee not found' }, 404)
  }

  return c.json(toEmployee(employee))
})

// Employee create
app.post('/api/employees', async (c) => {
  const unauthorized = requireAdmin(c)
  if (unauthorized) return unauthorized

  const body = await readJsonBody(c)
  const empty: Employee = {
    id: 'emp' + Date.now(),
    number: await nextEmployeeNumber(c.env.DB),
    name: '',
    nickname: '',
    photo: '/static/images/employees/001.png',
    department: '',
    position: '',
    jobDescription: '',
    gender: '',
    birthDate: '',
    area: '',
    joinDate: '',
    catchphrase: '',
    mbti: '',
    loveMbti: '',
    strengths: '',
    weaknesses: '',
    hobby: '',
    favorites: '',
    workStyle: '',
    personalityType: '',
    characterInOffice: '',
    freeComment: '',
    rarity: 'N',
    cardType: '',
    stats: {},
    tags: []
  }
  const employee = mergeEmployee(body, empty)

  await insertEmployee(c.env.DB, employee)
  return c.json(employee, 201)
})

// Employee update
app.put('/api/employees/:id', async (c) => {
  const unauthorized = requireAdmin(c)
  if (unauthorized) return unauthorized

  const id = c.req.param('id')
  const row = await getEmployeeRow(c.env.DB, id)
  if (!row) {
    return c.json({ error: 'Employee not found' }, 404)
  }

  const body = await readJsonBody(c)
  const employee = mergeEmployee(body, toEmployee(row))

  await updateEmployeeRow(c.env.DB, employee)
  return c.json(employee)
})

// Employee delete
app.delete('/api/employees/:id', async (c) => {
  const unauthorized = requireAdmin(c)
  if (unauthorized) return unauthorized

  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM favorite_employees WHERE employee_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM employees WHERE id = ?').bind(id).run()

  return c.json({ ok: true, id })
})

app.use(renderer)

// SPA: return the same shell for every route and let the client-side router handle it.
app.get('*', (c) => {
  return c.render(<></>)
})

export default app
