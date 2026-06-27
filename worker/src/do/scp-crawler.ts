import type { CrawlEntry, CrawlState, Env, EntryContentResponse, SyncResult } from '../types'
import { parseScpIndexPage, SERIES_PAGES, getWikiBaseUrl, cleanEntryHtml, extractObjectClassFromEntryPage } from './parser'
import { fetchPageLikeBrowser, humanDelay } from './http-client'

// ─── Constants ──────────────────────────────────────────────

const STORAGE_KEY_CURSOR = 'crawl_cursor'
const STORAGE_KEY_LAST_CRAWL_MAP = 'last_crawl_map'

const BASE_CRAWL_DELAY_MS = 1200
const FETCH_TIMEOUT_MS = 15_000
const MAX_RETRIES = 2
const BATCH_SIZE = 50
const DAILY_CRON_HOUR_UTC = 3 // 03:00 UTC

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

/** Calculate ms until the next occurrence of DAILY_CRON_HOUR_UTC:00 */
function getNextAlarmTime(): number {
  const now = new Date()
  const next = new Date(now)
  next.setUTCHours(DAILY_CRON_HOUR_UTC, 0, 0, 0)
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1)
  }
  return next.getTime()
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
      if (method === 'GET' && /\/entry\/\d+$/.test(path)) {
        const scpNumber = parseInt(path.match(/\/entry\/(\d+)$/)![1], 10)
        return await this.handleEntryContent(language, scpNumber)
      }

      return errorResponse('Not found', 404)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return errorResponse(`Internal error: ${message}`, 500)
    }
  }

  async alarm(): Promise<void> {
    try {
      // Daily crawl: process both languages sequentially
      for (const language of ['en', 'cn'] as const) {
        const state = await this.getStateFromD1(language)
        if (state.status !== 'crawling') {
          await this.crawlDaily(language)
        }
      }
    } catch (err) {
      console.error('[ScpCrawlerDo] Alarm error:', err)
    }
    // Re-arm alarm for the next fixed daily time
    await this.state.storage.setAlarm(getNextAlarmTime())
  }

  // ─── Route Handlers ─────────────────────────────────────

  private async handleStatus(language: 'en' | 'cn'): Promise<Response> {
    const state = await this.getStateFromD1(language)
    const cursor = await this.state.storage.get<number>(STORAGE_KEY_CURSOR) ?? 0
    const lastCrawlMap = await this.state.storage.get<Record<number, number>>(STORAGE_KEY_LAST_CRAWL_MAP) ?? {}
    const classDistribution = await this.getClassDistribution(language)

    return jsonResponse({
      success: true,
      language,
      state,
      classDistribution,
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

  // ─── Entry Content ───────────────────────────────────────

  private async handleEntryContent(language: 'en' | 'cn', scpNumber: number): Promise<Response> {
    // 1. Check D1 for cached content
    const row = await this.env.DB.prepare(
      'SELECT name, object_class, content, content_fetched_at, content_error FROM scp_entries WHERE scp_number = ? AND language = ?'
    ).bind(scpNumber, language).first<{
      name: string
      object_class: string
      content: string | null
      content_fetched_at: string | null
      content_error: string | null
    }>()

    if (!row) {
      return jsonResponse({
        success: false,
        error: `SCP-${scpNumber} not found in index for language '${language}'`,
      }, 404)
    }

    // 2. If content is cached (explicit null check — empty string is valid), return it
    if (row.content !== null && row.content !== undefined) {
      const resp: EntryContentResponse = {
        success: true,
        scpNumber,
        language,
        status: 'cached',
        content: row.content,
        name: row.name,
        objectClass: row.object_class,
        fetchedAt: row.content_fetched_at ?? undefined,
      }
      return jsonResponse(resp)
    }

    // 3. If a previous fetch failed, return error (don't retry automatically)
    if (row.content_error) {
      const resp: EntryContentResponse = {
        success: true,
        scpNumber,
        language,
        status: 'error',
        name: row.name,
        objectClass: row.object_class,
        error: row.content_error,
      }
      return jsonResponse(resp)
    }

    // 4. Content not cached — return pending and kick off background fetch
    const ctx = this.state as unknown as { waitUntil?: (p: Promise<void>) => void }
    if (typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(this.fetchAndStoreEntryContent(language, scpNumber))
    } else {
      this.fetchAndStoreEntryContent(language, scpNumber).catch(() => {})
    }

    const resp: EntryContentResponse = {
      success: true,
      scpNumber,
      language,
      status: 'pending',
      name: row.name,
      objectClass: row.object_class,
      message: 'Content is being fetched. Poll this endpoint again shortly.',
    }
    return jsonResponse(resp)
  }

  /**
   * Fetch an individual SCP entry page from the wiki, clean the HTML,
   * and store it in D1. Called via waitUntil from handleEntryContent.
   */
  private async fetchAndStoreEntryContent(language: 'en' | 'cn', scpNumber: number): Promise<void> {
    const baseUrl = getWikiBaseUrl(language)
    const padded = String(scpNumber).padStart(3, '0')
    const url = `${baseUrl}/scp-${padded}`

    try {
      const result = await fetchPageLikeBrowser(url, {
        baseUrl,
        language,
        fetcher: this.fetcher,
        timeoutMs: FETCH_TIMEOUT_MS,
      })

      if (!result.ok || !result.html) {
        const errMsg = result.error ?? `HTTP ${result.status}`
        console.error(`[ScpCrawlerDo] Failed to fetch entry scp-${scpNumber} (${language}): ${errMsg}`)
        await this.env.DB.prepare(
          `UPDATE scp_entries SET content_error = ?, content_fetched_at = datetime('now') WHERE scp_number = ? AND language = ?`
        ).bind(errMsg, scpNumber, language).run()
        return
      }

      const cleaned = cleanEntryHtml(result.html, baseUrl)

      await this.env.DB.prepare(
        `UPDATE scp_entries SET content = ?, content_error = NULL, content_fetched_at = datetime('now') WHERE scp_number = ? AND language = ?`
      ).bind(cleaned, scpNumber, language).run()
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error(`[ScpCrawlerDo] Error fetching entry scp-${scpNumber} (${language}):`, err)
      await this.env.DB.prepare(
        `UPDATE scp_entries SET content_error = ?, content_fetched_at = datetime('now') WHERE scp_number = ? AND language = ?`
      ).bind(errMsg, scpNumber, language).run()
    }
  }

  /**
   * Backfill entries that still have "Unknown" object class by fetching
   * their individual wiki pages and extracting the class from the full page.
   *
   * Uses parallel batched fetching: processes `batchSize` entries concurrently
   * per batch, with a short delay between batches for rate limiting.
   */
  private async backfillUnknownClasses(language: 'en' | 'cn', maxEntries = 2000, batchSize = 5): Promise<number> {
    const baseUrl = getWikiBaseUrl(language)

    // Find entries still marked Unknown
    const rows = await this.env.DB.prepare(
      'SELECT scp_number FROM scp_entries WHERE language = ? AND object_class = ? ORDER BY scp_number ASC LIMIT ?'
    ).bind(language, 'Unknown', maxEntries).all<{ scp_number: number }>()

    if (rows.results.length === 0) return 0

    let updated = 0
    const entries = rows.results

    // Process in parallel batches
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize)

      const results = await Promise.allSettled(
        batch.map(async (row) => {
          const scpNumber = row.scp_number
          const padded = String(scpNumber).padStart(3, '0')
          const url = `${baseUrl}/scp-${padded}`

          const result = await fetchPageLikeBrowser(url, {
            baseUrl,
            language,
            fetcher: this.fetcher,
            timeoutMs: FETCH_TIMEOUT_MS,
          })

          if (!result.ok || !result.html) return null

          const objectClass = extractObjectClassFromEntryPage(result.html, language)
          if (objectClass && objectClass !== 'Unknown') {
            return { scpNumber, objectClass }
          }
          return null
        })
      )

      // Batch update D1 with resolved classes
      const updates: { scpNumber: number; objectClass: string }[] = []
      let fetchFailed = 0
      let classNotFound = 0
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          updates.push(r.value)
        } else if (r.status === 'fulfilled') {
          classNotFound++
        } else {
          fetchFailed++
        }
      }

      if (updates.length > 0) {
        const stmt = this.env.DB.prepare(
          `UPDATE scp_entries SET object_class = ?, updated_at = datetime('now') WHERE scp_number = ? AND language = ?`
        )
        await this.env.DB.batch(
          updates.map((u) => stmt.bind(u.objectClass, u.scpNumber, language))
        )
        updated += updates.length
      }

      // Delay between batches for rate limiting
      if (i + batchSize < entries.length) {
        await delay(humanDelay(150))
      }
    }

    console.log(`[ScpCrawlerDo] Backfill ${language}: ${updated}/${entries.length} entries updated`)
    return updated
  }

  // ─── D1 Helpers ─────────────────────────────────────────

  /**
   * Query class distribution from D1 for a language.
   * Returns a map of object_class → count.
   */
  private async getClassDistribution(language: 'en' | 'cn'): Promise<Record<string, number>> {
    const rows = await this.env.DB.prepare(
      'SELECT object_class, COUNT(*) as count FROM scp_entries WHERE language = ? GROUP BY object_class'
    ).bind(language).all<{ object_class: string; count: number }>()

    const dist: Record<string, number> = {}
    for (const r of rows.results) {
      dist[r.object_class] = r.count
    }
    return dist
  }

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
    // Preserve existing values for fields not provided in the partial state
    const existing = await this.getStateFromD1(language)
    const status = state.status ?? existing.status
    const lastCrawl = state.lastCrawl ?? existing.lastCrawl
    const totalEntries = state.totalEntries ?? existing.totalEntries
    const error = state.error ?? existing.error ?? null

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
      status,
      lastCrawl,
      totalEntries,
      error,
    ).run()
  }

  private async upsertEntriesToD1(language: 'en' | 'cn', entries: CrawlEntry[]): Promise<void> {
    // Batch insert/upsert entries
    // Preserve existing object_class when incoming value is 'Unknown'
    const stmt = this.env.DB.prepare(`
      INSERT INTO scp_entries (scp_number, language, name, object_class, url, series, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(scp_number, language) DO UPDATE SET
        name = excluded.name,
        object_class = CASE WHEN excluded.object_class = 'Unknown' THEN scp_entries.object_class ELSE excluded.object_class END,
        url = excluded.url,
        series = excluded.series,
        updated_at = excluded.updated_at
    `)

    // D1 supports batch operations — process in chunks of BATCH_SIZE
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const chunk = entries.slice(i, i + BATCH_SIZE)
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

  // ─── Daily Scheduled Crawl ──────────────────────────────

  /**
   * Fetch all existing entries from D1 for change detection.
   * Returns a map keyed by scp_number for O(1) lookup.
   */
  private async queryExistingEntries(language: 'en' | 'cn'): Promise<Map<number, CrawlEntry>> {
    const map = new Map<number, CrawlEntry>()
    let offset = 0
    const pageSize = 500

    // Paginated query to avoid unbounded result sets
    while (true) {
      const rows = await this.env.DB.prepare(
        'SELECT scp_number, name, object_class, url, series FROM scp_entries WHERE language = ? ORDER BY scp_number ASC LIMIT ? OFFSET ?'
      ).bind(language, pageSize, offset).all<{
        scp_number: number
        name: string
        object_class: string
        url: string
        series: number
      }>()

      for (const r of rows.results) {
        map.set(r.scp_number, {
          scpNumber: r.scp_number,
          name: r.name,
          objectClass: r.object_class,
          url: r.url,
          series: r.series,
        })
      }

      if (rows.results.length < pageSize) break
      offset += pageSize
    }

    return map
  }

  /**
   * Daily crawl — fetches all series pages, detects additions/changes
   * compared to D1, and upserts only the diff in batches of BATCH_SIZE.
   * Runs at a fixed time via DO alarm.
   */
  private async crawlDaily(language: 'en' | 'cn'): Promise<void> {
    const baseUrl = getWikiBaseUrl(language)
    const lastCrawlMap: Record<number, number> = {}
    const errors: string[] = []

    await this.upsertStateToD1(language, { status: 'crawling' })

    // Fetch all series pages and collect entries
    const fetchedEntries: CrawlEntry[] = []
    for (let i = 0; i < SERIES_PAGES.length; i++) {
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

      const { entries: pageEntries } = parseScpIndexPage(result.html, {
        baseUrl, language, seriesHint: seriesNum,
      })

      fetchedEntries.push(...pageEntries)
      lastCrawlMap[seriesNum] = Date.now()

      if (i < SERIES_PAGES.length - 1) {
        await delay(humanDelay(BASE_CRAWL_DELAY_MS))
      }
    }

    // Change detection: compare fetched entries against D1
    const existing = await this.queryExistingEntries(language)
    const toUpsert: CrawlEntry[] = []
    let added = 0
    let changed = 0
    let unchanged = 0

    for (const entry of fetchedEntries) {
      const prev = existing.get(entry.scpNumber)
      if (!prev) {
        // New entry not in D1
        toUpsert.push(entry)
        added++
      } else if (
        prev.name !== entry.name ||
        prev.objectClass !== entry.objectClass ||
        prev.url !== entry.url
      ) {
        // Existing entry with changes
        toUpsert.push(entry)
        changed++
      } else {
        unchanged++
      }
    }

    // Upsert only new/changed entries in batches of BATCH_SIZE
    if (toUpsert.length > 0) {
      await this.upsertEntriesToD1(language, toUpsert)
    }

    // Backfill entries that still have Unknown class by fetching individual pages
    await this.backfillUnknownClasses(language)

    // Update crawl state in D1
    const totalRow = await this.env.DB.prepare(
      'SELECT COUNT(*) as total FROM scp_entries WHERE language = ?'
    ).bind(language).first<{ total: number }>()

    const classDist = await this.getClassDistribution(language)
    const unknownCount = classDist['Unknown'] ?? 0

    const syncResult: SyncResult = { added, changed, unchanged }
    console.log(`[ScpCrawlerDo] Daily crawl ${language}: +${added} ~${changed} =${unchanged} (${toUpsert.length} upserted) | total=${totalRow?.total ?? 0} unknown=${unknownCount}`)

    await this.state.storage.put(STORAGE_KEY_LAST_CRAWL_MAP, lastCrawlMap)

    await this.upsertStateToD1(language, {
      status: errors.length > 0 && fetchedEntries.length === 0 ? 'error' : 'idle',
      lastCrawl: Date.now(),
      totalEntries: totalRow?.total ?? 0,
      error: errors.length > 0 && fetchedEntries.length === 0 ? errors[errors.length - 1] : undefined,
      lastSyncResult: syncResult,
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

    // Backfill entries that still have Unknown class by fetching individual pages
    await this.backfillUnknownClasses(language)

    // Get total count from D1
    const totalRow = await this.env.DB.prepare(
      'SELECT COUNT(*) as total FROM scp_entries WHERE language = ?'
    ).bind(language).first<{ total: number }>()

    const classDist = await this.getClassDistribution(language)
    const unknownCount = classDist['Unknown'] ?? 0

    console.log(`[ScpCrawlerDo] Full crawl ${language}: collected=${collected.length} errors=${errors.length} | total=${totalRow?.total ?? 0} unknown=${unknownCount}`)
    if (errors.length > 0) {
      console.log(`[ScpCrawlerDo] Full crawl ${language} errors: ${errors.join('; ')}`)
    }

    await this.state.storage.put(STORAGE_KEY_CURSOR, 0)
    await this.state.storage.put(STORAGE_KEY_LAST_CRAWL_MAP, lastCrawlMap)

    await this.upsertStateToD1(language, {
      status: errors.length > 0 && collected.length === 0 ? 'error' : 'idle',
      lastCrawl: Date.now(),
      totalEntries: totalRow?.total ?? 0,
      error: errors.length > 0 && collected.length === 0 ? errors[errors.length - 1] : undefined,
    })

    await this.state.storage.setAlarm(getNextAlarmTime())
  }
}
