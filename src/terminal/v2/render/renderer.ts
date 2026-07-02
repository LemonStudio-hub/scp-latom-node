/**
 * Terminal renderer built on @xterm/headless + a DOM painter.
 *
 * Architecture:
 *  - A headless xterm Terminal instance runs VT emulation (ANSI SGR,
 *    cursor movement, scrollback buffer). Callers write output into it
 *    via `write(text)`; the renderer reads rows back and paints them
 *    as DOM elements.
 *  - Each row is a `<div>` line; within a line, consecutive cells that
 *    share the same foreground color are grouped into a `<span>` with
 *    an inline color style. Default-color cells get no span (inherit
 *    from the container), keeping the DOM small.
 *  - Writes are asynchronous in xterm (the buffer updates in a
 *    callback). We schedule a repaint via `requestAnimationFrame`
 *    after each write callback so the DOM stays in sync without
 *    blocking the caller.
 *  - `fit()` measures the container width against the monospace cell
 *    width and resizes the xterm cols/rows accordingly, then repaints.
 */

import { Terminal } from '@xterm/headless'
import type { IBufferCell } from '@xterm/headless'
import type { ThemeMode } from '../types'
import { darkTheme, lightTheme, paletteColors, type TerminalTheme } from './theme'

export interface RendererOptions {
  container: HTMLElement
  theme: ThemeMode
  /** Font family for the output area (should be monospace). */
  fontFamily?: string
  /** Font size in pixels. */
  fontSize?: number
  /** Line height multiplier. */
  lineHeight?: number
  /** Scrollback buffer size. */
  scrollback?: number
}

export interface TerminalRenderer {
  /** Write text (may contain ANSI escapes) into the VT core and repaint. */
  write(text: string): void
  /** Clear the scrollback and repaint. */
  clear(): void
  /** Switch color theme at runtime. */
  setTheme(mode: ThemeMode): void
  /** Recompute cols/rows from the container size and repaint. */
  fit(): void
  /** Scroll the viewport by n lines (negative = up toward older output). */
  scrollLines(n: number): void
  /** Scroll the viewport by n pages. */
  scrollPages(n: number): void
  /** Scroll the viewport to the very top of the scrollback. */
  scrollToTop(): void
  /** Scroll the viewport to the bottom (newest output). */
  scrollToBottom(): void
  /** Whether the viewport is currently pinned to the bottom. */
  isAtBottom(): boolean
  /** The active theme object. */
  readonly theme: TerminalTheme
  /** The output DOM element (for scrolling). */
  readonly outputElement: HTMLElement
  /** Release xterm + DOM listeners. */
  dispose(): void
}

// xterm color mode constants
const COLOR_MODE_DEFAULT = 0
const COLOR_MODE_PALETTE = 16777216
const COLOR_MODE_RGB = 33554432

// Default terminal dimensions (used until fit() is called)
const DEFAULT_COLS = 80
const DEFAULT_ROWS = 24

