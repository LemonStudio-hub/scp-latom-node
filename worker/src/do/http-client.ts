/**
 * Browser-like HTTP client for fetching wiki pages.
 *
 * Implements anti-detection measures to avoid being blocked by CDNs:
 * - Rotating realistic User-Agent strings
 * - Full browser header sets
 * - Cookie persistence
 * - Randomized delays
 * - Referrer chain simulation
 */

// ─── Realistic User-Agent Pool ─────────────────────────────

/**
 * Pool of real, current User-Agent strings from major browsers.
 * Rotated per request to avoid pattern detection.
 */
const USER_AGENTS: readonly string[] = [
  // Chrome 125 on Windows 10
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  // Chrome 125 on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  // Chrome 124 on Windows 10
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  // Firefox 126 on Windows 10
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
  // Firefox 126 on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:126.0) Gecko/20100101 Firefox/126.0',
  // Safari 17.5 on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  // Edge 125 on Windows 10
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
  // Chrome 125 on Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  // Firefox 126 on Linux
  'Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0',
  // Chrome 124 on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
] as const

// ─── Language Pools ─────────────────────────────────────────

const ACCEPT_LANGUAGES: Record<'en' | 'cn', readonly string[]> = {
  en: [
    'en-US,en;q=0.9',
    'en-US,en;q=0.9,fr;q=0.8',
    'en-GB,en;q=0.9',
    'en-US,en;q=0.9,de;q=0.8',
    'en;q=0.9',
  ],
  cn: [
    'zh-CN,zh;q=0.9,en;q=0.8',
    'zh-CN,zh;q=0.9',
    'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'zh;q=0.9,en;q=0.8',
  ],
} as const

// ─── Utilities ──────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function jitter(baseMs: number, varianceMs: number): number {
  return baseMs + Math.floor(Math.random() * varianceMs)
}

// ─── Cookie Store ───────────────────────────────────────────

/**
 * Simple cookie jar for persisting cookies across requests to the same domain.
 * Wikidot sets session cookies that are expected on subsequent requests.
 */
class CookieJar {
  private store = new Map<string, string>()

  /**
   * Parse Set-Cookie headers and store cookie values.
   */
  parseCookies(headers: Headers, domain: string): void {
    const setCookies = headers.getAll('set-cookie')
    for (const cookie of setCookies) {
      const [pair] = cookie.split(';')
      if (pair) {
        const eqIdx = pair.indexOf('=')
        if (eqIdx > 0) {
          const name = pair.slice(0, eqIdx).trim()
          const value = pair.slice(eqIdx + 1).trim()
          this.store.set(`${domain}:${name}`, value)
        }
      }
    }
  }

  /**
   * Build a Cookie header string for a given domain.
   */
  getCookieHeader(domain: string): string | undefined {
    const cookies: string[] = []
    for (const [key, value] of this.store) {
      if (key.startsWith(`${domain}:`)) {
        const name = key.slice(domain.length + 1)
        cookies.push(`${name}=${value}`)
      }
    }
    return cookies.length > 0 ? cookies.join('; ') : undefined
  }
}

// ─── Public API ─────────────────────────────────────────────

export interface FetchOptions {
  /** Base URL for building referrer and extracting domain */
  baseUrl: string
  /** Language for Accept-Language header */
  language: 'en' | 'cn'
  /** Fetch function to use (defaults to globalThis.fetch) */
  fetcher?: typeof fetch
  /** Timeout in ms (default: 15000) */
  timeoutMs?: number
}

export interface FetchResult {
  ok: boolean
  status: number
  html: string | null
  error?: string
}

// Shared cookie jar (persists across requests within a single crawl)
const cookieJar = new CookieJar()

/**
 * Fetch a page with realistic browser headers and anti-detection measures.
 *
 * Features:
 * - Rotates User-Agent per request
 * - Sends full browser header set (Accept, Accept-Language, etc.)
 * - Persists cookies across requests
 * - Adds random jitter to appear human
 * - Follows redirects
 */
export async function fetchPageLikeBrowser(
  url: string,
  options: FetchOptions
): Promise<FetchResult> {
  const { baseUrl, language, fetcher = globalThis.fetch, timeoutMs = 15_000 } = options

  const ua = pick(USER_AGENTS)
  const acceptLang = pick(ACCEPT_LANGUAGES[language])
  const domain = new URL(baseUrl).hostname

  // Build realistic headers
  const headers: Record<string, string> = {
    'User-Agent': ua,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': acceptLang,
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Chromium";v="125", "Not.A/Brand";v="24", "Google Chrome";v="125"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Referer': `${baseUrl}/`,
  }

  // Attach cookies if we have any for this domain
  const cookieHeader = cookieJar.getCookieHeader(domain)
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetcher(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)

    // Store any cookies set by the server
    cookieJar.parseCookies(response.headers, domain)

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        html: null,
        error: `HTTP ${response.status}`,
      }
    }

    const html = await response.text()
    return { ok: true, status: response.status, html }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      status: 0,
      html: null,
      error: message,
    }
  }
}

/**
 * Generate a random delay in ms to appear human-like.
 * Range: base ± 30% variance.
 */
export function humanDelay(baseMs: number): number {
  const variance = Math.floor(baseMs * 0.3)
  return jitter(baseMs - variance, variance * 2)
}
