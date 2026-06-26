import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScpCrawlerDo } from '../scp-crawler'
import type { Env, CrawlState, CrawlEntry } from '../../types'

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
})
