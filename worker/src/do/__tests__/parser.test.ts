import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseScpIndexPage, SERIES_PAGES, getWikiBaseUrl, buildClassMap, applyClassMap, cleanEntryHtml } from '../parser'
import { fetchPageLikeBrowser } from '../http-client'
import type { CrawlEntry } from '../../types'

// Mock the http-client module used by buildClassMap
vi.mock('../http-client', () => ({
  fetchPageLikeBrowser: vi.fn(),
  humanDelay: vi.fn(() => 0),
}))

describe('parseScpIndexPage', () => {
  const baseUrl = 'https://scp-wiki.wikidot.com'

  it('parses entries from actual wiki index format', () => {
    // This matches the actual SCP wiki index HTML:
    // <a href="/scp-002">SCP-002</a> - The &quot;Living&quot; Room
    const html = `
      <div id="page-content">
        <p><a href="/scp-002">SCP-002</a> - The &quot;Living&quot; Room</p>
        <p><a href="/scp-173">SCP-173</a> - The Sculpture</p>
        <p><a href="/scp-999">SCP-999</a> - The &quot;Tickle Monster&quot;</p>
      </div>
    `
    const result = parseScpIndexPage(html, { baseUrl, language: 'en' })

    expect(result.entries).toHaveLength(3)
    expect(result.errors).toHaveLength(0)

    expect(result.entries[0].scpNumber).toBe(2)
    expect(result.entries[0].name).toBe('The "Living" Room')
    expect(result.entries[0].url).toBe('https://scp-wiki.wikidot.com/scp-002')
    expect(result.entries[0].series).toBe(1)

    expect(result.entries[1].scpNumber).toBe(173)
    expect(result.entries[1].name).toBe('The Sculpture')

    expect(result.entries[2].scpNumber).toBe(999)
    expect(result.entries[2].name).toBe('The "Tickle Monster"')
  })

  it('extracts names from text after the link', () => {
    const html = `<p><a href="/scp-173">SCP-173</a> - The Sculpture</p>`
    const result = parseScpIndexPage(html, { baseUrl, language: 'en' })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].name).toBe('The Sculpture')
  })

  it('handles HTML entities in names', () => {
    const html = `<p><a href="/scp-002">SCP-002</a> - The &quot;Living&quot; Room</p>`
    const result = parseScpIndexPage(html, { baseUrl, language: 'en' })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].name).toBe('The "Living" Room')
  })

  it('handles names with special characters', () => {
    const html = `<p><a href="/scp-500">SCP-500</a> - A Pill That Fixes Everything &amp; More</p>`
    const result = parseScpIndexPage(html, { baseUrl, language: 'en' })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].name).toBe('A Pill That Fixes Everything & More')
  })

  it('handles link text with name inside', () => {
    const html = `<p><a href="/scp-173">SCP-173 - The Sculpture</a></p>`
    const result = parseScpIndexPage(html, { baseUrl, language: 'en' })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].name).toBe('The Sculpture')
  })

  it('extracts object class when present (individual page format)', () => {
    const html = `
      <p><a href="/scp-173">SCP-173</a> - Object Class: Euclid</p>
    `
    const result = parseScpIndexPage(html, { baseUrl, language: 'en' })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].objectClass).toBe('Euclid')
  })

  it('handles object class in styled tags', () => {
    const html = `
      <p><a href="/scp-682">SCP-682</a> - Object Class: <span style="color:red">Keter</span></p>
    `
    const result = parseScpIndexPage(html, { baseUrl, language: 'en' })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].objectClass).toBe('Keter')
  })

  it('marks class as Unknown when not present (index page format)', () => {
    const html = `<p><a href="/scp-173">SCP-173</a> - The Sculpture</p>`
    const result = parseScpIndexPage(html, { baseUrl, language: 'en' })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].objectClass).toBe('Unknown')
  })

  it('deduplicates entries by SCP number', () => {
    const html = `
      <p><a href="/scp-173">SCP-173</a> - The Sculpture</p>
      <p><a href="/scp-173">SCP-173</a> - The Sculpture (duplicate)</p>
    `
    const result = parseScpIndexPage(html, { baseUrl, language: 'en' })

    expect(result.entries).toHaveLength(1)
  })

  it('assigns correct series numbers', () => {
    const html = `
      <p><a href="/scp-1">SCP-1</a> - Entry 1</p>
      <p><a href="/scp-1000">SCP-1000</a> - Entry 1000</p>
      <p><a href="/scp-2000">SCP-2000</a> - Entry 2000</p>
      <p><a href="/scp-5000">SCP-5000</a> - Entry 5000</p>
    `
    const result = parseScpIndexPage(html, { baseUrl, language: 'en', seriesHint: 0 })

    expect(result.entries[0].series).toBe(1)
    expect(result.entries[1].series).toBe(2)
    expect(result.entries[2].series).toBe(3)
    expect(result.entries[3].series).toBe(6)
  })

  it('uses seriesHint when provided', () => {
    const html = `<p><a href="/scp-173">SCP-173</a> - The Sculpture</p>`
    const result = parseScpIndexPage(html, { baseUrl, language: 'en', seriesHint: 3 })

    expect(result.entries[0].series).toBe(3)
  })

  it('does not match CN "等级" pattern when language is EN', () => {
    const html = `<p><a href="/scp-173">SCP-173</a> - 等级: Euclid</p>`
    const result = parseScpIndexPage(html, { baseUrl, language: 'en' })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].objectClass).toBe('Unknown')
  })

  it('handles full URLs in href', () => {
    const html = `<p><a href="https://scp-wiki.wikidot.com/scp-173">SCP-173</a> - The Sculpture</p>`
    const result = parseScpIndexPage(html, { baseUrl, language: 'en' })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].url).toBe('https://scp-wiki.wikidot.com/scp-173')
  })

  it('handles SCP numbers with suffixes', () => {
    const html = `
      <p><a href="/scp-500-j">SCP-500-J</a> - Joke Version</p>
      <p><a href="/scp-001-ex">SCP-001-EX</a> - Explained</p>
    `
    const result = parseScpIndexPage(html, { baseUrl, language: 'en' })

    expect(result.entries).toHaveLength(2)
    expect(result.entries[0].scpNumber).toBe(500)
    expect(result.entries[1].scpNumber).toBe(1)
  })

  it('returns empty array for HTML with no SCP links', () => {
    const html = '<div><p>No SCPs here</p></div>'
    const result = parseScpIndexPage(html, { baseUrl, language: 'en' })

    expect(result.entries).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })

  it('builds correct URLs for Chinese wiki', () => {
    const html = `<p><a href="/scp-173">SCP-173</a> - 雕塑</p>`
    const result = parseScpIndexPage(html, {
      baseUrl: 'https://scp-wiki-cn.wikidot.com',
      language: 'cn',
    })

    expect(result.entries[0].url).toBe('https://scp-wiki-cn.wikidot.com/scp-173')
  })

  it('handles a realistic page with many entries', () => {
    const entries = Array.from({ length: 100 }, (_, i) => {
      const num = String(i + 1).padStart(3, '0')
      return `<p><a href="/scp-${num}">SCP-${num}</a> - Entry ${i + 1}</p>`
    }).join('\n')

    const html = `<div id="page-content">${entries}</div>`
    const result = parseScpIndexPage(html, { baseUrl, language: 'en', seriesHint: 1 })

    expect(result.entries).toHaveLength(100)
    expect(result.entries.every((e) => e.series === 1)).toBe(true)
    expect(result.entries[0].name).toBe('Entry 1')
    expect(result.entries[99].name).toBe('Entry 100')
  })
})

