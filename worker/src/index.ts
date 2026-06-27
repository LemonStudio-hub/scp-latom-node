import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes from './routes/auth'
import crawlerRoutes from './routes/crawler'
import historyRoutes from './routes/history'
import proposalRoutes from './routes/proposals'
import bookmarkRoutes from './routes/bookmarks'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

function isOriginAllowed(origin: string, allowed: string): boolean {
  // Exact match
  if (origin === allowed) return true
  // Wildcard subdomain match: https://*.example.com matches https://foo.example.com
  if (allowed.includes('*')) {
    const pattern = allowed.replace(/\./g, '\\.').replace(/\*/g, '[a-zA-Z0-9-]+')
    return new RegExp(`^${pattern}$`).test(origin)
  }
  return false
}

// CORS — applied to all versioned API routes
app.use('/api/v1/*', cors({
  origin: (origin, c) => {
    if (!origin) return ''
    const allowedList = (c.env.CORS_ORIGINS || '').split(',').map((s: string) => s.trim()).filter(Boolean)
    const allowed = allowedList.some((pattern: string) => isOriginAllowed(origin, pattern))
    return allowed ? origin : ''
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}))

// Health check (unversioned — operational endpoint)
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    status: 'ok',
    service: 'scp-latom-node-api',
    timestamp: new Date().toISOString(),
  })
})

// ─── v1 Routes ─────────────────────────────────────────────

app.route('/api/v1/auth', authRoutes)
app.route('/api/v1/crawler', crawlerRoutes)
app.route('/api/v1/history', historyRoutes)
app.route('/api/v1/proposals', proposalRoutes)
app.route('/api/v1/bookmarks', bookmarkRoutes)

// 404 fallback
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404)
})

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ success: false, error: 'Internal server error' }, 500)
})

export default app

// Re-export Durable Object class for wrangler
export { ScpCrawlerDo } from './do/scp-crawler'