export function createRenderer(options: RendererOptions): TerminalRenderer {
  const {
    container,
    fontFamily = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    fontSize = 14,
    lineHeight = 1.5,
    scrollback = 5000,
  } = options

  let currentTheme: TerminalTheme = options.theme === 'dark' ? darkTheme() : lightTheme()

  // ── Output DOM ──
  const output = document.createElement('div')
  output.className = 'scp-term-output'
  output.style.cssText = `
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
    line-height: ${lineHeight};
    color: ${currentTheme.foreground};
    background: ${currentTheme.background};
    white-space: pre;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    padding: 4px 8px;
    margin: 0;
    border: 0;
    width: 100%;
    height: 100%;
    tab-size: 4;
    -webkit-font-smoothing: antialiased;
    user-select: text;
    cursor: text;
  `
  container.appendChild(output)

  // ── Custom scrollbar overlay (themed, draggable) ──
  // Inject scrollbar styles once. Thumb color is driven by CSS variables
  // so we can recolor on theme switch without re-injecting.
  if (!document.getElementById('scp-term-scrollbar-style')) {
    const style = document.createElement('style')
    style.id = 'scp-term-scrollbar-style'
    style.textContent = `
      .scp-term-scrollbar {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 28px;
        width: 10px;
        z-index: 4;
        background: transparent;
        transition: background 150ms ease;
      }
      .scp-term-scrollbar:hover {
        background: rgba(127, 127, 127, 0.08);
      }
      .scp-term-thumb {
        position: absolute;
        right: 2px;
        width: 6px;
        border-radius: 3px;
        background: var(--scp-term-thumb-color, rgba(127,127,127,0.25));
        transition: background 150ms ease, width 150ms ease, right 150ms ease;
      }
      .scp-term-scrollbar:hover .scp-term-thumb {
        background: var(--scp-term-thumb-color-hover, rgba(127,127,127,0.45));
        width: 8px;
        right: 1px;
      }
      .scp-term-thumb.dragging {
        background: var(--scp-term-thumb-color-hover, rgba(127,127,127,0.55)) !important;
        width: 8px !important;
        right: 1px !important;
      }
    `
    document.head.appendChild(style)
  }

  const scrollbar = document.createElement('div')
  scrollbar.className = 'scp-term-scrollbar'
  scrollbar.style.display = 'none'
  const thumb = document.createElement('div')
  thumb.className = 'scp-term-thumb'
  scrollbar.appendChild(thumb)
  container.appendChild(scrollbar)

  /** Apply current theme colors to the scrollbar thumb (via CSS vars). */
  function applyScrollbarTheme(): void {
    const fg = currentTheme.foreground
    scrollbar.style.setProperty('--scp-term-thumb-color', `${fg}40`)
    scrollbar.style.setProperty('--scp-term-thumb-color-hover', `${fg}80`)
  }
  applyScrollbarTheme()

  // ── Headless VT core ──
  const term = new Terminal({
    cols: DEFAULT_COLS,
    rows: DEFAULT_ROWS,
    allowProposedApi: true,
    convertEol: true,
    scrollback,
  })

  let disposed = false
  let paintScheduled = false

  /** Read a cell's foreground color as a CSS string, or '' for default. */
  function cellFgColor(cell: IBufferCell): string {
    const mode = cell.getFgColorMode()
    if (mode === COLOR_MODE_DEFAULT) return ''
    if (mode === COLOR_MODE_PALETTE) {
      const idx = cell.getFgColor()
      if (idx < 0 || idx >= 16) return ''
      const palette = paletteColors(currentTheme)
      return palette[idx]
    }
    if (mode === COLOR_MODE_RGB) {
      const color = cell.getFgColor()
      // RGB is packed as (r << 16) | (g << 8) | b
      const r = (color >> 16) & 0xff
      const g = (color >> 8) & 0xff
      const b = color & 0xff
      return `rgb(${r},${g},${b})`
    }
    return ''
  }

  /** Read a cell's background color as a CSS string, or '' for default. */
  function cellBgColor(cell: IBufferCell): string {
    const mode = cell.getBgColorMode()
    if (mode === COLOR_MODE_DEFAULT) return ''
    if (mode === COLOR_MODE_PALETTE) {
      const idx = cell.getBgColor()
      if (idx < 0 || idx >= 16) return ''
      const palette = paletteColors(currentTheme)
      return palette[idx]
    }
    if (mode === COLOR_MODE_RGB) {
      const color = cell.getBgColor()
      const r = (color >> 16) & 0xff
      const g = (color >> 8) & 0xff
      const b = color & 0xff
      return `rgb(${r},${g},${b})`
    }
    return ''
  }

  /** Build a single line element from buffer cells. */
  function buildLineElement(line: {
    getCell(i: number): IBufferCell | undefined
    length: number
  }): HTMLDivElement {
    const div = document.createElement('div')
    div.className = 'scp-term-line'
    div.style.minHeight = `${fontSize * lineHeight}px`

    let currentText = ''
    let currentFg = ''
    let currentBg = ''
    let currentBold = false

    function flushSpan() {
      if (currentText === '') return
      if (currentFg === '' && currentBg === '' && !currentBold) {
        // Default styling — append as text node
        div.appendChild(document.createTextNode(currentText))
      } else {
        const span = document.createElement('span')
        if (currentFg) span.style.color = currentFg
        if (currentBg) span.style.backgroundColor = currentBg
        if (currentBold) span.style.fontWeight = 'bold'
        span.textContent = currentText
        div.appendChild(span)
      }
      currentText = ''
    }

    for (let i = 0; i < line.length; i++) {
      const cell = line.getCell(i)
      if (!cell) continue
      const chars = cell.getChars() || ' '
      const fg = cellFgColor(cell)
      const bg = cellBgColor(cell)
      const bold = (cell.isBold() as number) > 0

      // Group consecutive cells with the same styling
      if (fg !== currentFg || bg !== currentBg || bold !== currentBold) {
        flushSpan()
        currentFg = fg
        currentBg = bg
        currentBold = bold
      }
      currentText += chars
    }
    flushSpan()

    // Empty line needs a non-breaking space to have height
    if (div.childNodes.length === 0) {
      div.innerHTML = '&nbsp;'
    }

    return div
  }

  /** Read the xterm buffer and rebuild the output DOM. */
  function repaint() {
    paintScheduled = false
    if (disposed) return

    const buf = term.buffer.active
    // viewportY is the actual top of the viewport (changes when the user
    // scrolls up); baseY is only the bottom anchor and never moves on scroll.
    const viewportStart = buf.viewportY
    const viewportEnd = viewportStart + term.rows

    // Use a DocumentFragment to batch DOM writes
    const frag = document.createDocumentFragment()
    for (let i = viewportStart; i < viewportEnd; i++) {
      const line = buf.getLine(i)
      if (!line) continue
      frag.appendChild(buildLineElement(line))
    }

    output.replaceChildren(frag)

    updateScrollbar()
  }

  /** Schedule a repaint on the next animation frame (deduped). */
  function scheduleRepaint() {
    if (paintScheduled || disposed) return
    paintScheduled = true
    requestAnimationFrame(repaint)
  }

  // ── Custom scrollbar logic ──

  /** Recompute thumb geometry from the current viewport position. */
  function updateScrollbar(): void {
    if (disposed) return
    const buf = term.buffer.active
    const total = buf.length
    const visible = term.rows
    if (total <= visible) {
      scrollbar.style.display = 'none'
      return
    }
    scrollbar.style.display = 'block'
    const trackH = scrollbar.clientHeight
    const maxTop = total - visible
    const thumbH = Math.max(20, Math.round((visible / total) * trackH))
    const travel = trackH - thumbH
    const vy = buf.viewportY
    const thumbTop = maxTop > 0 ? Math.round((vy / maxTop) * travel) : 0
    thumb.style.height = `${thumbH}px`
    thumb.style.top = `${Math.max(0, Math.min(thumbTop, travel))}px`
  }

  // ── Scroll handling ──

  /** Wheel handler: translate vertical wheel motion into buffer scroll. */
  function onWheel(ev: WheelEvent): void {
    if (disposed) return
    const buf = term.buffer.active
    // Nothing to scroll through — let the event bubble to the page.
    if (buf.length <= term.rows) return
    ev.preventDefault()
    // Normalize wheel delta into a line count. Most mice/touchpads emit
    // deltaY in pixels (~100 per notch); line-mode devices emit ~1.
    const step = Math.max(1, Math.round(Math.abs(ev.deltaY) / 24))
    // Wheel down (deltaY > 0) → scroll toward newer content (positive).
    term.scrollLines(Math.sign(ev.deltaY) * step)
    scheduleRepaint()
  }
  // Listen on the container so wheel over the output, scrollbar, or input
  // line all scroll the buffer.
  container.addEventListener('wheel', onWheel, { passive: false })

  // Drag the thumb to jump through the scrollback.
  let dragging = false
  let dragStartClientY = 0
  let dragStartTop = 0

  thumb.addEventListener('pointerdown', (e) => {
    const buf = term.buffer.active
    if (buf.length <= term.rows) return
    e.preventDefault()
    e.stopPropagation()
    dragging = true
    dragStartClientY = e.clientY
    dragStartTop = parseFloat(thumb.style.top) || 0
    thumb.classList.add('dragging')
    try {
      thumb.setPointerCapture(e.pointerId)
    } catch {
      // ignore — capture is best-effort
    }
  })

  thumb.addEventListener('pointermove', (e) => {
    if (!dragging) return
    const buf = term.buffer.active
    const maxTop = buf.length - term.rows
    if (maxTop <= 0) return
    const trackH = scrollbar.clientHeight
    const thumbH = parseFloat(thumb.style.height) || 20
    const travel = trackH - thumbH
    if (travel <= 0) return
    const dy = e.clientY - dragStartClientY
    const newTop = Math.max(0, Math.min(dragStartTop + dy, travel))
    const ratio = newTop / travel
    const targetVy = Math.round(ratio * maxTop)
    term.scrollLines(targetVy - buf.viewportY)
    thumb.style.top = `${newTop}px`
    scheduleRepaint()
  })

  function endDrag(e: PointerEvent): void {
    if (!dragging) return
    dragging = false
    thumb.classList.remove('dragging')
    try {
      thumb.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }
  thumb.addEventListener('pointerup', endDrag)
  thumb.addEventListener('pointercancel', endDrag)

  // Click on the track (not the thumb) → page toward the click position.
  scrollbar.addEventListener('pointerdown', (e) => {
    if (e.target === thumb) return
    const buf = term.buffer.active
    if (buf.length <= term.rows) return
    const thumbH = parseFloat(thumb.style.height) || 20
    const thumbTop = parseFloat(thumb.style.top) || 0
    if (e.offsetY < thumbTop) {
      term.scrollPages(-1)
    } else if (e.offsetY > thumbTop + thumbH) {
      term.scrollPages(1)
    }
    scheduleRepaint()
  })

  // ── Public API ──

  function write(text: string): void {
    if (disposed) return
    term.write(text, () => scheduleRepaint())
  }

  function clear(): void {
    if (disposed) return
    term.clear()
    scheduleRepaint()
  }

  function setTheme(mode: ThemeMode): void {
    currentTheme = mode === 'dark' ? darkTheme() : lightTheme()
    output.style.color = currentTheme.foreground
    output.style.background = currentTheme.background
    applyScrollbarTheme()
    scheduleRepaint()
  }

  /** Measure a monospace cell width using a hidden test element. */
  function measureCellWidth(): number {
    const test = document.createElement('span')
    test.style.cssText = `
      font-family: ${fontFamily};
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      position: absolute;
      visibility: hidden;
      white-space: pre;
    `
    test.textContent = 'M'.repeat(50)
    document.body.appendChild(test)
    const width = test.getBoundingClientRect().width / 50
    document.body.removeChild(test)
    return width || fontSize * 0.6 // fallback for monospace
  }

  function fit(): void {
    if (disposed) return
    const rect = output.getBoundingClientRect()
    // Guard against zero-sized containers (e.g. detached DOM in tests)
    if (rect.width === 0 || rect.height === 0) return
    const cellWidth = measureCellWidth()
    const cellHeight = fontSize * lineHeight
    const cols = Math.max(1, Math.floor((rect.width - 16) / cellWidth))
    const rows = Math.max(1, Math.floor(rect.height / cellHeight))
    term.resize(cols, rows)
    scheduleRepaint()
  }

  function scrollLines(n: number): void {
    if (disposed) return
    term.scrollLines(n)
    scheduleRepaint()
  }

  function scrollPages(n: number): void {
    if (disposed) return
    term.scrollPages(n)
    scheduleRepaint()
  }

  function scrollToTop(): void {
    if (disposed) return
    term.scrollToTop()
    scheduleRepaint()
  }

  function scrollToBottom(): void {
    if (disposed) return
    term.scrollToBottom()
    scheduleRepaint()
  }

  function isAtBottom(): boolean {
    if (disposed) return true
    const buf = term.buffer.active
    return buf.viewportY + term.rows >= buf.length
  }

  function dispose(): void {
    if (disposed) return
    disposed = true
    container.removeEventListener('wheel', onWheel)
    thumb.removeEventListener('pointerup', endDrag)
    thumb.removeEventListener('pointercancel', endDrag)
    term.dispose()
    output.remove()
    scrollbar.remove()
  }

  return {
    write,
    clear,
    setTheme,
    fit,
    scrollLines,
    scrollPages,
    scrollToTop,
    scrollToBottom,
    isAtBottom,
    dispose,
    get theme() {
      return currentTheme
    },
    get outputElement() {
      return output
    },
  }
}
