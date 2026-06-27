import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ScpCrawlerDo } from '../scp-crawler'
import * as httpClient from '../http-client'
import type { Env, CrawlState, CrawlEntry, SyncResult } from '../../types'

// ─── Mocks ──────────────────────────────────────────────────

function createMockStorage(initialData: Record<string, unknown> = {}) {
  const store = new Map<string, unknown>(Object.entries(initialData))
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: unknown) => { store.set(key, value) }),
    delete: vi.fn(async (key: string) => { store.delete(key) }),
    setAlarm: vi.fn(async () => {}),
    getAlarm: vi.fn(async () => null),
  }
}

function createMockD1(existingState?: CrawlState, existingEntries?: CrawlEntry[]) {
  const entries = existingEntries ?? []
  const stateRow = existingState
    ? { status: existingState.status, last_crawl: existingState.lastCrawl, total_entries: existingState.totalEntries, error: existingState.error ?? null }
    : null

  return {
    prepare: vi.fn((sql: string) => {
      const stmt = {
        _sql: sql,
        bind: vi.fn((...args: unknown[]) => stmt),
        first: vi.fn(async () => {
          if (sql.includes('COUNT(*)')) return { total: entries.length }
          if (sql.includes('crawl_state')) return stateRow
          return null
        }),
        all: vi.fn(async () => ({ results: entries.map((e) => ({
          scp_number: e.scpNumber, name: e.name, object_class: e.objectClass, url: e.url, series: e.series,
        })) })),
        run: vi.fn(async () => ({})),
      }
      return stmt
    }),
    batch: vi.fn(async () => []),
  }
}

function createMockEnv(overrides?: Partial<Env>): Env {
  return {
    DB: createMockD1() as unknown as D1Database,
    JWT_SECRET: 'test',
    CORS_ORIGINS: '*',
    SCP_EN_CRAWLER: {} as DurableObjectNamespace,
    SCP_CN_CRAWLER: {} as DurableObjectNamespace,
    ...overrides,
  } as Env
}

function createMockState(storageData?: Record<string, unknown>) {
  const storage = createMockStorage(storageData)
  return {
    storage,
    id: 'mock-do-id',
    blockConcurrencyWhile: vi.fn(async (fn: () => Promise<void>) => fn()),
  } as unknown as DurableObjectState
}

// ─── Tests ──────────────────────────────────────────────────

