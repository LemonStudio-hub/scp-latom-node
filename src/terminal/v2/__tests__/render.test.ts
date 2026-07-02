/**
 * Render layer tests.
 *
 * theme.ts and input.ts are pure logic and fully testable.
 * renderer.ts and lifecycle.ts require a real DOM (happy-dom provides
 * one), so we test them with integration-style assertions.
 */

import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import {
  darkTheme,
  lightTheme,
  themeFor,
  paletteColors,
  createInputController,
  type InputController,
} from '../render'
import { createShellState } from '../shell/state'

/** Wait for xterm async write + rAF repaint to complete. */
async function waitForRepaint(ms = 50): Promise<void> {
  await new Promise((r) => setTimeout(r, ms))
  await new Promise((r) => requestAnimationFrame(() => r(null)))
  await nextTick()
}

// ── theme.ts ──

describe('theme', () => {
  it('darkTheme has 16 palette colors + background/foreground/cursor', () => {
    const t = darkTheme()
    expect(t.background).toMatch(/^#/)
    expect(t.foreground).toMatch(/^#/)
    expect(t.cursor).toMatch(/^#/)
    for (const key of [
      'black',
      'red',
      'green',
      'yellow',
      'blue',
      'magenta',
      'cyan',
      'white',
    ] as const) {
      expect(t[key]).toMatch(/^#/)
    }
  })

  it('lightTheme differs from darkTheme', () => {
    expect(lightTheme().background).not.toBe(darkTheme().background)
    expect(lightTheme().foreground).not.toBe(darkTheme().foreground)
  })

  it('themeFor returns the right theme', () => {
    expect(themeFor('dark')).toEqual(darkTheme())
    expect(themeFor('light')).toEqual(lightTheme())
  })

  it('paletteColors returns 16 colors in order', () => {
    const colors = paletteColors(darkTheme())
    expect(colors).toHaveLength(16)
    expect(colors[0]).toBe(darkTheme().black)
    expect(colors[1]).toBe(darkTheme().red)
    expect(colors[2]).toBe(darkTheme().green)
    expect(colors[15]).toBe(darkTheme().brightWhite)
  })
})

// ── input.ts ──

function makeInputController(overrides?: {
  onCommand?: (input: string) => void | Promise<void>
  onComplete?: (input: string) => string[]
  onHistoryPrev?: () => string | null
  onHistoryNext?: () => string | null
  onClear?: () => void
  onInterrupt?: () => void
  onShowCompletions?: (c: string[]) => void
}): InputController {
  return createInputController({
    onCommand: overrides?.onCommand ?? vi.fn(),
    onComplete: overrides?.onComplete ?? vi.fn(() => []),
    onHistoryPrev: overrides?.onHistoryPrev ?? vi.fn(() => null),
    onHistoryNext: overrides?.onHistoryNext ?? vi.fn(() => null),
    onClear: overrides?.onClear ?? vi.fn(),
    onInterrupt: overrides?.onInterrupt ?? vi.fn(),
    onShowCompletions: overrides?.onShowCompletions,
  })
}

function key(key: string, opts: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    key,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault: () => {},
    ...opts,
  } as KeyboardEvent
}

describe('InputController — basic editing', () => {
  it('starts with empty buffer and cursor at 0', () => {
    const c = makeInputController()
    expect(c.buffer.value).toBe('')
    expect(c.cursorPos.value).toBe(0)
  })

  it('inserts printable characters', () => {
    const c = makeInputController()
    c.handleKey(key('h'))
    c.handleKey(key('i'))
    expect(c.buffer.value).toBe('hi')
    expect(c.cursorPos.value).toBe(2)
  })

  it('backspace deletes before cursor', () => {
    const c = makeInputController()
    c.handleKey(key('h'))
    c.handleKey(key('i'))
    c.handleKey(key('Backspace'))
    expect(c.buffer.value).toBe('h')
    expect(c.cursorPos.value).toBe(1)
  })

  it('backspace at position 0 is a no-op', () => {
    const c = makeInputController()
    c.handleKey(key('Backspace'))
    expect(c.buffer.value).toBe('')
    expect(c.cursorPos.value).toBe(0)
  })

  it('delete removes at cursor', () => {
    const c = makeInputController()
    c.setBuffer('hello', 2)
    c.handleKey(key('Delete'))
    expect(c.buffer.value).toBe('helo')
    expect(c.cursorPos.value).toBe(2)
  })

  it('inserts at cursor position (not just at end)', () => {
    const c = makeInputController()
    c.setBuffer('abc', 1)
    c.handleKey(key('X'))
    expect(c.buffer.value).toBe('aXbc')
    expect(c.cursorPos.value).toBe(2)
  })
})

describe('InputController — cursor movement', () => {
  it('ArrowLeft/Right move cursor', () => {
    const c = makeInputController()
    c.setBuffer('abc', 3)
    c.handleKey(key('ArrowLeft'))
    expect(c.cursorPos.value).toBe(2)
    c.handleKey(key('ArrowLeft'))
    expect(c.cursorPos.value).toBe(1)
    c.handleKey(key('ArrowRight'))
    expect(c.cursorPos.value).toBe(2)
  })

  it('ArrowLeft at 0 is a no-op', () => {
    const c = makeInputController()
    c.setBuffer('abc', 0)
    c.handleKey(key('ArrowLeft'))
    expect(c.cursorPos.value).toBe(0)
  })

  it('ArrowRight at end is a no-op', () => {
    const c = makeInputController()
    c.setBuffer('abc', 3)
    c.handleKey(key('ArrowRight'))
    expect(c.cursorPos.value).toBe(3)
  })

  it('Home/End jump to start/end', () => {
    const c = makeInputController()
    c.setBuffer('abc', 1)
    c.handleKey(key('Home'))
    expect(c.cursorPos.value).toBe(0)
    c.handleKey(key('End'))
    expect(c.cursorPos.value).toBe(3)
  })

  it('Ctrl+A/E jump to start/end', () => {
    const c = makeInputController()
    c.setBuffer('abc', 1)
    c.handleKey(key('a', { ctrlKey: true }))
    expect(c.cursorPos.value).toBe(0)
    c.handleKey(key('e', { ctrlKey: true }))
    expect(c.cursorPos.value).toBe(3)
  })
})

describe('InputController — line editing shortcuts', () => {
  it('Ctrl+U clears before cursor', () => {
    const c = makeInputController()
    c.setBuffer('hello', 3)
    c.handleKey(key('u', { ctrlKey: true }))
    expect(c.buffer.value).toBe('lo')
    expect(c.cursorPos.value).toBe(0)
  })

  it('Ctrl+W deletes word before cursor', () => {
    const c = makeInputController()
    c.setBuffer('hello world', 11)
    c.handleKey(key('w', { ctrlKey: true }))
    expect(c.buffer.value).toBe('hello ')
    expect(c.cursorPos.value).toBe(6)
  })
})

describe('InputController — command submission', () => {
  it('Enter calls onCommand with the buffer and resets', async () => {
    const onCommand = vi.fn()
    const c = makeInputController({ onCommand })
    c.handleKey(key('h'))
    c.handleKey(key('i'))
    c.handleKey(key('Enter'))
    expect(onCommand).toHaveBeenCalledWith('hi')
    expect(c.buffer.value).toBe('')
    expect(c.cursorPos.value).toBe(0)
  })
})

describe('InputController — interrupt and clear', () => {
  it('Ctrl+C calls onInterrupt and resets', () => {
    const onInterrupt = vi.fn()
    const c = makeInputController({ onInterrupt })
    c.handleKey(key('h'))
    c.handleKey(key('c', { ctrlKey: true }))
    expect(onInterrupt).toHaveBeenCalled()
    expect(c.buffer.value).toBe('')
  })

  it('Ctrl+L calls onClear', () => {
    const onClear = vi.fn()
    const c = makeInputController({ onClear })
    c.handleKey(key('l', { ctrlKey: true }))
    expect(onClear).toHaveBeenCalled()
  })
})

describe('InputController — history navigation', () => {
  it('ArrowUp calls onHistoryPrev and sets buffer', () => {
    const c = makeInputController({ onHistoryPrev: () => 'previous command' })
    c.handleKey(key('ArrowUp'))
    expect(c.buffer.value).toBe('previous command')
    expect(c.cursorPos.value).toBe('previous command'.length)
  })

  it('ArrowDown calls onHistoryNext and sets buffer', () => {
    const c = makeInputController({ onHistoryNext: () => 'next command' })
    c.handleKey(key('ArrowDown'))
    expect(c.buffer.value).toBe('next command')
  })

  it('ArrowUp with null return does not change buffer', () => {
    const c = makeInputController({ onHistoryPrev: () => null })
    c.handleKey(key('h'))
    c.handleKey(key('ArrowUp'))
    expect(c.buffer.value).toBe('h')
  })
})

describe('InputController — tab completion', () => {
  it('single completion replaces input', () => {
    const c = makeInputController({ onComplete: () => ['help'] })
    c.handleKey(key('he'))
    c.handleKey(key('Tab'))
    expect(c.buffer.value).toBe('help ')
    expect(c.cursorPos.value).toBe(5)
  })

  it('no completions is a no-op', () => {
    const c = makeInputController({ onComplete: () => [] })
    c.handleKey(key('h'))
    c.handleKey(key('Tab'))
    expect(c.buffer.value).toBe('h')
  })

  it('multiple completions calls onShowCompletions', () => {
    const onShow = vi.fn()
    const c = makeInputController({
      onComplete: () => ['head', 'help'],
      onShowCompletions: onShow,
    })
    c.handleKey(key('he'))
    c.handleKey(key('Tab'))
    expect(onShow).toHaveBeenCalledWith(['head', 'help'])
  })

  it('path completion replaces last token', () => {
    const c = makeInputController({ onComplete: () => ['/etc/hostname'] })
    c.setBuffer('cat /etc/hos')
    c.handleKey(key('Tab'))
    expect(c.buffer.value).toBe('cat /etc/hostname')
  })
})

describe('InputController — setBuffer and reset', () => {
  it('setBuffer replaces buffer and moves cursor', () => {
    const c = makeInputController()
    c.setBuffer('hello', 2)
    expect(c.buffer.value).toBe('hello')
    expect(c.cursorPos.value).toBe(2)
  })

  it('setBuffer defaults cursor to end', () => {
    const c = makeInputController()
    c.setBuffer('hello')
    expect(c.cursorPos.value).toBe(5)
  })

  it('reset clears buffer and cursor', () => {
    const c = makeInputController()
    c.setBuffer('hello', 3)
    c.reset()
    expect(c.buffer.value).toBe('')
    expect(c.cursorPos.value).toBe(0)
  })
})

// ── renderer.ts + lifecycle.ts (DOM integration) ──

describe('renderer (DOM)', () => {
  it('creates output element in container', async () => {
    const { createRenderer } = await import('../render/renderer')
    const container = document.createElement('div')
    document.body.appendChild(container)
    const r = createRenderer({ container, theme: 'dark' })
    expect(r.outputElement).toBeDefined()
    expect(container.contains(r.outputElement)).toBe(true)
    r.dispose()
    container.remove()
  })

  it('write renders text in the output DOM', async () => {
    const { createRenderer } = await import('../render/renderer')
    const container = document.createElement('div')
    document.body.appendChild(container)
    const r = createRenderer({ container, theme: 'dark' })
    r.write('hello world\r\n')
    await waitForRepaint()
    expect(r.outputElement.textContent).toContain('hello world')
    r.dispose()
    container.remove()
  })

  it('setTheme updates background color', async () => {
    const { createRenderer } = await import('../render/renderer')
    const container = document.createElement('div')
    document.body.appendChild(container)
    const r = createRenderer({ container, theme: 'dark' })
    const darkBg = r.outputElement.style.background
    r.setTheme('light')
    await waitForRepaint()
    expect(r.outputElement.style.background).not.toBe(darkBg)
    r.dispose()
    container.remove()
  })

  it('clear empties the output', async () => {
    const { createRenderer } = await import('../render/renderer')
    const container = document.createElement('div')
    document.body.appendChild(container)
    const r = createRenderer({ container, theme: 'dark' })
    r.write('some text\r\n')
    await waitForRepaint()
    r.clear()
    await waitForRepaint()
    const text = r.outputElement.textContent || ''
    expect(text.replace(/\s/g, '').length).toBe(0)
    r.dispose()
    container.remove()
  })
})

describe('lifecycle / session (DOM)', () => {
  function makeContainer(): HTMLElement {
    const c = document.createElement('div')
    c.style.width = '800px'
    c.style.height = '400px'
    c.style.display = 'block'
    document.body.appendChild(c)
    return c
  }

  it('start draws MOTD and creates input line', async () => {
    const { createSession } = await import('../render/lifecycle')
    const container = makeContainer()
    const session = createSession({ container, theme: 'dark' })
    await session.start()
    await waitForRepaint(150)
    // MOTD should be in the output
    expect(container.textContent).toContain('LATOM NODE DOCUMENTATION TERMINAL')
    // Input line should show prompt
    expect(container.textContent).toContain('researcher')
    expect(container.textContent).toContain('LATOM-7')
    expect(session.active).toBe(true)
    await session.stop()
    container.remove()
  })

  it('typing and executing a command shows output', async () => {
    const { createSession } = await import('../render/lifecycle')
    const container = makeContainer()
    const session = createSession({ container, theme: 'dark' })
    await session.start()
    await waitForRepaint(150)

    // Simulate typing "whoami" + Enter
    for (const ch of 'whoami') {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true }))
    }
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    await waitForRepaint(100)

    expect(container.textContent).toContain('researcher')
    await session.stop()
    container.remove()
  })

  it('exit command calls onExit and deactivates', async () => {
    const { createSession } = await import('../render/lifecycle')
    const onExit = vi.fn()
    const container = makeContainer()
    const session = createSession({ container, theme: 'dark', onExit })
    await session.start()
    await waitForRepaint(150)

    // Type "exit" + Enter
    for (const ch of 'exit') {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true }))
    }
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    await waitForRepaint(100)
    expect(onExit).toHaveBeenCalled()
    expect(session.active).toBe(false)
    await session.stop()
    container.remove()
  })

  it('stop removes DOM elements', async () => {
    const { createSession } = await import('../render/lifecycle')
    const container = makeContainer()
    const session = createSession({ container, theme: 'dark' })
    await session.start()
    await waitForRepaint(150)
    expect(container.children.length).toBeGreaterThan(0)
    await session.stop()
    expect(container.children.length).toBe(0)
    container.remove()
  })
})
