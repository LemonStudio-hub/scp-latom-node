import { Hono } from 'hono'
import type { Env } from '../types'

const crawler = new Hono<{ Bindings: Env }>()

// ─── Helpers ────────────────────────────────────────────────

/**
 * Get the Durable Object namespace for a given language.
 */
function getDoNamespace(env: Env, lang: string): DurableObjectNamespace | null {
  if (lang === 'en') return env.SCP_EN_CRAWLER
  if (lang === 'cn') return env.SCP_CN_CRAWLER
  return null
}

/**
 * Get or create a Durable Object instance for a language.
 * Uses a fixed ID so there's exactly one DO per language.
 */
function getDoStub(env: Env, lang: string): DurableObjectStub | null {
  const ns = getDoNamespace(env, lang)
  if (!ns) return null
  const id = ns.idFromName(`scp-${lang}-crawler`)
  return ns.get(id)
}

/**
 * Forward a request to the appropriate Durable Object.
 */
async function forwardToDo(
  env: Env,
  lang: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const stub = getDoStub(env, lang)
  if (!stub) {
    return Response.json(
      { success: false, error: "Invalid language. Use 'en' or 'cn'" },
      { status: 400 }
    )
  }
  const doUrl = `https://do.scp/${lang}${path}`
  return stub.fetch(doUrl, init)
}

// ─── Routes ─────────────────────────────────────────────────

/**
 * GET /api/crawler/status
 * Get crawl status for both languages.
 */
crawler.get('/status', async (c) => {
  try {
    const [enRes, cnRes] = await Promise.all([
      forwardToDo(c.env, 'en', '/status'),
      forwardToDo(c.env, 'cn', '/status'),
    ])

    const enData = await enRes.json<{ success: boolean; state: unknown }>()
    const cnData = await cnRes.json<{ success: boolean; state: unknown }>()

    return c.json({
      success: true,
      en: enData.state,
      cn: cnData.state,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: `Failed to fetch status: ${message}` }, 500)
  }
})

/**
 * GET /api/crawler/:lang/status
 * Get crawl status for a specific language.
 */
crawler.get('/:lang/status', async (c) => {
  const lang = c.req.param('lang')
  if (lang !== 'en' && lang !== 'cn') {
    return c.json({ success: false, error: "Invalid language. Use 'en' or 'cn'" }, 400)
  }

  try {
    const response = await forwardToDo(c.env, lang, '/status')
    const data = await response.json()
    return c.json(data, response.status as 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: `Failed to fetch status: ${message}` }, 503)
  }
})

/**
 * GET /api/crawler/:lang/entries
 * Get crawled entries with optional filtering and pagination.
 *
 * Query parameters:
 *   - class: Filter by object class (Safe, Euclid, Keter, etc.)
 *   - q: Search by SCP number or name
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 50, max: 200)
 */
crawler.get('/:lang/entries', async (c) => {
  const lang = c.req.param('lang')
  if (lang !== 'en' && lang !== 'cn') {
    return c.json({ success: false, error: "Invalid language. Use 'en' or 'cn'" }, 400)
  }

  // Forward query params
  const url = new URL(c.req.url)
  const searchParams = url.searchParams.toString()
  const path = `/entries${searchParams ? `?${searchParams}` : ''}`

  try {
    const response = await forwardToDo(c.env, lang, path)
    const data = await response.json()
    return c.json(data, response.status as 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: `Failed to fetch entries: ${message}` }, 503)
  }
})

/**
 * GET /api/crawler/:lang/series/:n
 * Get entries for a specific series (1-8).
 */
crawler.get('/:lang/series/:n', async (c) => {
  const lang = c.req.param('lang')
  if (lang !== 'en' && lang !== 'cn') {
    return c.json({ success: false, error: "Invalid language. Use 'en' or 'cn'" }, 400)
  }

  const seriesNum = parseInt(c.req.param('n'), 10)
  if (isNaN(seriesNum) || seriesNum < 1 || seriesNum > 8) {
    return c.json({ success: false, error: 'Invalid series number. Valid range: 1-8' }, 400)
  }

  try {
    const response = await forwardToDo(c.env, lang, `/series/${seriesNum}`)
    const data = await response.json()
    return c.json(data, response.status as 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: `Failed to fetch series: ${message}` }, 503)
  }
})

/**
 * GET /api/crawler/:lang/entry/:scpNumber
 * Get cleaned HTML content for a specific SCP entry.
 *
 * If content is already cached in D1, returns it immediately.
 * If not, triggers a background fetch and returns a pending status.
 * The client should poll until status is 'cached' or 'fetched'.
 */
crawler.get('/:lang/entry/:scpNumber', async (c) => {
  const lang = c.req.param('lang')
  if (lang !== 'en' && lang !== 'cn') {
    return c.json({ success: false, error: "Invalid language. Use 'en' or 'cn'" }, 400)
  }

  const scpNumber = parseInt(c.req.param('scpNumber'), 10)
  if (isNaN(scpNumber) || scpNumber < 1) {
    return c.json({ success: false, error: 'Invalid SCP number' }, 400)
  }

  try {
    const response = await forwardToDo(c.env, lang, `/entry/${scpNumber}`)
    const data = await response.json()
    return c.json(data, response.status as 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: `Failed to fetch entry content: ${message}` }, 503)
  }
})

/**
 * POST /api/crawler/:lang/crawl
 * Trigger a new crawl for a specific language.
 *
 * Query parameters:
 *   - limit: Max entries to collect (0 or omit = unlimited)
 */
crawler.post('/:lang/crawl', async (c) => {
  const lang = c.req.param('lang')
  if (lang !== 'en' && lang !== 'cn') {
    return c.json({ success: false, error: "Invalid language. Use 'en' or 'cn'" }, 400)
  }

  // Forward query params (e.g., ?limit=30) to the DO
  const url = new URL(c.req.url)
  const searchParams = url.searchParams.toString()
  const path = `/crawl${searchParams ? `?${searchParams}` : ''}`

  try {
    const response = await forwardToDo(c.env, lang, path, { method: 'POST' })
    const data = await response.json()
    return c.json(data, response.status as 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: `Failed to trigger crawl: ${message}` }, 503)
  }
})

export default crawler