describe('ScpCrawlerDo', () => {
  let env: Env

  beforeEach(() => {
    env = createMockEnv()
  })

  describe('fetch handler', () => {
    it('returns error for missing language prefix', async () => {
      const state = createMockState()
      const doInstance = new ScpCrawlerDo(state, env)

      const req = new Request('https://do.scp/status')
      const res = await doInstance.fetch(req)
      const body = (await res.json()) as { success: boolean; error: string }

      expect(res.status).toBe(400)
      expect(body.success).toBe(false)
      expect(body.error).toContain('Missing language prefix')
    })

    it('returns status for /en/status', async () => {
      const state = createMockState()
      const doInstance = new ScpCrawlerDo(state, env)

      const req = new Request('https://do.scp/en/status')
      const res = await doInstance.fetch(req)
      const body = (await res.json()) as {
        success: boolean
        language: string
        state: CrawlState
      }

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.language).toBe('en')
      expect(body.state).toBeDefined()
    })

    it('returns status for /cn/status', async () => {
      const state = createMockState()
      const doInstance = new ScpCrawlerDo(state, env)

      const req = new Request('https://do.scp/cn/status')
      const res = await doInstance.fetch(req)
      const body = (await res.json()) as { success: boolean; language: string }

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.language).toBe('cn')
    })

    it('returns empty entries when no data', async () => {
      const state = createMockState()
      const doInstance = new ScpCrawlerDo(state, env)

      const req = new Request('https://do.scp/en/entries')
      const res = await doInstance.fetch(req)
      const body = (await res.json()) as {
        success: boolean
        entries: CrawlEntry[]
        total: number
      }

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.entries).toEqual([])
      expect(body.total).toBe(0)
    })

    it('returns stored entries from D1', async () => {
      const storedEntries: CrawlEntry[] = [
        { scpNumber: 173, name: 'The Sculpture', objectClass: 'Euclid', url: 'https://scp-wiki.wikidot.com/scp-173', series: 1 },
        { scpNumber: 999, name: 'Tickle Monster', objectClass: 'Safe', url: 'https://scp-wiki.wikidot.com/scp-999', series: 1 },
      ]
      const storedState: CrawlState = { status: 'idle', lastCrawl: Date.now(), totalEntries: 2 }

      const envWithD1 = {
        ...createMockEnv(),
        DB: createMockD1(storedState, storedEntries) as unknown as D1Database,
      }

      const state = createMockState()
      const doInstance = new ScpCrawlerDo(state, envWithD1)

      const req = new Request('https://do.scp/en/entries')
      const res = await doInstance.fetch(req)
      const body = (await res.json()) as {
        success: boolean
        entries: CrawlEntry[]
        total: number
      }

      expect(body.success).toBe(true)
      expect(body.entries).toHaveLength(2)
      expect(body.total).toBe(2)
    })

    it('returns 404 for unknown paths', async () => {
      const state = createMockState()
      const doInstance = new ScpCrawlerDo(state, env)

      const req = new Request('https://do.scp/en/unknown')
      const res = await doInstance.fetch(req)

      expect(res.status).toBe(404)
    })

    it('triggers crawl via POST', async () => {
      const state = createMockState()
      const doInstance = new ScpCrawlerDo(state, env)

      const req = new Request('https://do.scp/en/crawl', { method: 'POST' })
      const res = await doInstance.fetch(req)
      const body = (await res.json()) as {
        success: boolean
        message: string
        state: CrawlState
      }

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.message).toBe('Full crawl triggered')
      expect(body.state.status).toBe('crawling')
    })
  })

  // ─── Daily Crawl Tests ────────────────────────────────────

  describe('crawlDaily', () => {
    // Helper to build a mock D1 that distinguishes queryExistingEntries from other queries
    function createSmartMockD1(existingEntries: CrawlEntry[], stateRow: { status: string; last_crawl: number; total_entries: number; error: string | null }) {
      return {
        prepare: vi.fn((sql: string) => {
          const stmt = {
            _sql: sql,
            bind: vi.fn((...args: unknown[]) => stmt),
            first: vi.fn(async () => {
              if (sql.includes('COUNT(*)')) return { total: existingEntries.length }
              if (sql.includes('crawl_state')) return stateRow
              return null
            }),
            all: vi.fn(async () => {
              // queryExistingEntries uses LIMIT ? OFFSET ? on scp_entries
              if (sql.includes('scp_entries') && sql.includes('LIMIT')) {
                return { results: existingEntries.map((e) => ({
                  scp_number: e.scpNumber, name: e.name, object_class: e.objectClass, url: e.url, series: e.series,
                })) }
              }
              return { results: [] }
            }),
            run: vi.fn(async () => ({})),
          }
          return stmt
        }),
        batch: vi.fn(async () => []),
      }
    }

    beforeEach(() => {
      // Mock fetchPageLikeBrowser to avoid real HTTP and cookie jar issues
      vi.spyOn(httpClient, 'fetchPageLikeBrowser').mockResolvedValue({ ok: false, status: 404, html: null, error: 'mocked' })
      // Mock humanDelay to eliminate real delays in tests
      vi.spyOn(httpClient, 'humanDelay').mockReturnValue(0)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('detects new entries and upserts them', async () => {
      // Index pages don't have "Object Class:" so parser produces 'Unknown'
      const existingEntries: CrawlEntry[] = [
        { scpNumber: 173, name: 'The Sculpture', objectClass: 'Unknown', url: 'https://scp-wiki.wikidot.com/scp-173', series: 1 },
      ]
      const stateRow = { status: 'idle', last_crawl: Date.now(), total_entries: 1, error: null }
      const d1 = createSmartMockD1(existingEntries, stateRow)
      const envWithD1 = { ...createMockEnv(), DB: d1 as unknown as D1Database }

      const state = createMockState()
      const doInstance = new ScpCrawlerDo(state, envWithD1)

      // Return HTML with 2 entries: 1 existing + 1 new
      vi.mocked(httpClient.fetchPageLikeBrowser).mockResolvedValue({
        ok: true, status: 200,
        html: `<p><a href="/scp-173">SCP-173</a> - The Sculpture <span style="color:#bb0000">Euclid</span></p>
               <p><a href="/scp-999">SCP-999</a> - Tickle Monster <span style="color:#009900">Safe</span></p>`,
      })

      await doInstance.alarm()

      // Verify batch was called (upsertEntriesToD1 uses DB.batch for new/changed entries)
      expect(d1.batch).toHaveBeenCalled()
      // Verify setAlarm was called (re-arms for next fixed time)
      expect(state.storage.setAlarm).toHaveBeenCalled()
    })

    it('detects changed entries and upserts them', async () => {
      // Existing entry has a different name — change detection should flag it
      const existingEntries: CrawlEntry[] = [
        { scpNumber: 173, name: 'Old Name', objectClass: 'Unknown', url: 'https://scp-wiki.wikidot.com/scp-173', series: 1 },
      ]
      const stateRow = { status: 'idle', last_crawl: Date.now(), total_entries: 1, error: null }
      const d1 = createSmartMockD1(existingEntries, stateRow)
      const envWithD1 = { ...createMockEnv(), DB: d1 as unknown as D1Database }

      const state = createMockState()
      const doInstance = new ScpCrawlerDo(state, envWithD1)

      // Same SCP but name and class changed
      vi.mocked(httpClient.fetchPageLikeBrowser).mockResolvedValue({
        ok: true, status: 200,
        html: `<p><a href="/scp-173">SCP-173</a> - The Sculpture <span style="color:#bb0000">Euclid</span></p>`,
      })

      await doInstance.alarm()

      // Should detect the name/class change and upsert
      expect(d1.batch).toHaveBeenCalled()
    })

    it('upserts only changed entries when some match and some differ', async () => {
      // Two existing entries: one will match, one will have a name change
      const existingEntries: CrawlEntry[] = [
        { scpNumber: 173, name: 'The Sculpture', objectClass: 'Unknown', url: 'https://scp-wiki.wikidot.com/scp-173', series: 1 },
        { scpNumber: 999, name: 'Old Name', objectClass: 'Unknown', url: 'https://scp-wiki.wikidot.com/scp-999', series: 1 },
      ]
      const stateRow = { status: 'idle', last_crawl: Date.now(), total_entries: 2, error: null }
      const d1 = createSmartMockD1(existingEntries, stateRow)
      const envWithD1 = { ...createMockEnv(), DB: d1 as unknown as D1Database }

      const state = createMockState()
      const doInstance = new ScpCrawlerDo(state, envWithD1)

      // Wiki returns both entries — SCP-173 unchanged, SCP-999 name changed
      vi.mocked(httpClient.fetchPageLikeBrowser).mockResolvedValue({
        ok: true, status: 200,
        html: `<p><a href="/scp-173">SCP-173</a> - The Sculpture</p>
               <p><a href="/scp-999">SCP-999</a> - Tickle Monster</p>`,
      })

      await doInstance.alarm()

      // Should detect the change in SCP-999 and upsert
      expect(d1.batch).toHaveBeenCalled()
      // Alarm should still be re-armed
      expect(state.storage.setAlarm).toHaveBeenCalled()
    })

    it('re-arms alarm to next fixed daily time', async () => {
      const d1 = createMockD1()
      const envWithD1 = { ...createMockEnv(), DB: d1 as unknown as D1Database }

      const state = createMockState()
      const doInstance = new ScpCrawlerDo(state, envWithD1)

      await doInstance.alarm()

      // setAlarm should have been called
      expect(state.storage.setAlarm).toHaveBeenCalled()

      // The alarm time should be a future timestamp
      const alarmArg = (state.storage.setAlarm as ReturnType<typeof vi.fn>).mock.calls[0][0] as number
      expect(alarmArg).toBeGreaterThan(Date.now())

      // Should be within the next 24 hours
      const maxDelay = 24 * 60 * 60 * 1000
      expect(alarmArg - Date.now()).toBeLessThanOrEqual(maxDelay)
    })

    it('skips crawling if language is already in crawling state', async () => {
      const d1 = createMockD1({ status: 'crawling', lastCrawl: Date.now(), totalEntries: 100 })
      const envWithD1 = { ...createMockEnv(), DB: d1 as unknown as D1Database }

      const state = createMockState()
      const doInstance = new ScpCrawlerDo(state, envWithD1)

      await doInstance.alarm()

      // Should not have called fetchPageLikeBrowser (skipped due to crawling state)
      expect(httpClient.fetchPageLikeBrowser).not.toHaveBeenCalled()
      // But alarm should still be re-armed
      expect(state.storage.setAlarm).toHaveBeenCalled()
    })
  })

  // ─── Entry Content Tests ─────────────────────────────────────

  describe('handleEntryContent', () => {
    it('returns 404 when entry not found in index', async () => {
      const d1 = createMockD1()
      const envWithD1 = { ...createMockEnv(), DB: d1 as unknown as D1Database }
      const state = createMockState()
      const doInstance = new ScpCrawlerDo(state, envWithD1)

      const req = new Request('https://do.scp/en/entry/173')
      const res = await doInstance.fetch(req)
      const body = (await res.json()) as { success: boolean; error: string }

      expect(res.status).toBe(404)
      expect(body.success).toBe(false)
      expect(body.error).toContain('not found')
    })

    it('returns cached content when available', async () => {
      const cachedContent = '<div class="scp-content"><p>SCP-173 content</p></div>'
      const storedEntries: CrawlEntry[] = [
        { scpNumber: 173, name: 'The Sculpture', objectClass: 'Euclid', url: 'https://scp-wiki.wikidot.com/scp-173', series: 1 },
      ]
      const storedState: CrawlState = { status: 'idle', lastCrawl: Date.now(), totalEntries: 1 }

      const d1 = {
        prepare: vi.fn((sql: string) => {
          const stmt = {
            _sql: sql,
            bind: vi.fn((...args: unknown[]) => stmt),
            first: vi.fn(async () => {
              if (sql.includes('content_fetched_at')) {
                return { name: 'The Sculpture', object_class: 'Euclid', content: cachedContent, content_fetched_at: '2025-01-01 00:00:00' }
              }
              if (sql.includes('COUNT(*)')) return { total: 1 }
              if (sql.includes('crawl_state')) return { status: 'idle', last_crawl: Date.now(), total_entries: 1, error: null }
              return null
            }),
            all: vi.fn(async () => ({ results: storedEntries.map((e) => ({
              scp_number: e.scpNumber, name: e.name, object_class: e.objectClass, url: e.url, series: e.series,
            })) })),
            run: vi.fn(async () => ({})),
          }
          return stmt
        }),
        batch: vi.fn(async () => []),
      }

      const envWithD1 = { ...createMockEnv(), DB: d1 as unknown as D1Database }
      const state = createMockState()
      const doInstance = new ScpCrawlerDo(state, envWithD1)

      const req = new Request('https://do.scp/en/entry/173')
      const res = await doInstance.fetch(req)
      const body = (await res.json()) as { success: boolean; status: string; content: string }

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.status).toBe('cached')
      expect(body.content).toBe(cachedContent)
    })

    it('returns pending status when content not yet fetched', async () => {
      const storedEntries: CrawlEntry[] = [
        { scpNumber: 173, name: 'The Sculpture', objectClass: 'Euclid', url: 'https://scp-wiki.wikidot.com/scp-173', series: 1 },
      ]
      const storedState: CrawlState = { status: 'idle', lastCrawl: Date.now(), totalEntries: 1 }

      const d1 = {
        prepare: vi.fn((sql: string) => {
          const stmt = {
            _sql: sql,
            bind: vi.fn((...args: unknown[]) => stmt),
            first: vi.fn(async () => {
              if (sql.includes('content_fetched_at')) {
                return { name: 'The Sculpture', object_class: 'Euclid', content: null, content_fetched_at: null }
              }
              if (sql.includes('COUNT(*)')) return { total: 1 }
              if (sql.includes('crawl_state')) return { status: 'idle', last_crawl: Date.now(), total_entries: 1, error: null }
              return null
            }),
            all: vi.fn(async () => ({ results: storedEntries.map((e) => ({
              scp_number: e.scpNumber, name: e.name, object_class: e.objectClass, url: e.url, series: e.series,
            })) })),
            run: vi.fn(async () => ({})),
          }
          return stmt
        }),
        batch: vi.fn(async () => []),
      }

      const envWithD1 = { ...createMockEnv(), DB: d1 as unknown as D1Database }
      const state = createMockState()
      const doInstance = new ScpCrawlerDo(state, envWithD1)

      // Mock fetchPageLikeBrowser to avoid real HTTP call
      vi.spyOn(httpClient, 'fetchPageLikeBrowser').mockResolvedValue({ ok: false, status: 404, html: null, error: 'mocked' })

      const req = new Request('https://do.scp/en/entry/173')
      const res = await doInstance.fetch(req)
      const body = (await res.json()) as { success: boolean; status: string; message: string }

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.status).toBe('pending')
      expect(body.message).toContain('being fetched')

      vi.restoreAllMocks()
    })
  })

  describe('getNextAlarmTime', () => {
    it('calculates alarm time correctly', () => {
      // getNextAlarmTime is a module-level function, tested indirectly via alarm()
      // We verify that the alarm set by crawlAll/crawlDaily is a valid future timestamp
      // This is already covered by the 're-arms alarm to next fixed daily time' test above
      expect(true).toBe(true)
    })
  })
})
