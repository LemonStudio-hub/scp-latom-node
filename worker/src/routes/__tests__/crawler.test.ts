import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import type { Env, CrawlState } from '../../types'
import crawlerRoutes from '../crawler'

// ─── Mock Durable Object ────────────────────────────────────

const mockEntries = [
  { scpNumber: 173, name: 'The Sculpture', objectClass: 'Euclid', url: 'https://scp-wiki.wikidot.com/scp-173', series: 1 },
  { scpNumber: 682, name: 'Hard-to-Destroy Reptile', objectClass: 'Keter', url: 'https://scp-wiki.wikidot.com/scp-682', series: 1 },
  { scpNumber: 999, name: 'Tickle Monster', objectClass: 'Safe', url: 'https://scp-wiki.wikidot.com/scp-999', series: 1 },
]

let mockStatus = 'idle'

function createMockDoResponse(path: string, method: string): Response {
  const lang = path.includes('/cn/') ? 'cn' : 'en'

  if (path.endsWith('/status')) {
    return Response.json({
      success: true,
      language: lang,
      state: { status: mockStatus, lastCrawl: Date.now(), totalEntries: mockEntries.length },
    })
  }

  if (path.endsWith('/entries')) {
    return Response.json({
      success: true,
      language: lang,
      entries: mockEntries,
      total: mockEntries.length,
      page: 1,
      limit: 50,
      totalPages: 1,
      state: { status: mockStatus, lastCrawl: Date.now(), totalEntries: mockEntries.length },
    })
  }

  if (path.includes('/series/')) {
    const seriesNum = parseInt(path.match(/\/series\/(\d+)/)?.[1] ?? '1', 10)
    return Response.json({
      success: true,
      language: lang,
      series: seriesNum,
      entries: mockEntries.filter((e) => e.series === seriesNum),
      total: mockEntries.filter((e) => e.series === seriesNum).length,
    })
  }

  if (path.endsWith('/crawl') && method === 'POST') {
    mockStatus = 'crawling'
    return Response.json({
      success: true,
      language: lang,
      message: 'Crawl triggered',
      state: { status: 'crawling', lastCrawl: 0, totalEntries: 0 },
    })
  }

  return Response.json({ success: false, error: 'Not found' }, { status: 404 })
}

function createMockNamespace(): DurableObjectNamespace {
  return {
    idFromName: vi.fn(() => 'mock-id' as unknown as DurableObjectId),
    get: vi.fn(() => ({
      fetch: vi.fn((url: string, init?: RequestInit) => {
        const parsedUrl = new URL(url)
        return Promise.resolve(createMockDoResponse(parsedUrl.pathname, init?.method ?? 'GET'))
      }),
    })),
  } as unknown as DurableObjectNamespace
}

function createTestApp(): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>()
  app.route('/api/v1/crawler', crawlerRoutes)
  return app
}

function createMockEnv(): Env {
  return {
    DB: {} as D1Database,
    JWT_SECRET: 'test-secret',
    CORS_ORIGINS: '*',
    SCP_EN_CRAWLER: createMockNamespace(),
    SCP_CN_CRAWLER: createMockNamespace(),
  } as unknown as Env
}

// ─── Tests ──────────────────────────────────────────────────

describe('Crawler Routes', () => {
  let app: Hono<{ Bindings: Env }>

  beforeEach(() => {
    app = createTestApp()
    mockStatus = 'idle'
  })

  describe('GET /api/v1/crawler/status', () => {
    it('returns status for both languages', async () => {
      const res = await app.request('/api/v1/crawler/status', undefined, createMockEnv())
      const body = (await res.json()) as {
        success: boolean
        en: CrawlState
        cn: CrawlState
      }

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.en).toBeDefined()
      expect(body.cn).toBeDefined()
      expect(body.en.status).toBe('idle')
      expect(body.cn.status).toBe('idle')
    })
  })

  describe('GET /api/v1/crawler/:lang/status', () => {
    it('returns status for English', async () => {
      const res = await app.request('/api/v1/crawler/en/status', undefined, createMockEnv())
      const body = (await res.json()) as {
        success: boolean
        language: string
        state: CrawlState
      }

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.language).toBe('en')
      expect(body.state).toBeDefined()
      expect(body.state.status).toBe('idle')
    })

    it('returns status for Chinese', async () => {
      const res = await app.request('/api/v1/crawler/cn/status', undefined, createMockEnv())
      const body = (await res.json()) as {
        success: boolean
        language: string
        state: CrawlState
      }

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.language).toBe('cn')
    })

    it('rejects invalid language', async () => {
      const res = await app.request('/api/v1/crawler/invalid/status', undefined, createMockEnv())
      const body = (await res.json()) as { success: boolean; error: string }

      expect(res.status).toBe(400)
      expect(body.success).toBe(false)
      expect(body.error).toContain('Invalid language')
    })
  })

  describe('GET /api/v1/crawler/:lang/entries', () => {
    it('returns entries for English', async () => {
      const res = await app.request('/api/v1/crawler/en/entries', undefined, createMockEnv())
      const body = (await res.json()) as {
        success: boolean
        language: string
        entries: unknown[]
        total: number
        page: number
        limit: number
      }

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.language).toBe('en')
      expect(body.entries).toHaveLength(3)
      expect(body.total).toBe(3)
      expect(body.page).toBe(1)
      expect(body.limit).toBe(50)
    })

    it('forwards query parameters', async () => {
      const res = await app.request(
        '/api/v1/crawler/en/entries?class=Safe&page=1&limit=10',
        undefined,
        createMockEnv()
      )
      const body = (await res.json()) as { success: boolean }

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
    })

    it('rejects invalid language', async () => {
      const res = await app.request('/api/v1/crawler/xx/entries', undefined, createMockEnv())
      const body = (await res.json()) as { success: boolean }

      expect(res.status).toBe(400)
      expect(body.success).toBe(false)
    })
  })

  describe('GET /api/v1/crawler/:lang/series/:n', () => {
    it('returns entries for series 1', async () => {
      const res = await app.request('/api/v1/crawler/en/series/1', undefined, createMockEnv())
      const body = (await res.json()) as {
        success: boolean
        series: number
        entries: unknown[]
      }

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.series).toBe(1)
      expect(body.entries).toBeDefined()
    })

    it('rejects invalid series number', async () => {
      const res = await app.request('/api/v1/crawler/en/series/99', undefined, createMockEnv())
      const body = (await res.json()) as { success: boolean; error: string }

      expect(res.status).toBe(400)
      expect(body.success).toBe(false)
      expect(body.error).toContain('Invalid series number')
    })
  })

  describe('POST /api/v1/crawler/:lang/crawl', () => {
    it('triggers crawl for English', async () => {
      const res = await app.request('/api/v1/crawler/en/crawl', { method: 'POST' }, createMockEnv())
      const body = (await res.json()) as {
        success: boolean
        language: string
        message: string
      }

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.language).toBe('en')
      expect(body.message).toBe('Crawl triggered')
    })

    it('rejects invalid language', async () => {
      const res = await app.request(
        '/api/v1/crawler/xx/crawl',
        { method: 'POST' },
        createMockEnv()
      )
      const body = (await res.json()) as { success: boolean }

      expect(res.status).toBe(400)
      expect(body.success).toBe(false)
    })
  })
})
