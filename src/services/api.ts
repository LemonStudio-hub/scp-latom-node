import { type ApiResult, normalizeResponse, networkError } from './response'

const API_BASE = 'https://api.scp.lat'

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch(`${API_BASE}${path}`, {
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
