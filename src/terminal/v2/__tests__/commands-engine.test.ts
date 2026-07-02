/**
 * parse.ts + registry.ts + async tests.
 */

import { describe, it, expect, vi } from 'vitest'
import { CommandRegistry } from '../commands/registry'
import { splitPipes, parseArgs } from '../commands/parse'
import { createDefaultTree } from '../fs'
import type { CommandContext } from '../commands/types'
import type { FsOperations } from '../types'

function readonlyFs(): FsOperations {
  const d = 'Permission denied (read-only filesystem)'
  return {
    mkdir: vi.fn(() => d),
    rm: vi.fn(() => d),
    touch: vi.fn(() => d),
    copy: vi.fn(() => d),
    move: vi.fn(() => d),
    rmrf: vi.fn(() => d),
    writeFile: vi.fn(() => d),
    appendFile: vi.fn(() => d),
  }
}

function makeCtx(overrides?: Partial<Omit<CommandContext, 'args'>>): Omit<CommandContext, 'args'> {
  return {
    cwd: '/home/researcher',
    root: createDefaultTree(),
    history: [],
    env: { USER: 'researcher', HOME: '/home/researcher', HOSTNAME: 'LATOM-7' },
    fs: readonlyFs(),
    setcwd: vi.fn(),
    setenv: vi.fn(),
    clear: vi.fn(),
    onMutate: vi.fn(),
    ...overrides,
  }
}

describe('splitPipes', () => {
  it('splits on unquoted pipes', () => {
    expect(splitPipes('a | b | c')).toEqual(['a ', ' b ', ' c'])
  })
  it('preserves quoted pipes', () => {
    expect(splitPipes('echo "a|b" | c')).toEqual(['echo "a|b" ', ' c'])
  })
  it('returns single segment for no pipes', () => {
    expect(splitPipes('echo hello')).toEqual(['echo hello'])
  })
})

describe('parseArgs', () => {
  it('splits on spaces', () => {
    expect(parseArgs('ls -la /etc')).toEqual(['ls', '-la', '/etc'])
  })
  it('preserves quoted spaces and strips quotes', () => {
    expect(parseArgs('echo "hello world"')).toEqual(['echo', 'hello world'])
  })
  it('handles empty input', () => {
    expect(parseArgs('')).toEqual([])
  })
})

describe('CommandRegistry', () => {
  it('register / get / names', () => {
    const r = new CommandRegistry()
    r.register({ name: 'foo', description: 'd', usage: 'u', handler: () => [] })
    expect(r.get('foo')).toBeDefined()
    expect(r.get('bar')).toBeUndefined()
    expect(r.names()).toEqual(['foo'])
  })

  it('execute returns empty for empty input', async () => {
    const r = new CommandRegistry()
    expect(await r.execute('', makeCtx())).toEqual([])
  })

  it('execute returns command not found', async () => {
    const r = new CommandRegistry()
    const out = await r.execute('nope', makeCtx())
    expect(out[0]).toContain('command not found')
  })

  it('complete returns command names for first token', () => {
    const r = new CommandRegistry()
    r.register({ name: 'help', description: '', usage: '', handler: () => [] })
    r.register({ name: 'head', description: '', usage: '', handler: () => [] })
    r.register({ name: 'ls', description: '', usage: '', handler: () => [] })
    expect(r.complete('he', '/', createDefaultTree()).sort()).toEqual(['head', 'help'])
  })

  it('complete returns file paths for subsequent tokens', () => {
    const r = new CommandRegistry()
    const root = createDefaultTree()
    expect(r.complete('cat /etc/hos', '/', root, '/home/researcher')).toContain('/etc/hostname')
  })
})

describe('async commands', () => {
  it('awaits async handlers', async () => {
    const r = new CommandRegistry()
    r.register({
      name: 'slow',
      description: '',
      usage: '',
      handler: async () => {
        await new Promise((res) => setTimeout(res, 10))
        return ['done']
      },
    })
    expect(await r.execute('slow', makeCtx())).toEqual(['done'])
  })

  it('pipes through async handlers', async () => {
    const r = new CommandRegistry()
    r.register({ name: 'gen', description: '', usage: '', handler: () => ['a', 'b', 'c'] })
    r.register({
      name: 'upper',
      description: '',
      usage: '',
      handler: async (ctx) => {
        await new Promise((res) => setTimeout(res, 5))
        return (ctx.stdin ?? []).map((s) => s.toUpperCase())
      },
    })
    expect(await r.execute('gen | upper', makeCtx())).toEqual(['A', 'B', 'C'])
  })

  it('catches handler errors', async () => {
    const r = new CommandRegistry()
    r.register({
      name: 'boom',
      description: '',
      usage: '',
      handler: () => {
        throw new Error('oops')
      },
    })
    const out = await r.execute('boom', makeCtx())
    expect(out[0]).toContain('internal error')
    expect(out[0]).toContain('oops')
  })
})
