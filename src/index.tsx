import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'

const app = new Hono()

app.use('/static/*', serveStatic({ root: './' }))

app.use(renderer)

// SPA: すべてのルートで同じシェルを返し、クライアント側ルーターに任せる
app.get('*', (c) => {
  return c.render(<></>)
})

export default app
