import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requestLogger } from './middleware/logger'
import { Logger } from './utils/logger'
import authRoutes from './routes/auth'
import crawlerRoutes from './routes/crawler'
import historyRoutes from './routes/history'
import proposalRoutes from './routes/proposals'
import bookmarkRoutes from './routes/bookmarks'
import logRoutes from './routes/logs'
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

// CORS
app.use('/api/*', cors({
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

// Request logging (attaches logger to context)
app.use('/api/*', async (c, next) => {
  const middleware = requestLogger(c.env)
  return middleware(c as any, next)
})

// Health check
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    status: 'ok',
    service: 'scp-latom-node-api',
    timestamp: new Date().toISOString(),
  })
})

// Auth routes
app.route('/api/auth', authRoutes)

// Crawler routes
app.route('/api/crawler', crawlerRoutes)

// History routes
app.route('/api/history', historyRoutes)

// Proposal routes
app.route('/api/proposals', proposalRoutes)

// Bookmark routes
app.route('/api/bookmarks', bookmarkRoutes)

// Client log ingestion
app.route('/api/logs', logRoutes)

// 404 fallback
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404)
})

// Global error handler
app.onError((err, c) => {
  const logger = (c as any).get?.('logger') as Logger | undefined
  if (logger) {
    logger.error('Unhandled error', { error: err })
  } else {
    // Fallback when middleware didn't run (shouldn't happen on /api/* paths)
    console.error('Unhandled error:', err)
  }
  return c.json({ success: false, error: 'Internal server error' }, 500)
})

export default app

// Re-export Durable Object class for wrangler
export { ScpCrawlerDo } from './do/scp-crawler'