describe('parseScpIndexPage — CN configuration', () => {
  const cnBaseUrl = 'https://scp-wiki-cn.wikidot.com'

  it('parses CN entries with "等级" class marker', () => {
    const html = `
      <p><a href="/scp-173">SCP-173</a> - 等级: Euclid</p>
      <p><a href="/scp-682">SCP-682</a> - 等级: Keter</p>
    `
    const result = parseScpIndexPage(html, { baseUrl: cnBaseUrl, language: 'cn' })

    expect(result.entries).toHaveLength(2)
    expect(result.entries[0].objectClass).toBe('Euclid')
    expect(result.entries[1].objectClass).toBe('Keter')
  })

  it('handles CN full-width colon "等级："', () => {
    const html = `<p><a href="/scp-173">SCP-173</a> - 等级：Euclid</p>`
    const result = parseScpIndexPage(html, { baseUrl: cnBaseUrl, language: 'cn' })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].objectClass).toBe('Euclid')
  })

  it('normalizes Chinese class names to English', () => {
    const html = `
      <p><a href="/scp-1">SCP-1</a> - 等级: 已解除</p>
      <p><a href="/scp-2">SCP-2</a> - 等级: 无效化</p>
      <p><a href="/scp-3">SCP-3</a> - 等级: 未收容</p>
      <p><a href="/scp-4">SCP-4</a> - 等级: 待分级</p>
      <p><a href="/scp-5">SCP-5</a> - 等级: 已解释</p>
    `
    const result = parseScpIndexPage(html, { baseUrl: cnBaseUrl, language: 'cn' })

    expect(result.entries).toHaveLength(5)
    expect(result.entries[0].objectClass).toBe('Neutralized')
    expect(result.entries[1].objectClass).toBe('Neutralized')
    expect(result.entries[2].objectClass).toBe('Uncontained')
    expect(result.entries[3].objectClass).toBe('Pending')
    expect(result.entries[4].objectClass).toBe('Explained')
  })

  it('does not match EN "Object Class" pattern when language is CN', () => {
    const html = `<p><a href="/scp-173">SCP-173</a> - Object Class: Euclid</p>`
    const result = parseScpIndexPage(html, { baseUrl: cnBaseUrl, language: 'cn' })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].objectClass).toBe('Unknown')
  })

  it('extracts names from CN link text', () => {
    const html = `<p><a href="/scp-173">SCP-173 - 雕塑</a></p>`
    const result = parseScpIndexPage(html, { baseUrl: cnBaseUrl, language: 'cn' })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].name).toBe('雕塑')
  })

  it('extracts names from text after CN link', () => {
    const html = `<p><a href="/scp-173">SCP-173</a> - 雕塑</p>`
    const result = parseScpIndexPage(html, { baseUrl: cnBaseUrl, language: 'cn' })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].name).toBe('雕塑')
  })

  it('marks class as Unknown when not present on CN index', () => {
    const html = `<p><a href="/scp-173">SCP-173</a> - 雕塑</p>`
    const result = parseScpIndexPage(html, { baseUrl: cnBaseUrl, language: 'cn' })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].objectClass).toBe('Unknown')
  })

  it('builds correct URLs for CN wiki', () => {
    const html = `<p><a href="/scp-173">SCP-173</a> - 雕塑</p>`
    const result = parseScpIndexPage(html, { baseUrl: cnBaseUrl, language: 'cn' })

    expect(result.entries[0].url).toBe('https://scp-wiki-cn.wikidot.com/scp-173')
  })

  it('handles a realistic CN page with many entries', () => {
    const entries = Array.from({ length: 50 }, (_, i) => {
      const num = String(i + 1).padStart(3, '0')
      return `<p><a href="/scp-${num}">SCP-${num}</a> - 条目 ${i + 1}</p>`
    }).join('\n')

    const html = `<div id="page-content">${entries}</div>`
    const result = parseScpIndexPage(html, { baseUrl: cnBaseUrl, language: 'cn', seriesHint: 1 })

    expect(result.entries).toHaveLength(50)
    expect(result.entries.every((e) => e.series === 1)).toBe(true)
    expect(result.entries[0].name).toBe('条目 1')
  })
})

