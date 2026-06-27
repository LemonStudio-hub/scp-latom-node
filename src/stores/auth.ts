import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiPost, apiGet, apiPut } from '@/services/api'
import type { ApiResult } from '@/services/response'
import { ErrorCode, resolveErrorMessage } from '@/services/errors'

export interface User {
  id: number
  codename: string
  role: string
  clearance: number
  created_at?: string
}

/** Shape of user+token payloads from the backend. */
interface AuthPayload {
  user: User
  token?: string
}

const TOKEN_KEY = 'scp-auth-token'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '')
  const loading = ref(false)
  const error = ref('')
  const errorCode = ref<ErrorCode | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  function setToken(t: string) {
    token.value = t
    localStorage.setItem(TOKEN_KEY, t)
  }

  function clearAuth() {
    user.value = null
    token.value = ''
    localStorage.removeItem(TOKEN_KEY)
  }

  function clearError() {
    error.value = ''
    errorCode.value = null
  }

  /**
   * Shared handler for auth endpoints that return { user, token? }.
   * Updates store state and returns success/failure.
   */
  function handleAuthResult(
    res: ApiResult<AuthPayload>,
    fallbackCode: ErrorCode
  ): boolean {
    if (res.ok) {
      user.value = res.data.user
      if (res.data.token) setToken(res.data.token)
      clearError()
      return true
    }
    errorCode.value = res.code
    error.value = res.error || resolveErrorMessage(fallbackCode)
    return false
  }

  async function register(codename: string, password: string): Promise<boolean> {
    loading.value = true
    clearError()
    const res = await apiPost<AuthPayload>('/auth/register', { codename, password })
    loading.value = false
    return handleAuthResult(res, ErrorCode.UNKNOWN)
  }

  async function login(codename: string, password: string): Promise<boolean> {
    loading.value = true
    clearError()
    const res = await apiPost<AuthPayload>('/auth/login', { codename, password })
    loading.value = false
    return handleAuthResult(res, ErrorCode.AUTH_INVALID)
  }

  async function fetchProfile(): Promise<boolean> {
    if (!token.value) return false
    loading.value = true
    clearError()
    const res = await apiGet<AuthPayload>('/auth/me')
    loading.value = false
    if (res.ok) {
      user.value = res.data.user
      return true
    }
    errorCode.value = res.code === ErrorCode.UNAUTHORIZED ? ErrorCode.AUTH_EXPIRED : res.code
    error.value = res.error || resolveErrorMessage(ErrorCode.AUTH_EXPIRED)
    clearAuth()
    return false
  }

  async function updateProfile(data: {
    codename?: string
    password?: string
    newPassword?: string
  }): Promise<boolean> {
    loading.value = true
    clearError()
    const res = await apiPut<AuthPayload>('/auth/profile', data)
    loading.value = false
    return handleAuthResult(res, ErrorCode.UNKNOWN)
  }

  function logout() {
    clearAuth()
    clearError()
  }

  async function init() {
    if (token.value) {
      await fetchProfile()
    }
  }

  return {
    user,
    token,
    loading,
    error,
    errorCode,
    isAuthenticated,
    register,
    login,
    logout,
    fetchProfile,
    updateProfile,
    init,
  }
})
