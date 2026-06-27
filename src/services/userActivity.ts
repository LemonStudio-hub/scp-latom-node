import { apiGet, apiPost, apiDelete } from './api'
import type { ApiResult } from './response'

// ─── Bookmark Types ────────────────────────────────────────

export interface BookmarkItem {
  scpNumber: number
  language: string
  name: string | null
  objectClass: string | null
  createdAt: string
}

export interface BookmarksResponse {
  success: boolean
  bookmarks: BookmarkItem[]
}

export interface BookmarkCheckResponse {
  success: boolean
  bookmarked: boolean
}

export interface BookmarkActionResponse {
  success: boolean
  message: string
}

// ─── History Types ─────────────────────────────────────────

export interface HistoryEntry {
  id: number
  user_id: number
  language: string
  scp_number: number
  name: string
  object_class: string
  visited_at: string
}

export interface HistoryListResponse {
  success: boolean
  entries: HistoryEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface HistoryParams {
  page?: number
  limit?: number
  lang?: string
}

// ─── Token Helper ──────────────────────────────────────────

const TOKEN_KEY = 'scp-auth-token'

function getToken(): string | undefined {
  return localStorage.getItem(TOKEN_KEY) || undefined
}

// ─── Bookmark API ──────────────────────────────────────────

export function fetchBookmarks(token: string) {
  return apiGet<BookmarksResponse>('/bookmarks', token)
}

export function addBookmark(lang: string, scpNumber: number, token: string) {
  return apiPost<BookmarkActionResponse>(`/bookmarks/${lang}/${scpNumber}`, undefined, token)
}

export function removeBookmark(lang: string, scpNumber: number, token: string) {
  return apiDelete<BookmarkActionResponse>(`/bookmarks/${lang}/${scpNumber}`, token)
}

export function checkBookmark(lang: string, scpNumber: number, token: string) {
  return apiGet<BookmarkCheckResponse>(`/bookmarks/${lang}/${scpNumber}`, token)
}

// ─── History API ───────────────────────────────────────────

export function fetchHistory(params?: HistoryParams): Promise<ApiResult<HistoryListResponse>> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.lang) searchParams.set('lang', params.lang)

  const query = searchParams.toString()
  const path = `/api/history${query ? `?${query}` : ''}`

  return apiGet<HistoryListResponse>(path, getToken())
}

export function recordHistory(data: {
  language: string
  scpNumber: number
  name?: string
  objectClass?: string
}): Promise<ApiResult<{ success: boolean }>> {
  return apiPost('/api/history', data, getToken())
}

export function deleteHistoryEntry(id: number): Promise<ApiResult<{ success: boolean }>> {
  return apiDelete(`/api/history/${id}`, getToken())
}

export function clearHistory(): Promise<ApiResult<{ success: boolean }>> {
  return apiDelete('/api/history', getToken())
}
