import { Hono } from 'hono'
import { hashPassword, verifyPassword } from '../utils/password'
import { signToken } from '../utils/jwt'
import { authMiddleware } from '../middleware/auth'
import { getLoggerFromContext } from '../utils/logger'
import type { Env, User, UserPublic } from '../types'

const auth = new Hono<{ Bindings: Env }>()

// Validation
const CODENAME_RE = /^[a-zA-Z0-9_]{3,32}$/
const MIN_PWD_LEN = 8
const MAX_PWD_LEN = 128

function validateCodename(codename: string): string | null {
  if (!codename || !CODENAME_RE.test(codename)) {
    return 'Codename must be 3-32 characters, alphanumeric or underscore only'
  }
  return null
}

function validatePassword(password: string): string | null {
  if (!password || password.length < MIN_PWD_LEN || password.length > MAX_PWD_LEN) {
    return `Password must be ${MIN_PWD_LEN}-${MAX_PWD_LEN} characters`
  }
  return null
}

function toPublic(user: User): UserPublic {
  return {
    id: user.id,
    codename: user.codename,
    role: user.role,
    clearance: user.clearance,
    created_at: user.created_at,
  }
}

// POST /api/auth/register
auth.post('/register', async (c) => {
  const logger = getLoggerFromContext(c).child({ category: 'auth' })
  const body = await c.req.json<{ codename?: string; password?: string }>()
  const codename = body.codename?.trim()
  const password = body.password ?? ''

  const codenameErr = validateCodename(codename ?? '')
  if (codenameErr) return c.json({ success: false, error: codenameErr }, 400)

  const pwdErr = validatePassword(password)
  if (pwdErr) return c.json({ success: false, error: pwdErr }, 400)

  // Check if codename exists
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE codename = ?').bind(codename).first()
  if (existing) {
    logger.warn('Registration failed: codename already taken', { codename })
    return c.json({ success: false, error: 'Codename already taken' }, 409)
  }

  const hashed = await hashPassword(password)
  const result = await c.env.DB.prepare(
    'INSERT INTO users (codename, password) VALUES (?, ?) RETURNING *'
  )
    .bind(codename, hashed)
    .first<User>()

  if (!result) {
    logger.error('Registration failed: DB insert returned no result', { codename })
    return c.json({ success: false, error: 'Registration failed' }, 500)
  }

  const token = await signToken(
    { sub: result.id, codename: result.codename, role: result.role, clearance: result.clearance },
    c.env.JWT_SECRET
  )

  logger.info('User registered', { userId: result.id, codename: result.codename })
  return c.json({ success: true, user: toPublic(result), token }, 201)
})

// POST /api/auth/login
auth.post('/login', async (c) => {
  const logger = getLoggerFromContext(c).child({ category: 'auth' })
  const body = await c.req.json<{ codename?: string; password?: string }>()
  const codename = body.codename?.trim()
  const password = body.password ?? ''

  if (!codename || !password) {
    return c.json({ success: false, error: 'Codename and password are required' }, 400)
  }

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE codename = ?')
    .bind(codename)
    .first<User>()

  if (!user) {
    logger.warn('Login failed: user not found', { codename })
    return c.json({ success: false, error: 'Invalid codename or password' }, 401)
  }

  const valid = await verifyPassword(password, user.password)
  if (!valid) {
    logger.warn('Login failed: invalid password', { codename, userId: user.id })
    return c.json({ success: false, error: 'Invalid codename or password' }, 401)
  }

  const token = await signToken(
    { sub: user.id, codename: user.codename, role: user.role, clearance: user.clearance },
    c.env.JWT_SECRET
  )

  logger.info('User logged in', { userId: user.id, codename: user.codename })
  return c.json({ success: true, user: toPublic(user), token })
})

// GET /api/auth/me
auth.get('/me', authMiddleware, async (c) => {
  const payload = c.get('user')
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(payload.sub)
    .first<User>()

  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404)
  }

  return c.json({ success: true, user: toPublic(user) })
})

// PUT /api/auth/profile
auth.put('/profile', authMiddleware, async (c) => {
  const logger = getLoggerFromContext(c).child({ category: 'auth' })
  const payload = c.get('user')
  const body = await c.req.json<{ codename?: string; password?: string; newPassword?: string }>()

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(payload.sub)
    .first<User>()

  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404)
  }

  // If changing password, verify current password first
  if (body.newPassword) {
    if (!body.password) {
      return c.json({ success: false, error: 'Current password is required to set a new one' }, 400)
    }
    const valid = await verifyPassword(body.password, user.password)
    if (!valid) {
      logger.warn('Profile update failed: incorrect current password', { userId: user.id })
      return c.json({ success: false, error: 'Current password is incorrect' }, 401)
    }
    const pwdErr = validatePassword(body.newPassword)
    if (pwdErr) return c.json({ success: false, error: pwdErr }, 400)
  }

  // If changing codename, check uniqueness
  if (body.codename && body.codename !== user.codename) {
    const codenameErr = validateCodename(body.codename)
    if (codenameErr) return c.json({ success: false, error: codenameErr }, 400)
    const taken = await c.env.DB.prepare('SELECT id FROM users WHERE codename = ? AND id != ?')
      .bind(body.codename, user.id)
      .first()
    if (taken) {
      return c.json({ success: false, error: 'Codename already taken' }, 409)
    }
  }

  const newCodename = body.codename ?? user.codename
  const newHashedPwd = body.newPassword ? await hashPassword(body.newPassword) : user.password

  const updated = await c.env.DB.prepare(
    "UPDATE users SET codename = ?, password = ?, updated_at = datetime('now') WHERE id = ? RETURNING *"
  )
    .bind(newCodename, newHashedPwd, user.id)
    .first<User>()

  if (!updated) {
    logger.error('Profile update failed: DB update returned no result', { userId: user.id })
    return c.json({ success: false, error: 'Update failed' }, 500)
  }

  logger.info('Profile updated', { userId: updated.id, codename: updated.codename })
  return c.json({ success: true, user: toPublic(updated) })
})

export default auth
