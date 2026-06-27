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

// ─── Bookmark API ──────────────────────────────────────────

export function fetchBookmarks() {
  return apiGet<BookmarksResponse>('/bookmarks')
}

export function addBookmark(lang: string, scpNumber: number) {
  return apiPost<BookmarkActionResponse>(`/bookmarks/${lang}/${scpNumber}`)
}

export function removeBookmark(lang: string, scpNumber: number) {
  return apiDelete<BookmarkActionResponse>(`/bookmarks/${lang}/${scpNumber}`)
}

export function checkBookmark(lang: string, scpNumber: number) {
  return apiGet<BookmarkCheckResponse>(`/bookmarks/${lang}/${scpNumber}`)
}

// ─── History API ───────────────────────────────────────────

export function fetchHistory(params?: HistoryParams): Promise<ApiResult<HistoryListResponse>> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.lang) searchParams.set('lang', params.lang)

  const query = searchParams.toString()
  const path = `/history${query ? `?${query}` : ''}`

  return apiGet<HistoryListResponse>(path)
}

export function recordHistory(data: {
  language: string
  scpNumber: number
  name?: string
  objectClass?: string
}): Promise<ApiResult<{ success: boolean }>> {
  return apiPost('/history', data)
}

export function deleteHistoryEntry(id: number): Promise<ApiResult<{ success: boolean }>> {
  return apiDelete(`/history/${id}`)
}

export function clearHistory(): Promise<ApiResult<{ success: boolean }>> {
  return apiDelete('/history')
}
