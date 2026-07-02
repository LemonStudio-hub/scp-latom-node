/**
 * Shell layer tests: prompt, history navigation, reactive state, completion.
 */

import { describe, it, expect } from 'vitest'
import { isReactive } from 'vue'
import { createShellState, buildPrompt, DEFAULT_ENV, createHistoryNavigator } from '../shell'
import { getCompletions } from '../shell/completion'
import { CommandRegistry } from '../commands/registry'
import { registerAllBuiltin } from '../commands/builtin'
import { createDefaultTree } from '../fs'

// ── prompt ──

describe('DEFAULT_ENV', () => {
  it('ships required keys', () => {
    expect(DEFAULT_ENV.USER).toBe('researcher')
    expect(DEFAULT_ENV.HOME).toBe('/home/researcher')
    expect(DEFAULT_ENV.HOSTNAME).toBe('LATOM-7')
  })
})

describe('buildPrompt', () => {
  it('renders the user@host:dir$ prompt with ANSI colors', () => {
    const { state } = createShellState()
    const p = buildPrompt(state)
    expect(p).toContain('researcher')
    expect(p).toContain('LATOM-7')
    expect(p).toContain('~') // home abbreviated
    expect(p).toContain('$ ')
    // ANSI color escapes
    expect(p).toContain('\x1b[1;32m')
    expect(p).toContain('\x1b[0m')
  })

  it('abbreviates home subdirectories with ~', () => {
    const { state } = createShellState()
    state.cwd = '/home/researcher/projects'
    expect(buildPrompt(state)).toContain('~/projects')
  })

  it('leaves non-home paths untouched', () => {
    const { state } = createShellState()
    state.cwd = '/scp'
    expect(buildPrompt(state)).toContain('/scp')
    expect(buildPrompt(state)).not.toContain('~/scp')
  })

  it('honors env overrides for user/host/home', () => {
    const { state } = createShellState({
      env: { USER: 'agent', HOSTNAME: 'SITE-19', HOME: '/home/agent' },
    })
    state.cwd = '/home/agent'
    const p = buildPrompt(state)
    expect(p).toContain('agent')
    expect(p).toContain('SITE-19')
    expect(p).toContain('~')
  })
})

// ── history navigator ──

describe('createHistoryNavigator', () => {
  it('returns null on empty history', () => {
    const nav = createHistoryNavigator([])
    expect(nav.prev()).toBeNull()
  })

  it('navigates backward then forward', () => {
    const nav = createHistoryNavigator(['pwd', 'whoami', 'ls'])
    expect(nav.prev()).toBe('ls') // latest
    expect(nav.prev()).toBe('whoami')
    expect(nav.prev()).toBe('pwd')
    expect(nav.prev()).toBe('pwd') // stuck at oldest
    expect(nav.next()).toBe('whoami')
    expect(nav.next()).toBe('ls')
    expect(nav.next()).toBe('') // fell off bottom → fresh
  })

  it('reset returns to fresh-input state', () => {
    const nav = createHistoryNavigator(['a', 'b'])
    nav.prev()
    nav.prev()
    nav.reset()
    expect(nav.prev()).toBe('b') // starts from latest again
  })

  it('next without prior prev returns null', () => {
    const nav = createHistoryNavigator(['a'])
    expect(nav.next()).toBeNull()
  })
})

// ── shell state ──

describe('createShellState', () => {
  it('returns a reactive state object', () => {
    const { state } = createShellState()
    expect(isReactive(state)).toBe(true)
  })

  it('seeds defaults from DEFAULT_ENV', () => {
    const { state } = createShellState()
    expect(state.cwd).toBe(DEFAULT_ENV.HOME)
    expect(state.env.USER).toBe('researcher')
    expect(state.history).toEqual([])
    expect(state.historyIndex).toBe(-1)
    expect(state.root.type).toBe('dir')
  })

  it('setcwd updates cwd', () => {
    const { state, setcwd } = createShellState()
    setcwd('/scp')
    expect(state.cwd).toBe('/scp')
  })

  it('setenv updates env (and merges with defaults)', () => {
    const { state, setenv } = createShellState()
    setenv('CUSTOM', 'x')
    expect(state.env.CUSTOM).toBe('x')
    // defaults preserved
    expect(state.env.USER).toBe('researcher')
  })

  it('pushHistory skips empty and duplicates', () => {
    const { state, pushHistory } = createShellState()
    pushHistory('pwd')
    pushHistory('pwd') // duplicate consecutive — skipped
    pushHistory('   ') // empty after trim — skipped
    pushHistory('whoami')
    expect(state.history).toEqual(['pwd', 'whoami'])
  })

  it('pushHistory caps at 500 entries', () => {
    const { state, pushHistory } = createShellState()
    for (let i = 0; i < 510; i++) pushHistory(`cmd${i}`)
    expect(state.history.length).toBe(500)
    // oldest trimmed, newest kept
    expect(state.history[0]).toBe('cmd10')
    expect(state.history[499]).toBe('cmd509')
  })

  it('resetHistoryCursor sets index to -1', () => {
    const { state, resetHistoryCursor } = createShellState()
    state.historyIndex = 3
    resetHistoryCursor()
    expect(state.historyIndex).toBe(-1)
  })

  it('setRoot replaces the filesystem tree', () => {
    const { state, setRoot } = createShellState()
    const newTree = createDefaultTree()
    setRoot(newTree)
    // Vue reactive wraps nested objects, so compare structure not identity
    expect(state.root.type).toBe('dir')
    expect(state.root.children?.has('etc')).toBe(true)
    expect(state.root.children?.has('scp')).toBe(true)
  })

  it('accepts partial initial overrides', () => {
    const { state } = createShellState({
      cwd: '/scp',
      history: ['ls', 'cd'],
      env: { USER: 'agent', HOME: '/home/agent' },
    })
    expect(state.cwd).toBe('/scp')
    expect(state.history).toEqual(['ls', 'cd'])
    expect(state.env.USER).toBe('agent')
    // default keys still present
    expect(state.env.HOSTNAME).toBe('LATOM-7')
  })
})

// ── completion ──

describe('getCompletions', () => {
  function makeRegistry(): CommandRegistry {
    const r = new CommandRegistry()
    registerAllBuiltin(r)
    return r
  }

  it('completes command names for the first token', () => {
    const r = makeRegistry()
    const root = createDefaultTree()
    const c = getCompletions('he', '/home/researcher', root, r, '/home/researcher')
    expect(c).toContain('help')
    expect(c).toContain('head')
  })

  it('completes file paths for subsequent tokens', () => {
    const r = makeRegistry()
    const root = createDefaultTree()
    const c = getCompletions('cat /etc/hos', '/home/researcher', root, r, '/home/researcher')
    expect(c).toContain('/etc/hostname')
  })

  it('returns empty for no matches', () => {
    const r = makeRegistry()
    const root = createDefaultTree()
    expect(getCompletions('zzz', '/home/researcher', root, r)).toEqual([])
  })
})