describe('SERIES_PAGES', () => {
  it('has 8 series pages', () => {
    expect(SERIES_PAGES).toHaveLength(8)
  })

  it('starts with scp-series', () => {
    expect(SERIES_PAGES[0]).toBe('scp-series')
  })

  it('ends with scp-series-8', () => {
    expect(SERIES_PAGES[7]).toBe('scp-series-8')
  })
})

describe('getWikiBaseUrl', () => {
  it('returns English wiki URL for en', () => {
    expect(getWikiBaseUrl('en')).toBe('https://scp-wiki.wikidot.com')
  })

  it('returns Chinese wiki URL for cn', () => {
    expect(getWikiBaseUrl('cn')).toBe('https://scp-wiki-cn.wikidot.com')
  })
})

// ─── buildClassMap ──────────────────────────────────────────

describe('buildClassMap', () => {
  const mockedFetch = vi.mocked(fetchPageLikeBrowser)

  beforeEach(() => {
    mockedFetch.mockReset()
  })

  function tagPageHtml(scps: number[], classTag: string): string {
    const links = scps
      .map((n) => `<a href="/scp-${String(n).padStart(3, '0')}">SCP-${String(n).padStart(3, '0')}</a>`)
      .join(' ')
    return `<div class="pages-tag-cloud">${links}</div>`
  }

  it('builds map from single-page tag pages', async () => {
    mockedFetch
      .mockResolvedValueOnce({ ok: true, status: 200, html: tagPageHtml([173, 999], 'safe') })
      .mockResolvedValueOnce({ ok: true, status: 200, html: tagPageHtml([682], 'euclid') })
      .mockResolvedValueOnce({ ok: true, status: 200, html: tagPageHtml([2317], 'keter') })
      .mockResolvedValueOnce({ ok: true, status: 200, html: tagPageHtml([999], 'thaumiel') })
      .mockResolvedValueOnce({ ok: true, status: 200, html: tagPageHtml([], 'apollyon') })
      .mockResolvedValueOnce({ ok: true, status: 200, html: tagPageHtml([], 'neutralized') })

    const classMap = await buildClassMap({ language: 'en' })

    expect(classMap.get(173)).toBe('Safe')
    expect(classMap.get(999)).toBe('Safe')
    expect(classMap.get(682)).toBe('Euclid')
    expect(classMap.get(2317)).toBe('Keter')
    // 999 appears in both Safe and Thaumiel — first wins
    expect(classMap.get(999)).toBe('Safe')
  })

  it('handles pagination across multiple pages', async () => {
    // Safe class: 2 pages
    const page1Html = tagPageHtml([173, 999], 'safe') +
      '<div class="pager"><a href="/system:page-tags/tag/safe?p=2">2</a></div>'
    const page2Html = tagPageHtml([500, 458], 'safe')

    mockedFetch
      .mockResolvedValueOnce({ ok: true, status: 200, html: page1Html })
      .mockResolvedValueOnce({ ok: true, status: 200, html: page2Html })
      // Remaining classes return empty
      .mockResolvedValue({ ok: true, status: 200, html: tagPageHtml([], 'x') })

    const classMap = await buildClassMap({ language: 'en' })

    expect(classMap.get(173)).toBe('Safe')
    expect(classMap.get(500)).toBe('Safe')
    expect(classMap.get(458)).toBe('Safe')
  })

  it('skips failed class fetches without throwing', async () => {
    mockedFetch
      .mockResolvedValueOnce({ ok: false, status: 500, html: null, error: 'Server error' })
      .mockResolvedValueOnce({ ok: true, status: 200, html: tagPageHtml([682], 'euclid') })
      .mockResolvedValue({ ok: true, status: 200, html: tagPageHtml([], 'x') })

    const classMap = await buildClassMap({ language: 'en' })

    // Safe failed — no entries
    expect(classMap.get(173)).toBeUndefined()
    // Euclid succeeded
    expect(classMap.get(682)).toBe('Euclid')
  })

  it('uses CN base URL for Chinese language', async () => {
    mockedFetch.mockResolvedValue({ ok: true, status: 200, html: tagPageHtml([], 'x') })

    await buildClassMap({ language: 'cn' })

    // Verify the first call used the CN wiki URL
    const firstCallUrl = mockedFetch.mock.calls[0][0] as string
    expect(firstCallUrl).toContain('scp-wiki-cn.wikidot.com')
    expect(firstCallUrl).toContain('/system:page-tags/tag/safe')
  })

  it('returns empty map when all fetches fail', async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 500, html: null })

    const classMap = await buildClassMap({ language: 'en' })

    expect(classMap.size).toBe(0)
  })
})

