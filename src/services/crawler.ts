import { type ApiResult, normalizeResponse, networkError } from './response'

const API_BASE = 'https://api.scp.lat'

// ─── Types ──────────────────────────────────────────────────

export interface CrawlEntry {
  scpNumber: number
  name: string
  objectClass: string
  url: string
  series: number
}

export interface CrawlState {
  status: 'idle' | 'crawling' | 'error'
  lastCrawl: number
  totalEntries: number
  error?: string
}

export interface CrawlerStatusResponse {
  success: boolean
  language: string
  state: CrawlState
  incremental?: {
    nextSeries: number
    seriesLastCrawl: Record<number, number>
  }
}

export interface CrawlerOverallStatusResponse {
  success: boolean
  en: CrawlState
  cn: CrawlState
}

export interface CrawlerEntriesResponse {
  success: boolean
  language: string
  entries: CrawlEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
  state: CrawlState
}

export interface CrawlerSeriesResponse {
  success: boolean
  language: string
  series: number
  entries: CrawlEntry[]
  total: number
}

export interface CrawlerEntriesParams {
  class?: string
  q?: string
  page?: number
  limit?: number
}

// ─── API Client ─────────────────────────────────────────────

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

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

/**
 * Get crawl status for both languages.
 */
export function fetchCrawlerOverallStatus(): Promise<ApiResult<CrawlerOverallStatusResponse>> {
  return request('GET', '/api/crawler/status')
}

/**
 * Get crawl status for a specific language.
 */
export function fetchCrawlerStatus(
  lang: 'en' | 'cn'
): Promise<ApiResult<CrawlerStatusResponse>> {
  return request('GET', `/api/crawler/${lang}/status`)
}

/**
 * Get crawled entries with optional filtering and pagination.
 */
export function fetchCrawlerEntries(
  lang: 'en' | 'cn',
  params?: CrawlerEntriesParams
): Promise<ApiResult<CrawlerEntriesResponse>> {
  const searchParams = new URLSearchParams()
  if (params?.class) searchParams.set('class', params.class)
  if (params?.q) searchParams.set('q', params.q)
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))

  const query = searchParams.toString()
  const path = `/api/crawler/${lang}/entries${query ? `?${query}` : ''}`

  return request('GET', path)
}

/**
 * Get entries for a specific series (1-8).
 */
export function fetchCrawlerSeries(
  lang: 'en' | 'cn',
  series: number
): Promise<ApiResult<CrawlerSeriesResponse>> {
  return request('GET', `/api/crawler/${lang}/series/${series}`)
}
