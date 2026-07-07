import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'

type Env = {
  Bindings: {
    DB: D1Database
  }
}

const app = new Hono<Env>()

app.use('/static/*', serveStatic({ root: './' }))

// D1接続確認
app.get('/api/health', async (c) => {
  const result = await c.env.DB.prepare('SELECT 1 as ok').first()
  return c.json({ ok: true, db: result })
})

// 社員一覧取得
app.get('/api/employees', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT * FROM employees ORDER BY created_at DESC')
    .all()

  return c.json(results)
})

// 社員詳細取得
app.get('/api/employees/:id', async (c) => {
  const id = c.req.param('id')

  const employee = await c.env.DB
    .prepare('SELECT * FROM employees WHERE id = ?')
    .bind(id)
    .first()

  if (!employee) {
    return c.json({ error: 'Employee not found' }, 404)
  }

  return c.json(employee)
})

// 社員追加
app.post('/api/employees', async (c) => {
  const body = await c.req.json()

  const id = body.id || crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO employees (
      id, name, nickname, department, position, gender, birthdate, area,
      joined_at, mbti, love_mbti, catch_copy, strengths, weaknesses,
      hobbies, favorites, work_style, personality, character_type, comment,
      photo_url, rarity, card_type, tags, stats
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.name || '',
    body.nickname || '',
    body.department || '',
    body.position || '',
    body.gender || '',
    body.birthdate || '',
    body.area || '',
    body.joined_at || '',
    body.mbti || '',
    body.love_mbti || '',
    body.catch_copy || '',
    body.strengths || '',
    body.weaknesses || '',
    body.hobbies || '',
    body.favorites || '',
    body.work_style || '',
    body.personality || '',
    body.character_type || '',
    body.comment || '',
    body.photo_url || '',
    body.rarity || 'N',
    body.card_type || '',
    JSON.stringify(body.tags || []),
    JSON.stringify(body.stats || {})
  ).run()

  return c.json({ ok: true, id })
})

// 社員更新
app.put('/api/employees/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()

  await c.env.DB.prepare(`
    UPDATE employees SET
      name = ?,
      nickname = ?,
      department = ?,
      position = ?,
      gender = ?,
      birthdate = ?,
      area = ?,
      joined_at = ?,
      mbti = ?,
      love_mbti = ?,
      catch_copy = ?,
      strengths = ?,
      weaknesses = ?,
      hobbies = ?,
      favorites = ?,
      work_style = ?,
      personality = ?,
      character_type = ?,
      comment = ?,
      photo_url = ?,
      rarity = ?,
      card_type = ?,
      tags = ?,
      stats = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    body.name || '',
    body.nickname || '',
    body.department || '',
    body.position || '',
    body.gender || '',
    body.birthdate || '',
    body.area || '',
    body.joined_at || '',
    body.mbti || '',
    body.love_mbti || '',
    body.catch_copy || '',
    body.strengths || '',
    body.weaknesses || '',
    body.hobbies || '',
    body.favorites || '',
    body.work_style || '',
    body.personality || '',
    body.character_type || '',
    body.comment || '',
    body.photo_url || '',
    body.rarity || 'N',
    body.card_type || '',
    JSON.stringify(body.tags || []),
    JSON.stringify(body.stats || {}),
    id
  ).run()

  return c.json({ ok: true, id })
})

// 社員削除
app.delete('/api/employees/:id', async (c) => {
  const id = c.req.param('id')

  await c.env.DB
    .prepare('DELETE FROM employees WHERE id = ?')
    .bind(id)
    .run()

  return c.json({ ok: true, id })
})

app.use(renderer)

// SPA: すべてのルートで同じシェルを返し、クライアント側ルーターに任せる
app.get('*', (c) => {
  return c.render(<></>)
})

export default app