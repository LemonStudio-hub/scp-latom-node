import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import type { Env, JwtPayload, BookmarkPublic } from '../types'

const bookmarks = new Hono<{ Bindings: Env; Variables: { user: JwtPayload } }>()

// All bookmark routes require authentication
bookmarks.use('/*', authMiddleware)

// ─── GET /api/bookmarks ────────────────────────────────────
// List all bookmarks for the current user

bookmarks.get('/', async (c) => {
  const user = c.get('user')

  const rows = await c.env.DB.prepare(
    `SELECT b.scp_number, b.language, b.created_at,
            e.name, e.object_class
     FROM bookmarks b
     LEFT JOIN scp_entries e ON b.scp_number = e.scp_number AND b.language = e.language
     WHERE b.user_id = ?
     ORDER BY b.created_at DESC`
  ).bind(user.sub).all<{
    scp_number: number
    language: string
    created_at: string
    name: string | null
    object_class: string | null
  }>()

  const result: BookmarkPublic[] = rows.results.map((r) => ({
    scpNumber: r.scp_number,
    language: r.language,
    name: r.name,
    objectClass: r.object_class,
    createdAt: r.created_at,
  }))

  return c.json({ success: true, bookmarks: result })
})

// ─── GET /api/bookmarks/:lang/:scpNumber ───────────────────
// Check if an entry is bookmarked

bookmarks.get('/:lang/:scpNumber', async (c) => {
  const user = c.get('user')
  const lang = c.req.param('lang')
  const scpNumber = parseInt(c.req.param('scpNumber') ?? '', 10)

  if (lang !== 'en' && lang !== 'cn') {
    return c.json({ success: false, error: 'Invalid language. Use "en" or "cn"' }, 400)
  }
  if (isNaN(scpNumber) || scpNumber < 1) {
    return c.json({ success: false, error: 'Invalid SCP number' }, 400)
  }

  const row = await c.env.DB.prepare(
    'SELECT id FROM bookmarks WHERE user_id = ? AND scp_number = ? AND language = ?'
  ).bind(user.sub, scpNumber, lang).first<{ id: number }>()

  return c.json({ success: true, bookmarked: !!row })
})

// ─── POST /api/bookmarks/:lang/:scpNumber ──────────────────
// Add a bookmark

bookmarks.post('/:lang/:scpNumber', async (c) => {
  const user = c.get('user')
  const lang = c.req.param('lang')
  const scpNumber = parseInt(c.req.param('scpNumber') ?? '', 10)

  if (lang !== 'en' && lang !== 'cn') {
    return c.json({ success: false, error: 'Invalid language. Use "en" or "cn"' }, 400)
  }
  if (isNaN(scpNumber) || scpNumber < 1) {
    return c.json({ success: false, error: 'Invalid SCP number' }, 400)
  }

  // Check for duplicate
  const existing = await c.env.DB.prepare(
    'SELECT id FROM bookmarks WHERE user_id = ? AND scp_number = ? AND language = ?'
  ).bind(user.sub, scpNumber, lang).first<{ id: number }>()

  if (existing) {
    return c.json({ success: false, error: 'Entry already bookmarked' }, 409)
  }

  await c.env.DB.prepare(
    'INSERT INTO bookmarks (user_id, scp_number, language) VALUES (?, ?, ?)'
  ).bind(user.sub, scpNumber, lang).run()

  return c.json({ success: true, message: 'Bookmark added' }, 201)
})

// ─── DELETE /api/bookmarks/:lang/:scpNumber ────────────────
// Remove a bookmark

bookmarks.delete('/:lang/:scpNumber', async (c) => {
  const user = c.get('user')
  const lang = c.req.param('lang')
  const scpNumber = parseInt(c.req.param('scpNumber') ?? '', 10)

  if (lang !== 'en' && lang !== 'cn') {
    return c.json({ success: false, error: 'Invalid language. Use "en" or "cn"' }, 400)
  }
  if (isNaN(scpNumber) || scpNumber < 1) {
    return c.json({ success: false, error: 'Invalid SCP number' }, 400)
  }

  const result = await c.env.DB.prepare(
    'DELETE FROM bookmarks WHERE user_id = ? AND scp_number = ? AND language = ?'
  ).bind(user.sub, scpNumber, lang).run()

  if (result.meta.changes === 0) {
    return c.json({ success: false, error: 'Bookmark not found' }, 404)
  }

  return c.json({ success: true, message: 'Bookmark removed' })
})

export default bookmarks
