import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import { ErrorCode } from '@/services/errors'

// Mock the API service
vi.mock('@/services/api', () => ({
  apiPost: vi.fn(),
  apiGet: vi.fn(),
  apiPut: vi.fn(),
}))

import { apiPost, apiGet, apiPut } from '@/services/api'
const mockApiPost = vi.mocked(apiPost)
const mockApiGet = vi.mocked(apiGet)
const mockApiPut = vi.mocked(apiPut)

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockApiPost.mockReset()
    mockApiGet.mockReset()
    mockApiPut.mockReset()
  })

  describe('initial state', () => {
    it('has no user by default', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
    })

    it('is not authenticated by default', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })

    it('is not loading by default', () => {
      const store = useAuthStore()
      expect(store.loading).toBe(false)
    })

    it('has no error by default', () => {
      const store = useAuthStore()
      expect(store.error).toBe('')
    })
  })

  describe('isAuthenticated', () => {
    it('is true when both token and user are set', () => {
      const store = useAuthStore()
      // Simulate a successful login result
      mockApiPost.mockResolvedValueOnce({
        ok: true,
        data: {
          user: { id: 1, codename: 'agent', role: 'personnel', clearance: 1 },
          token: 'abc123',
        },
      })
      // We can't easily test the computed without calling the action,
      // so let's test via login
    })
  })

  describe('login', () => {
    it('calls apiPost with correct endpoint and credentials', async () => {
      mockApiPost.mockResolvedValueOnce({
        ok: true,
        data: {
          user: { id: 1, codename: 'agent', role: 'personnel', clearance: 1 },
          token: 'abc123',
        },
      })

      const store = useAuthStore()
      const result = await store.login('agent', 'password123')

      expect(result).toBe(true)
      expect(mockApiPost).toHaveBeenCalledWith('/auth/login', {
        codename: 'agent',
        password: 'password123',
      })
    })

    it('sets user and token on success', async () => {
      mockApiPost.mockResolvedValueOnce({
        ok: true,
        data: {
          user: { id: 1, codename: 'agent', role: 'personnel', clearance: 1 },
          token: 'abc123',
        },
      })

      const store = useAuthStore()
      await store.login('agent', 'password123')

      expect(store.user).toEqual({ id: 1, codename: 'agent', role: 'personnel', clearance: 1 })
      expect(store.token).toBe('abc123')
      expect(store.isAuthenticated).toBe(true)
      expect(store.error).toBe('')
    })

    it('persists token to localStorage on success', async () => {
      mockApiPost.mockResolvedValueOnce({
        ok: true,
        data: {
          user: { id: 1, codename: 'agent', role: 'personnel', clearance: 1 },
          token: 'abc123',
        },
      })

      const store = useAuthStore()
      await store.login('agent', 'password123')

      expect(localStorage.getItem('scp-auth-token')).toBe('abc123')
    })

    it('sets error on failure', async () => {
      mockApiPost.mockResolvedValueOnce({
        ok: false,
        code: ErrorCode.UNAUTHORIZED,
        error: 'Invalid codename or password',
      })

      const store = useAuthStore()
      const result = await store.login('agent', 'wrong')

      expect(result).toBe(false)
      expect(store.error).toBe('Invalid codename or password')
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('uses fallback error when API returns no error message', async () => {
      mockApiPost.mockResolvedValueOnce({
        ok: false,
        code: ErrorCode.AUTH_INVALID,
        error: '',
      })

      const store = useAuthStore()
      const result = await store.login('agent', 'wrong')

      expect(result).toBe(false)
      expect(store.error).toBeTruthy()
    })

    it('manages loading state', async () => {
      let resolvePromise: (value: any) => void
      const pending = new Promise((resolve) => { resolvePromise = resolve })
      mockApiPost.mockReturnValueOnce(pending as any)

      const store = useAuthStore()
      const loginPromise = store.login('agent', 'pass1234')

      expect(store.loading).toBe(true)

      resolvePromise!({
        ok: true,
        data: { user: { id: 1, codename: 'agent', role: 'personnel', clearance: 1 }, token: 't' },
      })
      await loginPromise

      expect(store.loading).toBe(false)
    })
  })

  describe('register', () => {
    it('calls apiPost with correct endpoint', async () => {
      mockApiPost.mockResolvedValueOnce({
        ok: true,
        data: {
          user: { id: 1, codename: 'newagent', role: 'personnel', clearance: 1 },
          token: 'xyz',
        },
      })

      const store = useAuthStore()
      await store.register('newagent', 'password123')

      expect(mockApiPost).toHaveBeenCalledWith('/auth/register', {
        codename: 'newagent',
        password: 'password123',
      })
    })

    it('sets error on failure with fallback message', async () => {
      mockApiPost.mockResolvedValueOnce({ ok: false, code: ErrorCode.UNKNOWN, error: '' })

      const store = useAuthStore()
      const result = await store.register('taken', 'password123')

      expect(result).toBe(false)
      expect(store.error).toBeTruthy()
    })
  })

  describe('fetchProfile', () => {
    it('returns false when no token exists', async () => {
      const store = useAuthStore()
      const result = await store.fetchProfile()
      expect(result).toBe(false)
      expect(mockApiGet).not.toHaveBeenCalled()
    })

    it('sets user on success', async () => {
      mockApiGet.mockResolvedValueOnce({
        ok: true,
        data: {
          user: { id: 1, codename: 'agent', role: 'personnel', clearance: 1 },
        },
      })

      const store = useAuthStore()
      store.token = 'valid-token'
      const result = await store.fetchProfile()

      expect(result).toBe(true)
      expect(store.user).toEqual({ id: 1, codename: 'agent', role: 'personnel', clearance: 1 })
    })

    it('clears auth on failure (expired session)', async () => {
      mockApiGet.mockResolvedValueOnce({
        ok: false,
        code: ErrorCode.AUTH_EXPIRED,
        error: 'Invalid token',
      })

      const store = useAuthStore()
      store.token = 'expired-token'
      const result = await store.fetchProfile()

      expect(result).toBe(false)
      expect(store.user).toBeNull()
      expect(store.token).toBe('')
      expect(store.error).toBeTruthy()
    })
  })

  describe('logout', () => {
    it('clears user and token', async () => {
      mockApiPost.mockResolvedValueOnce({
        ok: true,
        data: {
          user: { id: 1, codename: 'agent', role: 'personnel', clearance: 1 },
          token: 'abc',
        },
      })

      const store = useAuthStore()
      await store.login('agent', 'pass1234')
      store.logout()

      expect(store.user).toBeNull()
      expect(store.token).toBe('')
      expect(store.isAuthenticated).toBe(false)
    })

    it('removes token from localStorage', async () => {
      mockApiPost.mockResolvedValueOnce({
        ok: true,
        data: {
          user: { id: 1, codename: 'agent', role: 'personnel', clearance: 1 },
          token: 'abc',
        },
      })

      const store = useAuthStore()
      await store.login('agent', 'pass1234')
      store.logout()

      expect(localStorage.getItem('scp-auth-token')).toBeNull()
    })
  })

  describe('updateProfile', () => {
    it('calls apiPut with correct endpoint and data', async () => {
      mockApiPut.mockResolvedValueOnce({
        ok: true,
        data: {
          user: { id: 1, codename: 'newname', role: 'personnel', clearance: 1 },
        },
      })

      const store = useAuthStore()
      store.token = 'valid-token'
      await store.updateProfile({ codename: 'newname' })

      expect(mockApiPut).toHaveBeenCalledWith(
        '/auth/profile',
        { codename: 'newname' }
      )
    })
  })
})
