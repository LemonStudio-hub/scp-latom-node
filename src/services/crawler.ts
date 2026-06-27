import { apiGet } from './api'
import type { ApiResult } from './response'

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
  classDistribution?: Record<string, number>
  incremental?: {
    nextSeries: number
    seriesLastCrawl: Record<number, number>
  }
}

export interface CrawlerOverallStatusResponse {
  success: boolean
  en: CrawlState
  cn: CrawlState
  enClassDistribution?: Record<string, number>
  cnClassDistribution?: Record<string, number>
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

export interface EntryContentResponse {
  success: boolean
  scpNumber: number
  language: string
  status: 'cached' | 'fetched' | 'pending' | 'fetching' | 'error'
  content?: string
  name?: string
  objectClass?: string
  fetchedAt?: string
  message?: string
  error?: string
}

// ─── API Functions ──────────────────────────────────────────

/**
 * Get crawl status for both languages.
 */
export function fetchCrawlerOverallStatus(): Promise<ApiResult<CrawlerOverallStatusResponse>> {
  return apiGet<CrawlerOverallStatusResponse>('/crawler/status')
}

/**
 * Get crawl status for a specific language.
 */
export function fetchCrawlerStatus(
  lang: 'en' | 'cn'
): Promise<ApiResult<CrawlerStatusResponse>> {
  return apiGet<CrawlerStatusResponse>(`/crawler/${lang}/status`)
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
  const path = `/crawler/${lang}/entries${query ? `?${query}` : ''}`

  return apiGet<CrawlerEntriesResponse>(path)
}

/**
 * Get entries for a specific series (1-8).
 */
export function fetchCrawlerSeries(
  lang: 'en' | 'cn',
  series: number
): Promise<ApiResult<CrawlerSeriesResponse>> {
  return apiGet<CrawlerSeriesResponse>(`/crawler/${lang}/series/${series}`)
}

/**
 * Get cleaned HTML content for a specific SCP entry.
 *
 * If the content is cached in D1, it's returned immediately with status 'cached'.
 * If not, the backend triggers a background fetch and returns status 'pending'.
 * The client should poll until status changes to 'cached' or 'fetched'.
 */
export function fetchEntryContent(
  lang: 'en' | 'cn',
  scpNumber: number
): Promise<ApiResult<EntryContentResponse>> {
  return apiGet<EntryContentResponse>(`/crawler/${lang}/entry/${scpNumber}`)
}
