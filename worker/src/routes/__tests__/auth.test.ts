import { describe, it, expect } from 'vitest'
import app from '../../index'
import type { Env } from '../../types'

interface ApiResponse {
  success: boolean
  error?: string
  status?: string
  user?: {
    codename?: string
    role?: string
    clearance?: number
    password?: string
    [key: string]: unknown
  }
  token?: string
}

async function parseJson(res: Response): Promise<ApiResponse> {
  return res.json() as Promise<ApiResponse>
}

// Mock D1 database - simple in-memory implementation
function createMockDB() {
  const users: Map<number, any> = new Map()
  let nextId = 1

  return {
    prepare: (sql: string) => {
      const stmt = {
        _sql: sql,
        _params: [] as any[],
        bind(...params: any[]) {
          stmt._params = params
          return stmt
        },
        first: async (): Promise<any> => {
          // Handle different SQL queries
          if (sql.includes('SELECT id FROM users WHERE codename = ?') && sql.includes('AND id != ?')) {
            const [codename, id] = stmt._params
            for (const user of users.values()) {
              if (user.codename === codename && user.id !== id) return user
            }
            return null
          }
          if (sql.includes('SELECT id FROM users WHERE codename = ?')) {
            const [codename] = stmt._params
            for (const user of users.values()) {
              if (user.codename === codename) return user
            }
            return null
          }
          if (sql.includes('SELECT * FROM users WHERE codename = ?')) {
            const [codename] = stmt._params
            for (const user of users.values()) {
              if (user.codename === codename) return user
            }
            return null
          }
          if (sql.includes('SELECT * FROM users WHERE id = ?')) {
            const [id] = stmt._params
            return users.get(id) || null
          }
          if (sql.includes('INSERT INTO users')) {
            const [codename, password] = stmt._params
            const user = {
              id: nextId++,
              codename,
              password,
              role: 'personnel',
              clearance: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            users.set(user.id, user)
            return user
          }
          if (sql.includes('UPDATE users')) {
            const [codename, password, id] = stmt._params
            const user = users.get(id)
            if (user) {
              user.codename = codename
              user.password = password
              user.updated_at = new Date().toISOString()
              return user
            }
            return null
          }
          return null
        },
      }
      return stmt
    },
  }
}

const TEST_JWT_SECRET = 'test-jwt-secret-for-testing-purposes-only'

function createEnv(overrides?: Partial<Env>): Env {
  return {
    DB: createMockDB() as any,
    JWT_SECRET: TEST_JWT_SECRET,
    CORS_ORIGINS: 'https://scp.lat,https://*.scp.lat',
    SCP_EN_CRAWLER: {} as DurableObjectNamespace,
    SCP_CN_CRAWLER: {} as DurableObjectNamespace,
    ...overrides,
  } as Env
}

describe('Auth Routes', () => {
  describe('POST /api/v1/auth/register', () => {
    it('registers a new user successfully', async () => {
      const res = await app.request(
        '/api/v1/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codename: 'test_agent', password: 'password123' }),
        },
        createEnv()
      )
      const json = await parseJson(res)
      expect(res.status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.user?.codename).toBe('test_agent')
      expect(json.user?.role).toBe('personnel')
      expect(json.user?.clearance).toBe(1)
      expect(json.token).toBeTruthy()
      // Should not expose password
      expect(json.user?.password).toBeUndefined()
    })

    it('rejects codename that is too short', async () => {
      const res = await app.request(
        '/api/v1/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codename: 'ab', password: 'password123' }),
        },
        createEnv()
      )
      const json = await parseJson(res)
      expect(res.status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error).toContain('3-32')
    })

    it('rejects codename with special characters', async () => {
      const res = await app.request(
        '/api/v1/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codename: 'invalid-name!', password: 'password123' }),
        },
        createEnv()
      )
      const json = await parseJson(res)
      expect(res.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('rejects password that is too short', async () => {
      const res = await app.request(
        '/api/v1/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codename: 'valid_name', password: 'short' }),
        },
        createEnv()
      )
      const json = await parseJson(res)
      expect(res.status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error).toContain('8-128')
    })

    it('rejects duplicate codename', async () => {
      const env = createEnv()
      // Register first user
      await app.request(
        '/api/v1/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codename: 'taken_name', password: 'password123' }),
        },
        env
      )

      // Try to register with same codename
      const res = await app.request(
        '/api/v1/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codename: 'taken_name', password: 'password456' }),
        },
        env
      )
      const json = await parseJson(res)
      expect(res.status).toBe(409)
      expect(json.success).toBe(false)
      expect(json.error).toContain('already taken')
    })
  })

  describe('POST /api/v1/auth/login', () => {
    it('logs in with correct credentials', async () => {
      const env = createEnv()
      // Register first
      await app.request(
        '/api/v1/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codename: 'login_agent', password: 'password123' }),
        },
        env
      )

      // Login
      const res = await app.request(
        '/api/v1/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codename: 'login_agent', password: 'password123' }),
        },
        env
      )
      const json = await parseJson(res)
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.user?.codename).toBe('login_agent')
      expect(json.token).toBeTruthy()
    })

    it('rejects wrong password', async () => {
      const env = createEnv()
      await app.request(
        '/api/v1/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codename: 'login_agent2', password: 'password123' }),
        },
        env
      )

      const res = await app.request(
        '/api/v1/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codename: 'login_agent2', password: 'wrongpassword' }),
        },
        env
      )
      const json = await parseJson(res)
      expect(res.status).toBe(401)
      expect(json.success).toBe(false)
      expect(json.error).toContain('Invalid')
    })

    it('rejects nonexistent user', async () => {
      const res = await app.request(
        '/api/v1/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codename: 'nonexistent', password: 'password123' }),
        },
        createEnv()
      )
      const json = await parseJson(res)
      expect(res.status).toBe(401)
      expect(json.success).toBe(false)
    })

    it('rejects missing codename', async () => {
      const res = await app.request(
        '/api/v1/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'password123' }),
        },
        createEnv()
      )
      const json = await parseJson(res)
      expect(res.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('rejects missing password', async () => {
      const res = await app.request(
        '/api/v1/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codename: 'agent' }),
        },
        createEnv()
      )
      const json = await parseJson(res)
      expect(res.status).toBe(400)
      expect(json.success).toBe(false)
    })
  })

  describe('GET /api/v1/auth/me', () => {
    it('returns user profile with valid token', async () => {
      const env = createEnv()
      // Register and get token
      const regRes = await app.request(
        '/api/v1/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codename: 'profile_agent', password: 'password123' }),
        },
        env
      )
      const regJson = await parseJson(regRes)
      const token = regJson.token

      const res = await app.request(
        '/api/v1/auth/me',
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        },
        env
      )
      const json = await parseJson(res)
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.user?.codename).toBe('profile_agent')
    })

    it('returns 401 without token', async () => {
      const res = await app.request('/api/v1/auth/me', { method: 'GET' }, createEnv())
      const json = await parseJson(res)
      expect(res.status).toBe(401)
      expect(json.success).toBe(false)
    })

    it('returns 401 with invalid token', async () => {
      const res = await app.request(
        '/api/v1/auth/me',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer invalid.token.here' },
        },
        createEnv()
      )
      const json = await parseJson(res)
      expect(res.status).toBe(401)
      expect(json.success).toBe(false)
    })
  })

  describe('PUT /api/v1/auth/profile', () => {
    async function setupAuthenticatedUser() {
      const env = createEnv()
      const regRes = await app.request(
        '/api/v1/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codename: 'profile_user', password: 'password123' }),
        },
        env
      )
      const regJson = await parseJson(regRes)
      return { env, token: regJson.token, user: regJson.user }
    }

    it('updates codename', async () => {
      const { env, token } = await setupAuthenticatedUser()

      const res = await app.request(
        '/api/v1/auth/profile',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ codename: 'new_codename' }),
        },
        env
      )
      const json = await parseJson(res)
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.user?.codename).toBe('new_codename')
    })

    it('changes password with current password verification', async () => {
      const { env, token } = await setupAuthenticatedUser()

      const res = await app.request(
        '/api/v1/auth/profile',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password: 'password123', newPassword: 'newpassword123' }),
        },
        env
      )
      const json = await parseJson(res)
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
    })

    it('rejects new password without current password', async () => {
      const { env, token } = await setupAuthenticatedUser()

      const res = await app.request(
        '/api/v1/auth/profile',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newPassword: 'newpassword123' }),
        },
        env
      )
      const json = await parseJson(res)
      expect(res.status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error).toContain('Current password is required')
    })

    it('rejects incorrect current password', async () => {
      const { env, token } = await setupAuthenticatedUser()

      const res = await app.request(
        '/api/v1/auth/profile',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password: 'wrongpassword', newPassword: 'newpassword123' }),
        },
        env
      )
      const json = await parseJson(res)
      expect(res.status).toBe(401)
      expect(json.success).toBe(false)
      expect(json.error).toContain('incorrect')
    })

    it('rejects duplicate codename', async () => {
      const env = createEnv()
      // Register two users
      await app.request(
        '/api/v1/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codename: 'user_one', password: 'password123' }),
        },
        env
      )
      const regRes2 = await app.request(
        '/api/v1/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codename: 'user_two', password: 'password123' }),
        },
        env
      )
      const regJson2 = await parseJson(regRes2)

      // Try to change user_two's codename to user_one
      const res = await app.request(
        '/api/v1/auth/profile',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${regJson2.token}`,
          },
          body: JSON.stringify({ codename: 'user_one' }),
        },
        env
      )
      const json = await parseJson(res)
      expect(res.status).toBe(409)
      expect(json.success).toBe(false)
      expect(json.error).toContain('already taken')
    })

    it('returns 401 without authentication', async () => {
      const res = await app.request(
        '/api/v1/auth/profile',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codename: 'new_name' }),
        },
        createEnv()
      )
      const json = await parseJson(res)
      expect(res.status).toBe(401)
      expect(json.success).toBe(false)
    })
  })

  describe('Health check', () => {
    it('returns ok status', async () => {
      const res = await app.request('/api/health', { method: 'GET' }, createEnv())
      const json = await parseJson(res)
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.status).toBe('ok')
    })
  })

  describe('404 fallback', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await app.request('/api/nonexistent', { method: 'GET' }, createEnv())
      const json = await parseJson(res)
      expect(res.status).toBe(404)
      expect(json.success).toBe(false)
    })
  })
})
