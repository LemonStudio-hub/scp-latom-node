import { type ApiResult, normalizeResponse, networkError } from './response'
import { API_URL } from './config'

const TOKEN_KEY = 'scp-auth-token'

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  // Auto-inject token from localStorage when not explicitly provided.
  // This removes the need for every caller to manually thread the token.
  const authToken = token ?? localStorage.getItem(TOKEN_KEY)
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const json = await res.json()
    return normalizeResponse<T>(json, res.status)
  } catch (e) {
    return networkError(e instanceof Error ? e.message : undefined)
  }
}

export function apiGet<T = unknown>(path: string, token?: string) {
  return request<T>('GET', path, undefined, token)
}

export function apiPost<T = unknown>(path: string, body?: unknown, token?: string) {
  return request<T>('POST', path, body, token)
}

export function apiPut<T = unknown>(path: string, body?: unknown, token?: string) {
  return request<T>('PUT', path, body, token)
}

export function apiDelete<T = unknown>(path: string, token?: string) {
  return request<T>('DELETE', path, undefined, token)
}