// ─── applyClassMap ──────────────────────────────────────────

describe('applyClassMap', () => {
  function makeEntry(scpNumber: number, objectClass = 'Unknown'): CrawlEntry {
    return { scpNumber, name: `SCP-${scpNumber}`, objectClass, url: '', series: 1 }
  }

  it('fills in Unknown classes from the map', () => {
    const entries = [makeEntry(173), makeEntry(682), makeEntry(999)]
    const classMap = new Map<number, string>([
      [173, 'Euclid'],
      [682, 'Keter'],
    ])

    applyClassMap(entries, classMap)

    expect(entries[0].objectClass).toBe('Euclid')
    expect(entries[1].objectClass).toBe('Keter')
    expect(entries[2].objectClass).toBe('Unknown')
  })

  it('does not overwrite known classes', () => {
    const entries = [makeEntry(173, 'Safe')]
    const classMap = new Map<number, string>([[173, 'Euclid']])

    applyClassMap(entries, classMap)

    // Already had 'Safe' — should not be overwritten
    expect(entries[0].objectClass).toBe('Safe')
  })

  it('handles empty class map', () => {
    const entries = [makeEntry(173)]
    const classMap = new Map<number, string>()

    applyClassMap(entries, classMap)

    expect(entries[0].objectClass).toBe('Unknown')
  })

  it('handles empty entries array', () => {
    const entries: CrawlEntry[] = []
    const classMap = new Map<number, string>([[173, 'Euclid']])

    applyClassMap(entries, classMap)

    expect(entries).toHaveLength(0)
  })
})

