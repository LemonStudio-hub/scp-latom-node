import { type ApiResult, normalizeResponse, networkError } from './response'
import { ErrorCode, httpStatusToErrorCode, resolveErrorMessage } from './errors'
import { API_URL } from './config'
import { logger } from './logger'

/** Build standard headers. Auth is handled via httpOnly cookie. */
function buildHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json' }
}

// ─── Token refresh lock ───────────────────────────────────
// Prevents concurrent 401s from triggering multiple refresh calls.
// When a refresh is in flight, other requests await the same promise.
let refreshPromise: Promise<boolean> | null = null

/** Paths that should never trigger a refresh attempt. */
const NO_REFRESH_PATHS = new Set(['/auth/login', '/auth/register', '/auth/logout', '/auth/refresh'])

/**
 * Attempt to refresh the access token via the refresh token cookie.
 * Returns true if the refresh succeeded, false otherwise.
 * Uses a lock so concurrent callers share a single refresh request.
 */
async function attemptRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        logger.warn('Token refresh failed', { status: res.status })
        return false
      }
      const json = await res.json()
      return json.success === true
    } catch (e) {
      logger.warn('Token refresh network error', {
        error: e instanceof Error ? e.message : String(e),
      })
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/** Log a non-OK response using the same thresholds as `request`. */
function logResponse(
  method: string,
  path: string,
  status: number,
  error: string,
  duration: number,
  requestId: string | null,
): void {
  if (status >= 500) {
    logger.error(`API ${method} ${path} → ${status}`, { status, error, duration })
  } else if (status >= 400) {
    logger.warn(`API ${method} ${path} → ${status}`, { status, error, duration })
  }
  if (requestId) {
    logger.debug('Server request ID for error correlation', { requestId, path })
  }
}

export interface StreamSuccess {
  ok: true
  response: Response
}

export interface StreamFailure {
  ok: false
  error: string
  code: ErrorCode
}

export type StreamResult = StreamSuccess | StreamFailure

/**
 * Perform a fetch with unified auth, logging, and error handling — but return
 * the raw Response for streaming consumption instead of parsing JSON.
 */
async function requestStream(method: string, path: string, body?: unknown): Promise<StreamResult> {
  const headers = buildHeaders()
  const start = Date.now()

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    })

    const duration = Date.now() - start
    const requestId = res.headers.get('X-Request-Id')

    if (!res.ok) {
      const code = httpStatusToErrorCode(res.status)
      const error = resolveErrorMessage(code)

      // On 401, attempt token refresh and retry once
      if (code === ErrorCode.UNAUTHORIZED && !NO_REFRESH_PATHS.has(path)) {
        const refreshed = await attemptRefresh()
        if (refreshed) {
          const retryRes = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            credentials: 'include',
            body: body ? JSON.stringify(body) : undefined,
          })
          if (retryRes.ok) {
            return { ok: true, response: retryRes }
          }
          const retryCode = httpStatusToErrorCode(retryRes.status)
          const retryError = resolveErrorMessage(retryCode)
          logResponse(
            method,
            path,
            retryRes.status,
            retryError,
            Date.now() - start,
            retryRes.headers.get('X-Request-Id'),
          )
          return { ok: false, error: retryError, code: retryCode }
        }
      }

      logResponse(method, path, res.status, error, duration, requestId)
      return { ok: false, error, code }
    }

    if (duration > 3000) {
      logger.warn(`Slow API request: ${method} ${path}`, { duration })
    }

    return { ok: true, response: res }
  } catch (e) {
    const duration = Date.now() - start
    logger.error(`API ${method} ${path} network error`, {
      error: e instanceof Error ? e.message : String(e),
      duration,
    })
    return {
      ok: false,
      error: e instanceof Error ? e.message : resolveErrorMessage(ErrorCode.NETWORK),
      code: ErrorCode.NETWORK,
    }
  }
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  const headers = buildHeaders()
  const start = Date.now()

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    })

    const json = await res.json()
    const result = normalizeResponse<T>(json, res.status)
    const duration = Date.now() - start

    // On 401, attempt token refresh and retry once (unless this is an auth endpoint)
    if (!result.ok && result.code === ErrorCode.UNAUTHORIZED && !NO_REFRESH_PATHS.has(path)) {
      const refreshed = await attemptRefresh()
      if (refreshed) {
        const retryStart = Date.now()
        const retryRes = await fetch(`${API_URL}${path}`, {
          method,
          headers,
          credentials: 'include',
          body: body ? JSON.stringify(body) : undefined,
        })
        const retryJson = await retryRes.json()
        const retryResult = normalizeResponse<T>(retryJson, retryRes.status)
        const retryDuration = Date.now() - retryStart

        if (!retryResult.ok) {
          logResponse(
            method,
            path,
            retryRes.status,
            retryResult.error,
            retryDuration,
            retryRes.headers.get('X-Request-Id'),
          )
        }
        return retryResult
      }
    }

    if (!result.ok) {
      logResponse(method, path, res.status, result.error, duration, res.headers.get('X-Request-Id'))
    } else if (duration > 3000) {
      logger.warn(`Slow API request: ${method} ${path}`, { duration })
    }

    return result
  } catch (e) {
    const duration = Date.now() - start
    logger.error(`API ${method} ${path} network error`, {
      error: e instanceof Error ? e.message : String(e),
      duration,
    })
    return networkError(e instanceof Error ? e.message : undefined)
  }
}

export function apiGet<T = unknown>(path: string): Promise<ApiResult<T>> {
  return request<T>('GET', path)
}

export function apiPost<T = unknown>(path: string, body?: unknown): Promise<ApiResult<T>> {
  return request<T>('POST', path, body)
}

export function apiPut<T = unknown>(path: string, body?: unknown): Promise<ApiResult<T>> {
  return request<T>('PUT', path, body)
}

export function apiDelete<T = unknown>(path: string): Promise<ApiResult<T>> {
  return request<T>('DELETE', path)
}

/**
 * POST with streaming response. Returns the raw Response on success for
 * the caller to consume as a stream, or a normalized error on failure.
 */
export function apiStream(path: string, body?: unknown): Promise<StreamResult> {
  return requestStream('POST', path, body)
}
