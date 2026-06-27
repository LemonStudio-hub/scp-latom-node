import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import type { Env, HistoryEntry, JwtPayload } from '../types'

const history = new Hono<{ Bindings: Env; Variables: { user: JwtPayload } }>()

const MAX_HISTORY_PER_USER = 500

// All history routes require authentication
history.use('/*', authMiddleware)

// ─── GET /api/history ─────────────────────────────────────
// Paginated browsing history for the authenticated user.
// Query params: page (default 1), limit (default 50, max 200), lang (optional filter)
history.get('/', async (c) => {
  const payload = c.get('user')
  const url = new URL(c.req.url)

  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') ?? '50', 10) || 50))
  const langFilter = url.searchParams.get('lang')

  let where = 'WHERE user_id = ?'
  const params: unknown[] = [payload.sub]

  if (langFilter === 'en' || langFilter === 'cn') {
    where += ' AND language = ?'
    params.push(langFilter)
  }

  // Count total
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM browsing_history ${where}`
  ).bind(...params).first<{ total: number }>()
  const total = countResult?.total ?? 0

  const totalPages = Math.ceil(total / limit)
  const offset = (page - 1) * limit

  // Fetch page
  const rows = await c.env.DB.prepare(
    `SELECT id, user_id, language, scp_number, name, object_class, visited_at FROM browsing_history ${where} ORDER BY visited_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all<HistoryEntry>()

  return c.json({
    success: true,
    entries: rows.results,
    total,
    page,
    limit,
    totalPages,
  })
})

// ─── POST /api/history ────────────────────────────────────
// Record a visit to an SCP entry. Upserts — if the user already
// visited this entry, the timestamp is updated.
// Body: { language, scpNumber, name?, objectClass? }
history.post('/', async (c) => {
  const payload = c.get('user')
  const body = await c.req.json<{ language?: string; scpNumber?: number; name?: string; objectClass?: string }>()

  const language = body.language
  const scpNumber = body.scpNumber

  if (!language || (language !== 'en' && language !== 'cn')) {
    return c.json({ success: false, error: "language must be 'en' or 'cn'" }, 400)
  }
  if (!scpNumber || scpNumber < 1) {
    return c.json({ success: false, error: 'scpNumber must be a positive integer' }, 400)
  }

  const name = body.name ?? ''
  const objectClass = body.objectClass ?? 'Unknown'

  // Upsert: insert or update timestamp + metadata
  await c.env.DB.prepare(`
    INSERT INTO browsing_history (user_id, language, scp_number, name, object_class, visited_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, language, scp_number) DO UPDATE SET
      visited_at = datetime('now'),
      name = excluded.name,
      object_class = excluded.object_class
  `).bind(payload.sub, language, scpNumber, name, objectClass).run()

  // Prune old entries if over limit
  const countRow = await c.env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM browsing_history WHERE user_id = ?'
  ).bind(payload.sub).first<{ cnt: number }>()

  if (countRow && countRow.cnt > MAX_HISTORY_PER_USER) {
    const excess = countRow.cnt - MAX_HISTORY_PER_USER
    await c.env.DB.prepare(`
      DELETE FROM browsing_history WHERE id IN (
        SELECT id FROM browsing_history WHERE user_id = ? ORDER BY visited_at ASC LIMIT ?
      )
    `).bind(payload.sub, excess).run()
  }

  return c.json({ success: true })
})

// ─── DELETE /api/history/:id ──────────────────────────────
// Delete a single history entry (must belong to the user).
history.delete('/:id', async (c) => {
  const payload = c.get('user')
  const id = parseInt(c.req.param('id'), 10)

  if (isNaN(id) || id < 1) {
    return c.json({ success: false, error: 'Invalid id' }, 400)
  }

  const existing = await c.env.DB.prepare(
    'SELECT id FROM browsing_history WHERE id = ? AND user_id = ?'
  ).bind(id, payload.sub).first()

  if (!existing) {
    return c.json({ success: false, error: 'Entry not found' }, 404)
  }

  await c.env.DB.prepare('DELETE FROM browsing_history WHERE id = ?').bind(id).run()

  return c.json({ success: true })
})

// ─── DELETE /api/history ──────────────────────────────────
// Clear all browsing history for the authenticated user.
history.delete('/', async (c) => {
  const payload = c.get('user')

  await c.env.DB.prepare(
    'DELETE FROM browsing_history WHERE user_id = ?'
  ).bind(payload.sub).run()

  return c.json({ success: true })
})

export default history
