import type { CrawlEntry, CrawlState, Env } from '../types'
import { parseScpIndexPage, SERIES_PAGES, getWikiBaseUrl } from './parser'

// ─── Constants ──────────────────────────────────────────────

const STORAGE_KEY_STATE = 'state'
const STORAGE_KEY_ENTRIES = 'entries'
const STORAGE_KEY_PREFIX_SERIES = 'series_'
const STORAGE_KEY_CURSOR = 'crawl_cursor'
const STORAGE_KEY_LAST_CRAWL_MAP = 'last_crawl_map'

const ALARM_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours
const CRAWL_DELAY_MS = 500 // delay between page fetches
const FETCH_TIMEOUT_MS = 10_000 // per-page fetch timeout
const MAX_RETRIES = 2
const SERIES_PER_ALARM = 1 // how many series to crawl per alarm cycle

const USER_AGENT = 'SCP-Latom-Node/1.0 (contact: admin@scp.lat)'

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

  /**
   * HTTP handler — all requests to this DO arrive here.
   */
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

  /**
   * Alarm handler — performs incremental crawl.
   * Crawls 1-2 series pages per cycle, rotating through all 8.
   * Full cycle completes over ~8 days.
   */
  async alarm(): Promise<void> {
    try {
      const entries = await this.getEntries()
      if (entries.length === 0) {
        // No data yet — do a full crawl first
        const language = 'en' // default; will be overridden on first manual trigger
        await this.crawlAll(language)
      } else {
        // Incremental crawl
        const isCn = entries[0]?.url.includes('scp-wiki-cn')
        const language: 'en' | 'cn' = isCn ? 'cn' : 'en'
        await this.crawlIncremental(language)
      }
    } catch (err) {
      console.error('[ScpCrawlerDo] Alarm error:', err)
    }

    // Always schedule next alarm
    await this.state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS)
  }

  // ─── Route Handlers ─────────────────────────────────────

  private async handleStatus(language: 'en' | 'cn'): Promise<Response> {
    const state = await this.getState()
    const cursor = await this.getCursor()
    const lastCrawlMap = await this.getLastCrawlMap()

    return jsonResponse({
      success: true,
      language,
      state,
      incremental: {
        nextSeries: cursor,
        seriesLastCrawl: lastCrawlMap,
      },
    })
  }

  private async handleEntries(language: 'en' | 'cn', url: URL): Promise<Response> {
    const state = await this.getState()

    if (state.totalEntries === 0) {
      return jsonResponse({
        success: true,
        language,
        entries: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
        state,
      })
    }

    let entries = await this.getEntries()

    const classFilter = url.searchParams.get('class')
    if (classFilter) {
      entries = entries.filter(
        (e) => e.objectClass.toLowerCase() === classFilter.toLowerCase()
      )
    }

    const query = url.searchParams.get('q')
    if (query) {
      const q = query.toLowerCase()
      entries = entries.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.scpNumber.toString().includes(q) ||
          `scp-${e.scpNumber}`.includes(q)
      )
    }

    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') ?? '50', 10) || 50))
    const total = entries.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const paginated = entries.slice(start, start + limit)

    return jsonResponse({
      success: true,
      language,
      entries: paginated,
      total,
      page,
      limit,
      totalPages,
      state,
    })
  }

  private async handleSeries(language: 'en' | 'cn', seriesNum: number): Promise<Response> {
    if (seriesNum < 1 || seriesNum > SERIES_PAGES.length) {
      return errorResponse(`Invalid series number. Valid range: 1-${SERIES_PAGES.length}`, 400)
    }

    const key = `${STORAGE_KEY_PREFIX_SERIES}${seriesNum}`
    const entries = (await this.state.storage.get<CrawlEntry[]>(key)) ?? []

    return jsonResponse({
      success: true,
      language,
      series: seriesNum,
      entries,
      total: entries.length,
    })
  }

  private async handleTriggerCrawl(language: 'en' | 'cn', url: URL): Promise<Response> {
    const state = await this.getState()

    if (state.status === 'crawling') {
      return jsonResponse(
        { success: false, error: 'Crawl already in progress', state },
        409
      )
    }

    // Parse optional limit parameter
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10) || 0) : 0

    // Manual trigger = full crawl (with optional limit)
    const ctx = this.state as unknown as { waitUntil?: (p: Promise<void>) => void }
    if (typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(this.crawlAll(language, limit))
    } else {
      this.crawlAll(language, limit).catch(() => {})
    }

    const crawlingState: CrawlState = {
      status: 'crawling',
      lastCrawl: state.lastCrawl,
      totalEntries: state.totalEntries,
    }

    return jsonResponse({
      success: true,
      language,
      message: limit > 0 ? `Crawl triggered (limit: ${limit} entries)` : 'Full crawl triggered',
      state: crawlingState,
    })
  }

  // ─── Incremental Crawl ──────────────────────────────────

  /**
   * Incremental crawl — fetches only SERIES_PER_ALARM series pages,
   * merges results into existing data.
   */
  private async crawlIncremental(language: 'en' | 'cn'): Promise<void> {
    const cursor = await this.getCursor()
    const lastCrawlMap = await this.getLastCrawlMap()
    const existingEntries = await this.getEntries()
    const baseUrl = getWikiBaseUrl(language)

    // Build the set of series to crawl this cycle
    const seriesToCrawl: number[] = []
    for (let i = 0; i < SERIES_PER_ALARM; i++) {
      const seriesIdx = (cursor + i) % SERIES_PAGES.length
      seriesToCrawl.push(seriesIdx) // 0-based index
    }

    // Set crawling state (preserve existing entry count)
    await this.state.storage.put(STORAGE_KEY_STATE, {
      status: 'crawling',
      lastCrawl: 0,
      totalEntries: existingEntries.length,
    })

    const newEntriesByScp = new Map<number, CrawlEntry>()
    let crawlErrors = 0

    for (const seriesIdx of seriesToCrawl) {
      const pageSlug = SERIES_PAGES[seriesIdx]
      const seriesNum = seriesIdx + 1
      const pageUrl = `${baseUrl}/${pageSlug}`

      const html = await this.fetchPage(pageUrl, language)
      if (!html) {
        crawlErrors++
        continue
      }

      const { entries: pageEntries, errors: parseErrors } = parseScpIndexPage(html, {
        baseUrl,
        language,
        seriesHint: seriesNum,
      })

      if (parseErrors.length > 0) {
        console.warn(`[ScpCrawlerDo] Parse errors on ${pageSlug}:`, parseErrors)
      }

      // Update series-specific storage
      await this.state.storage.put(`${STORAGE_KEY_PREFIX_SERIES}${seriesNum}`, pageEntries)

      // Index new entries by SCP number for merge
      for (const entry of pageEntries) {
        newEntriesByScp.set(entry.scpNumber, entry)
      }

      // Update last crawl time for this series
      lastCrawlMap[seriesNum] = Date.now()

      // Rate limit between pages
      if (seriesIdx !== seriesToCrawl[seriesToCrawl.length - 1]) {
        await delay(CRAWL_DELAY_MS)
      }
    }

    // Merge: update existing entries with new data, add new ones
    const mergedMap = new Map<number, CrawlEntry>()
    for (const entry of existingEntries) {
      mergedMap.set(entry.scpNumber, entry)
    }
    for (const [scpNumber, entry] of newEntriesByScp) {
      mergedMap.set(scpNumber, entry)
    }

    const mergedEntries = Array.from(mergedMap.values()).sort((a, b) => a.scpNumber - b.scpNumber)

    // Advance cursor
    const nextCursor = (cursor + SERIES_PER_ALARM) % SERIES_PAGES.length

    // Store results
    await this.state.storage.put(STORAGE_KEY_ENTRIES, mergedEntries)
    await this.state.storage.put(STORAGE_KEY_CURSOR, nextCursor)
    await this.state.storage.put(STORAGE_KEY_LAST_CRAWL_MAP, lastCrawlMap)
    await this.state.storage.put(STORAGE_KEY_STATE, {
      status: crawlErrors === seriesToCrawl.length ? 'error' : 'idle',
      lastCrawl: Date.now(),
      totalEntries: mergedEntries.length,
      error: crawlErrors === seriesToCrawl.length ? 'All series fetches failed' : undefined,
    })
  }

  // ─── Full Crawl ─────────────────────────────────────────

  /**
   * Full crawl — fetches all series pages. Used for manual triggers
   * and first-time initialization.
   * @param limit - Max entries to collect. 0 = unlimited (all entries).
   */
  private async crawlAll(language: 'en' | 'cn', limit = 0): Promise<void> {
    const baseUrl = getWikiBaseUrl(language)
    const allEntries: CrawlEntry[] = []
    const lastCrawlMap: Record<number, number> = {}
    let hasErrors = false
    let lastError = ''

    await this.state.storage.put(STORAGE_KEY_STATE, {
      status: 'crawling',
      lastCrawl: 0,
      totalEntries: 0,
    })

    for (let i = 0; i < SERIES_PAGES.length; i++) {
      // Stop early if we've reached the limit
      if (limit > 0 && allEntries.length >= limit) break

      const pageSlug = SERIES_PAGES[i]
      const pageUrl = `${baseUrl}/${pageSlug}`
      const seriesNum = i + 1

      const html = await this.fetchPage(pageUrl, language)

      if (!html) {
        hasErrors = true
        lastError = `Failed to fetch ${pageSlug}`
        continue
      }

      const { entries: pageEntries, errors: parseErrors } = parseScpIndexPage(html, {
        baseUrl,
        language,
        seriesHint: seriesNum,
      })

      if (parseErrors.length > 0) {
        console.warn(`[ScpCrawlerDo] Parse errors on ${pageSlug}:`, parseErrors)
      }

      // If limit is set, only take what we need from this page
      if (limit > 0) {
        const remaining = limit - allEntries.length
        allEntries.push(...pageEntries.slice(0, remaining))
      } else {
        allEntries.push(...pageEntries)
      }

      lastCrawlMap[seriesNum] = Date.now()

      // Store per-series data (store full page, not truncated)
      await this.state.storage.put(`${STORAGE_KEY_PREFIX_SERIES}${seriesNum}`, pageEntries)

      if (i < SERIES_PAGES.length - 1) {
        await delay(CRAWL_DELAY_MS)
      }
    }

    allEntries.sort((a, b) => a.scpNumber - b.scpNumber)

    await this.state.storage.put(STORAGE_KEY_STATE, {
      status: hasErrors && allEntries.length === 0 ? 'error' : 'idle',
      lastCrawl: Date.now(),
      totalEntries: allEntries.length,
      error: hasErrors && allEntries.length === 0 ? lastError : undefined,
    })
    await this.state.storage.put(STORAGE_KEY_ENTRIES, allEntries)
    await this.state.storage.put(STORAGE_KEY_LAST_CRAWL_MAP, lastCrawlMap)
    await this.state.storage.put(STORAGE_KEY_CURSOR, 0)
    await this.state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS)
  }

  // ─── Fetch Helper ───────────────────────────────────────

  /**
   * Fetch a single page with retries and error handling.
   * Returns null on failure.
   */
  private async fetchPage(url: string, language: 'en' | 'cn'): Promise<string | null> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

        const response = await this.fetcher(url, {
          headers: {
            'User-Agent': USER_AGENT,
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Language': language === 'cn' ? 'zh-CN,zh;q=0.9' : 'en-US,en;q=0.9',
          },
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (response.status === 429) {
          console.warn(`[ScpCrawlerDo] Rate limited on ${url}, attempt ${attempt}`)
          const backoffMs = Math.pow(2, attempt + 1) * 1000
          await delay(backoffMs)
          continue
        }

        if (!response.ok) {
          console.warn(`[ScpCrawlerDo] HTTP ${response.status} for ${url}, attempt ${attempt}`)
          if (attempt < MAX_RETRIES) {
            await delay(1000 * (attempt + 1))
            continue
          }
          return null
        }

        const html = await response.text()
        console.log(`[ScpCrawlerDo] Fetched ${url}: ${html.length} bytes`)
        return html
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`[ScpCrawlerDo] Fetch error for ${url} (attempt ${attempt}): ${msg}`)
        if (attempt < MAX_RETRIES) {
          await delay(1000 * (attempt + 1))
          continue
        }
        return null
      }
    }
    return null
  }

  // ─── Storage Helpers ─────────────────────────────────────

  private async getState(): Promise<CrawlState> {
    return (
      (await this.state.storage.get<CrawlState>(STORAGE_KEY_STATE)) ?? {
        status: 'idle',
        lastCrawl: 0,
        totalEntries: 0,
      }
    )
  }

  private async getEntries(): Promise<CrawlEntry[]> {
    return (await this.state.storage.get<CrawlEntry[]>(STORAGE_KEY_ENTRIES)) ?? []
  }

  private async getCursor(): Promise<number> {
    return (await this.state.storage.get<number>(STORAGE_KEY_CURSOR)) ?? 0
  }

  private async getLastCrawlMap(): Promise<Record<number, number>> {
    return (await this.state.storage.get<Record<number, number>>(STORAGE_KEY_LAST_CRAWL_MAP)) ?? {}
  }
}