// ─── cleanEntryHtml ─────────────────────────────────────────

describe('cleanEntryHtml', () => {
  const baseUrl = 'https://scp-wiki.wikidot.com'

  it('extracts content from #page-content div', () => {
    const html = `
      <html><body>
        <div id="header">Header</div>
        <div id="page-content">
          <p>SCP-173 - The Sculpture</p>
          <p>Object Class: Euclid</p>
        </div>
        <div id="footer">Footer</div>
      </body></html>
    `
    const result = cleanEntryHtml(html, baseUrl)

    expect(result).toContain('SCP-173 - The Sculpture')
    expect(result).toContain('Object Class: Euclid')
    expect(result).not.toContain('Header')
    expect(result).not.toContain('Footer')
    expect(result).toContain('class="scp-content"')
  })

  it('removes script tags', () => {
    const html = `<div id="page-content">
      <p>Content</p>
      <script>alert('xss')</script>
      <script type="text/javascript">var x = 1;</script>
    </div>`
    const result = cleanEntryHtml(html, baseUrl)

    expect(result).toContain('Content')
    expect(result).not.toContain('alert')
    expect(result).not.toContain('var x')
    expect(result).not.toContain('<script')
  })

  it('removes style tags', () => {
    const html = `<div id="page-content">
      <p>Content</p>
      <style>.foo { color: red; }</style>
    </div>`
    const result = cleanEntryHtml(html, baseUrl)

    expect(result).toContain('Content')
    expect(result).not.toContain('.foo')
    expect(result).not.toContain('<style')
  })

  it('removes noscript tags', () => {
    const html = `<div id="page-content">
      <p>Content</p>
      <noscript>JavaScript required</noscript>
    </div>`
    const result = cleanEntryHtml(html, baseUrl)

    expect(result).toContain('Content')
    expect(result).not.toContain('JavaScript required')
  })

  it('removes page-rate-widget-box elements', () => {
    const html = `<div id="page-content">
      <p>Content</p>
      <div class="page-rate-widget-box">
        <span class="rate-points">+123</span>
      </div>
    </div>`
    const result = cleanEntryHtml(html, baseUrl)

    expect(result).toContain('Content')
    expect(result).not.toContain('page-rate-widget-box')
    expect(result).not.toContain('+123')
  })

  it('removes edit-info elements', () => {
    const html = `<div id="page-content">
      <p>Content</p>
      <div class="edit-info">
        <a href="/edit">Edit</a>
      </div>
    </div>`
    const result = cleanEntryHtml(html, baseUrl)

    expect(result).toContain('Content')
    expect(result).not.toContain('edit-info')
    expect(result).not.toContain('Edit')
  })

  it('removes page-tags elements', () => {
    const html = `<div id="page-content">
      <p>Content</p>
      <div class="page-tags">
        <a href="/tag/euclid">euclid</a>
      </div>
    </div>`
    const result = cleanEntryHtml(html, baseUrl)

    expect(result).toContain('Content')
    expect(result).not.toContain('page-tags')
  })

  it('removes licensebox elements', () => {
    const html = `<div id="page-content">
      <p>Content</p>
      <div class="licensebox">CC BY-SA 3.0</div>
    </div>`
    const result = cleanEntryHtml(html, baseUrl)

    expect(result).toContain('Content')
    expect(result).not.toContain('licensebox')
    expect(result).not.toContain('CC BY-SA')
  })

  it('removes onclick and other event handler attributes', () => {
    const html = `<div id="page-content">
      <p onclick="alert('xss')">Content</p>
      <a href="/scp-173" onmouseover="doSomething()">Link</a>
    </div>`
    const result = cleanEntryHtml(html, baseUrl)

    expect(result).toContain('Content')
    expect(result).toContain('Link')
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('onmouseover')
    expect(result).not.toContain('alert')
    expect(result).not.toContain('doSomething')
  })

  it('removes style attributes', () => {
    const html = `<div id="page-content">
      <p style="color: red; font-size: 14px;">Content</p>
      <span style='background: blue;'>Styled</span>
    </div>`
    const result = cleanEntryHtml(html, baseUrl)

    expect(result).toContain('Content')
    expect(result).toContain('Styled')
    expect(result).not.toContain('style=')
    expect(result).not.toContain('color: red')
  })

  it('converts relative URLs to absolute', () => {
    const html = `<div id="page-content">
      <a href="/scp-999">SCP-999</a>
      <img src="/local--files/scp-173/image.jpg">
    </div>`
    const result = cleanEntryHtml(html, baseUrl)

    expect(result).toContain('href="https://scp-wiki.wikidot.com/scp-999"')
    expect(result).toContain('src="https://scp-wiki.wikidot.com/local--files/scp-173/image.jpg"')
  })

  it('does not modify already-absolute URLs', () => {
    const html = `<div id="page-content">
      <a href="https://example.com/page">External</a>
      <img src="https://example.com/image.jpg">
    </div>`
    const result = cleanEntryHtml(html, baseUrl)

    expect(result).toContain('href="https://example.com/page"')
    expect(result).toContain('src="https://example.com/image.jpg"')
  })

  it('wraps output in .scp-content container', () => {
    const html = `<div id="page-content"><p>Content</p></div>`
    const result = cleanEntryHtml(html, baseUrl)

    expect(result).toMatch(/^<div class="scp-content">/)
    expect(result).toMatch(/<\/div>$/)
  })

  it('handles Chinese wiki base URL', () => {
    const cnBaseUrl = 'https://scp-wiki-cn.wikidot.com'
    const html = `<div id="page-content">
      <a href="/scp-173">SCP-173</a>
    </div>`
    const result = cleanEntryHtml(html, cnBaseUrl)

    expect(result).toContain('href="https://scp-wiki-cn.wikidot.com/scp-173"')
  })

  it('falls back to body content when no #page-content found', () => {
    const html = `<html><body>
      <p>Fallback content</p>
    </body></html>`
    const result = cleanEntryHtml(html, baseUrl)

    expect(result).toContain('Fallback content')
    expect(result).toContain('class="scp-content"')
  })

  it('preserves nested div structure inside page-content', () => {
    const html = `<div id="page-content">
      <div class="collapsible-block">
        <div class="collapsible-block-folded">
          <a href="javascript:;">Show</a>
        </div>
        <div class="collapsible-block-unfolded">
          <p>Hidden content</p>
        </div>
      </div>
    </div>`
    const result = cleanEntryHtml(html, baseUrl)

    expect(result).toContain('collapsible-block')
    expect(result).toContain('Hidden content')
  })

  it('handles a realistic SCP entry page', () => {
    const html = `<!DOCTYPE html>
<html>
<head><title>SCP-173 - SCP Foundation</title></head>
<body>
  <div id="header">...</div>
  <div id="page-content">
    <div style="text-align: center;">
      <h1 id="toc0">SCP-173</h1>
    </div>
    <div class="scp-image-block" style="width:300px;">
      <img src="/local--files/scp-173/Image.png" style="width:300px;">
      <div class="scp-image-caption">SCP-173</div>
    </div>
    <p><strong>Item #:</strong> SCP-173</p>
    <p><strong>Object Class:</strong> Euclid</p>
    <hr>
    <h2 id="toc1">Special Containment Procedures</h2>
    <p>Item SCP-173 is to be kept in a locked container at all times.</p>
    <h2 id="toc2">Description</h2>
    <p>SCP-173 is a concrete sculpture of unknown origin.</p>
    <div class="page-rate-widget-box">
      <span>+4200</span>
    </div>
    <div class="page-tags">
      <a href="/tag/euclid">euclid</a>
      <a href="/tag/sculpture">sculpture</a>
    </div>
  </div>
  <div id="footer">...</div>
  <script>var wikidot = {};</script>
</body>
</html>`

    const result = cleanEntryHtml(html, baseUrl)

    // Content preserved
    expect(result).toContain('SCP-173')
    expect(result).toContain('Special Containment Procedures')
    expect(result).toContain('concrete sculpture')
    expect(result).toContain('Euclid')

    // Non-content removed
    expect(result).not.toContain('page-rate-widget-box')
    expect(result).not.toContain('+4200')
    expect(result).not.toContain('page-tags')
    expect(result).not.toContain('wikidot = {}')
    expect(result).not.toContain('style=')
    expect(result).not.toContain('Header')
    expect(result).not.toContain('Footer')

    // Wrapped in container
    expect(result).toContain('class="scp-content"')
  })
})
