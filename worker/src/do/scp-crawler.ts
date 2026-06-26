import type { CrawlEntry, CrawlState, Env } from '../types'
import { parseScpIndexPage, SERIES_PAGES, getWikiBaseUrl } from './parser'
import { fetchPageLikeBrowser, humanDelay } from './http-client'

// ─── Constants ──────────────────────────────────────────────

const STORAGE_KEY_STATE = 'crawl_state'
const STORAGE_KEY_ENTRIES = 'crawl_entries'
const STORAGE_KEY_CURSOR = 'crawl_cursor'
const STORAGE_KEY_LAST_CRAWL_MAP = 'last_crawl_map'

const ALARM_INTERVAL_MS = 24 * 60 * 60 * 1000
const BASE_CRAWL_DELAY_MS = 1200
const FETCH_TIMEOUT_MS = 15_000
const MAX_RETRIES = 2
const SERIES_PER_ALARM = 1

// ─── Helpers ────────────────────────────────────────────────

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function errorResponse(error: string, status = 400): Response {
  return jsonResponse({ success: false, error }, status)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Durable Object ─────────────────────────────────────────

export class ScpCrawlerDo {
  private state: DurableObjectState
  private env: Env
  private fetcher: typeof fetch

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.env = env
    this.fetcher = globalThis.fetch
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    try {
      const langMatch = path.match(/^\/(en|cn)/)
      if (!langMatch) {
        return errorResponse('Missing language prefix. Use /en/ or /cn/', 400)
      }
      const language = langMatch[1] as 'en' | 'cn'

      if (method === 'GET' && path.endsWith('/status')) {
        return await this.handleStatus(language)
      }
      if (method === 'GET' && path.endsWith('/entries')) {
        return await this.handleEntries(language, url)
      }
      if (method === 'GET' && /\/series\/\d+$/.test(path)) {
        const seriesNum = parseInt(path.match(/\/series\/(\d+)$/)![1], 10)
        return await this.handleSeries(language, seriesNum)
      }
      if (method === 'POST' && path.endsWith('/crawl')) {
        return await this.handleTriggerCrawl(language, url)
      }

      return errorResponse('Not found', 404)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return errorResponse(`Internal error: ${message}`, 500)
    }
  }

  async alarm(): Promise<void> {
    try {
      const state = await this.getStoredState()
      if (state.totalEntries === 0) {
        await this.crawlAll('en')
      } else {
        const language = (await this.getStoredLanguage()) as 'en' | 'cn'
        await this.crawlIncremental(language)
      }
    } catch (err) {
      console.error('[ScpCrawlerDo] Alarm error:', err)
    }
    await this.state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS)
  }

  // ─── Route Handlers ─────────────────────────────────────

  private async handleStatus(language: 'en' | 'cn'): Promise<Response> {
    const state = await this.getStateFromD1(language)
    const cursor = await this.state.storage.get<number>(STORAGE_KEY_CURSOR) ?? 0
    const lastCrawlMap = await this.state.storage.get<Record<number, number>>(STORAGE_KEY_LAST_CRAWL_MAP) ?? {}

    return jsonResponse({
      success: true,
      language,
      state,
      incremental: { nextSeries: cursor, seriesLastCrawl: lastCrawlMap },
    })
  }

  private async handleEntries(language: 'en' | 'cn', url: URL): Promise<Response> {
    const state = await this.getStateFromD1(language)

    if (state.totalEntries === 0) {
      return jsonResponse({
        success: true, language, entries: [], total: 0,
        page: 1, limit: 50, totalPages: 0, state,
      })
    }

    // Build query
    let where = 'WHERE language = ?'
    const params: unknown[] = [language]

    const classFilter = url.searchParams.get('class')
    if (classFilter) {
      where += ' AND LOWER(object_class) = LOWER(?)'
      params.push(classFilter)
    }

    const query = url.searchParams.get('q')
    if (query) {
      where += ' AND (name LIKE ? OR scp_number LIKE ?)'
      params.push(`%${query}%`, `%${query}%`)
    }

    // Count total
    const countResult = await this.env.DB.prepare(
      `SELECT COUNT(*) as total FROM scp_entries ${where}`
    ).bind(...params).first<{ total: number }>()
    const total = countResult?.total ?? 0

    // Paginate
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') ?? '50', 10) || 50))
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit

    const rows = await this.env.DB.prepare(
      `SELECT scp_number, name, object_class, url, series FROM scp_entries ${where} ORDER BY scp_number ASC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<{
      scp_number: number
      name: string
      object_class: string
      url: string
      series: number
    }>()

    const entries: CrawlEntry[] = rows.results.map((r) => ({
      scpNumber: r.scp_number,
      name: r.name,
      objectClass: r.object_class,
      url: r.url,
      series: r.series,
    }))

    return jsonResponse({
      success: true, language, entries, total, page, limit, totalPages, state,
    })
  }

  private async handleSeries(language: 'en' | 'cn', seriesNum: number): Promise<Response> {
    if (seriesNum < 1 || seriesNum > SERIES_PAGES.length) {
      return errorResponse(`Invalid series number. Valid range: 1-${SERIES_PAGES.length}`, 400)
    }

    const rows = await this.env.DB.prepare(
      'SELECT scp_number, name, object_class, url, series FROM scp_entries WHERE language = ? AND series = ? ORDER BY scp_number ASC'
    ).bind(language, seriesNum).all<{
      scp_number: number
      name: string
      object_class: string
      url: string
      series: number
    }>()

    const entries: CrawlEntry[] = rows.results.map((r) => ({
      scpNumber: r.scp_number,
      name: r.name,
      objectClass: r.object_class,
      url: r.url,
      series: r.series,
    }))

    return jsonResponse({
      success: true, language, series: seriesNum, entries, total: entries.length,
    })
  }

  private async handleTriggerCrawl(language: 'en' | 'cn', url: URL): Promise<Response> {
    const state = await this.getStateFromD1(language)

    if (state.status === 'crawling') {
      return jsonResponse({ success: false, error: 'Crawl already in progress', state }, 409)
    }

    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10) || 0) : 0

    const ctx = this.state as unknown as { waitUntil?: (p: Promise<void>) => void }
    if (typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(this.crawlAll(language, limit))
    } else {
      this.crawlAll(language, limit).catch(() => {})
    }

    return jsonResponse({
      success: true, language,
      message: limit > 0 ? `Crawl triggered (limit: ${limit} entries)` : 'Full crawl triggered',
      state: { ...state, status: 'crawling' },
    })
  }

  // ─── D1 Helpers ─────────────────────────────────────────

  private async getStateFromD1(language: 'en' | 'cn'): Promise<CrawlState> {
    const row = await this.env.DB.prepare(
      'SELECT status, last_crawl, total_entries, error FROM crawl_state WHERE language = ?'
    ).bind(language).first<{
      status: string
      last_crawl: number
      total_entries: number
      error: string | null
    }>()

    return {
      status: (row?.status as CrawlState['status']) ?? 'idle',
      lastCrawl: row?.last_crawl ?? 0,
      totalEntries: row?.total_entries ?? 0,
      error: row?.error ?? undefined,
    }
  }

  private async upsertStateToD1(language: 'en' | 'cn', state: Partial<CrawlState>): Promise<void> {
    await this.env.DB.prepare(`
      INSERT INTO crawl_state (language, status, last_crawl, total_entries, error, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(language) DO UPDATE SET
        status = excluded.status,
        last_crawl = excluded.last_crawl,
        total_entries = excluded.total_entries,
        error = excluded.error,
        updated_at = excluded.updated_at
    `).bind(
      language,
      state.status ?? 'idle',
      state.lastCrawl ?? 0,
      state.totalEntries ?? 0,
      state.error ?? null,
    ).run()
  }

  private async upsertEntriesToD1(language: 'en' | 'cn', entries: CrawlEntry[]): Promise<void> {
    // Batch insert/upsert entries
    const stmt = this.env.DB.prepare(`
      INSERT INTO scp_entries (scp_number, language, name, object_class, url, series, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(scp_number, language) DO UPDATE SET
        name = excluded.name,
        object_class = excluded.object_class,
        url = excluded.url,
        series = excluded.series,
        updated_at = excluded.updated_at
    `)

    // D1 supports batch operations — process in chunks of 20
    for (let i = 0; i < entries.length; i += 20) {
      const chunk = entries.slice(i, i + 20)
      const batch = chunk.map((e) =>
        stmt.bind(e.scpNumber, language, e.name, e.objectClass, e.url, e.series)
      )
      await this.env.DB.batch(batch)
    }
  }

  private async getStoredLanguage(): Promise<string> {
    const row = await this.env.DB.prepare(
      'SELECT language FROM crawl_state ORDER BY last_crawl DESC LIMIT 1'
    ).first<{ language: string }>()
    return row?.language ?? 'en'
  }

  private async getStoredState(): Promise<CrawlState> {
    const row = await this.env.DB.prepare(
      'SELECT status, last_crawl, total_entries FROM crawl_state ORDER BY last_crawl DESC LIMIT 1'
    ).first<{ status: string; last_crawl: number; total_entries: number }>()
    return {
      status: (row?.status as CrawlState['status']) ?? 'idle',
      lastCrawl: row?.last_crawl ?? 0,
      totalEntries: row?.total_entries ?? 0,
    }
  }

  // ─── Incremental Crawl ──────────────────────────────────

  private async crawlIncremental(language: 'en' | 'cn'): Promise<void> {
    const cursor = await this.state.storage.get<number>(STORAGE_KEY_CURSOR) ?? 0
    const lastCrawlMap = await this.state.storage.get<Record<number, number>>(STORAGE_KEY_LAST_CRAWL_MAP) ?? {}
    const baseUrl = getWikiBaseUrl(language)

    const seriesToCrawl: number[] = []
    for (let i = 0; i < SERIES_PER_ALARM; i++) {
      seriesToCrawl.push((cursor + i) % SERIES_PAGES.length)
    }

    await this.upsertStateToD1(language, { status: 'crawling' })

    const newEntries: CrawlEntry[] = []
    let crawlErrors = 0

    for (let i = 0; i < seriesToCrawl.length; i++) {
      const seriesIdx = seriesToCrawl[i]
      const pageSlug = SERIES_PAGES[seriesIdx]
      const seriesNum = seriesIdx + 1
      const pageUrl = `${baseUrl}/${pageSlug}`

      const result = await fetchPageLikeBrowser(pageUrl, {
        baseUrl, language, fetcher: this.fetcher, timeoutMs: FETCH_TIMEOUT_MS,
      })

      if (!result.ok || !result.html) {
        crawlErrors++
        continue
      }

      const { entries: pageEntries } = parseScpIndexPage(result.html, {
        baseUrl, language, seriesHint: seriesNum,
      })

      newEntries.push(...pageEntries)
      lastCrawlMap[seriesNum] = Date.now()

      if (i < seriesToCrawl.length - 1) {
        await delay(humanDelay(BASE_CRAWL_DELAY_MS))
      }
    }

    // Write to D1
    if (newEntries.length > 0) {
      await this.upsertEntriesToD1(language, newEntries)
    }

    const totalRow = await this.env.DB.prepare(
      'SELECT COUNT(*) as total FROM scp_entries WHERE language = ?'
    ).bind(language).first<{ total: number }>()

    const nextCursor = (cursor + SERIES_PER_ALARM) % SERIES_PAGES.length
    await this.state.storage.put(STORAGE_KEY_CURSOR, nextCursor)
    await this.state.storage.put(STORAGE_KEY_LAST_CRAWL_MAP, lastCrawlMap)

    await this.upsertStateToD1(language, {
      status: crawlErrors === seriesToCrawl.length ? 'error' : 'idle',
      lastCrawl: Date.now(),
      totalEntries: totalRow?.total ?? 0,
      error: crawlErrors === seriesToCrawl.length ? 'All series fetches failed' : undefined,
    })
  }

  // ─── Full Crawl ─────────────────────────────────────────

  /**
   * Full crawl — fetches series pages and writes to D1.
   * When limit > 0, starts from the highest SCP number already in D1
   * to support incremental batch initialization.
   */
  private async crawlAll(language: 'en' | 'cn', limit = 0): Promise<void> {
    const baseUrl = getWikiBaseUrl(language)
    const collected: CrawlEntry[] = []
    const lastCrawlMap: Record<number, number> = {}
    const errors: string[] = []

    await this.upsertStateToD1(language, { status: 'crawling' })

    // Find the highest SCP number already in D1 for this language
    let startAfter = 0
    if (limit > 0) {
      const maxRow = await this.env.DB.prepare(
        'SELECT MAX(scp_number) as max_num FROM scp_entries WHERE language = ?'
      ).bind(language).first<{ max_num: number | null }>()
      startAfter = maxRow?.max_num ?? 0
    }

    for (let i = 0; i < SERIES_PAGES.length; i++) {
      if (limit > 0 && collected.length >= limit) break

      const pageSlug = SERIES_PAGES[i]
      const pageUrl = `${baseUrl}/${pageSlug}`
      const seriesNum = i + 1

      const result = await fetchPageLikeBrowser(pageUrl, {
        baseUrl, language, fetcher: this.fetcher, timeoutMs: FETCH_TIMEOUT_MS,
      })

      if (!result.ok || !result.html) {
        errors.push(`Failed to fetch ${pageSlug}: ${result.error ?? `HTTP ${result.status}`}`)
        continue
      }

      let { entries: pageEntries } = parseScpIndexPage(result.html, {
        baseUrl, language, seriesHint: seriesNum,
      })

      // Skip entries we already have in D1
      if (startAfter > 0) {
        pageEntries = pageEntries.filter((e) => e.scpNumber > startAfter)
      }

      if (limit > 0) {
        const remaining = limit - collected.length
        collected.push(...pageEntries.slice(0, remaining))
      } else {
        collected.push(...pageEntries)
      }

      lastCrawlMap[seriesNum] = Date.now()

      if (i < SERIES_PAGES.length - 1) {
        await delay(humanDelay(BASE_CRAWL_DELAY_MS))
      }
    }

    // Write collected entries to D1
    if (collected.length > 0) {
      await this.upsertEntriesToD1(language, collected)
    }

    // Get total count from D1
    const totalRow = await this.env.DB.prepare(
      'SELECT COUNT(*) as total FROM scp_entries WHERE language = ?'
    ).bind(language).first<{ total: number }>()

    await this.state.storage.put(STORAGE_KEY_CURSOR, 0)
    await this.state.storage.put(STORAGE_KEY_LAST_CRAWL_MAP, lastCrawlMap)

    await this.upsertStateToD1(language, {
      status: errors.length > 0 && collected.length === 0 ? 'error' : 'idle',
      lastCrawl: Date.now(),
      totalEntries: totalRow?.total ?? 0,
      error: errors.length > 0 && collected.length === 0 ? errors[errors.length - 1] : undefined,
    })

    await this.state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS)
  }
}
