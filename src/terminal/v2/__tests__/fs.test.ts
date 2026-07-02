/**
 * Virtual filesystem tests — mirrors legacy coverage and adds normalize.
 */

import { describe, it, expect } from 'vitest'
import {
  file,
  dir,
  resolve,
  resolveAbsolute,
  splitPath,
  normalize,
  mkdir,
  mkfile,
  remove,
  write,
  deepClone,
  isProtected,
  PROTECTED_PATHS,
  createDefaultTree,
  serialize,
  deserialize,
  computeDelta,
  mergeDelta,
} from '../fs'
import type { FSNode, SerializedFSDelta } from '../types'

// ── node.ts ──

describe('file / dir', () => {
  it('file() builds a file node', () => {
    expect(file('a.txt', 'hi')).toEqual({ type: 'file', name: 'a.txt', content: 'hi' })
  })

  it('dir() builds a dir node with a Map of children', () => {
    const d = dir('root', [file('a', '1'), file('b', '2')])
    expect(d.type).toBe('dir')
    expect(d.children).toBeInstanceOf(Map)
    expect([...(d.children as Map<string, FSNode>).keys()]).toEqual(['a', 'b'])
  })

  it('dir() defaults to an empty children map', () => {
    const d = dir('empty')
    expect(d.children).toBeInstanceOf(Map)
    expect(d.children?.size).toBe(0)
  })
})

// ── paths.ts ──

describe('normalize', () => {
  it('collapses redundant slashes', () => {
    expect(normalize('//a///b/')).toBe('/a/b')
  })
  it('resolves . segments', () => {
    expect(normalize('/a/./b')).toBe('/a/b')
  })
  it('resolves .. segments', () => {
    expect(normalize('/a/b/../c')).toBe('/a/c')
    expect(normalize('/a/b/../../c')).toBe('/c')
  })
  it('.. at root stays at root', () => {
    expect(normalize('/..')).toBe('/')
    expect(normalize('/a/../..')).toBe('/')
  })
  it('empty becomes root', () => {
    expect(normalize('')).toBe('/')
  })
})

describe('resolveAbsolute', () => {
  it('joins relative to cwd', () => {
    expect(resolveAbsolute('/home/researcher', 'notes')).toBe('/home/researcher/notes')
    expect(resolveAbsolute('/home/researcher', './notes')).toBe('/home/researcher/notes')
  })
  it('absolute target ignores cwd', () => {
    expect(resolveAbsolute('/home/researcher', '/scp/scp-173.txt')).toBe('/scp/scp-173.txt')
  })
  it('resolves .. across cwd boundary', () => {
    expect(resolveAbsolute('/home/researcher', '..')).toBe('/home')
    expect(resolveAbsolute('/home/researcher', '../..')).toBe('/')
  })
  it('expands ~ to home', () => {
    expect(resolveAbsolute('/scp', '~', '/home/researcher')).toBe('/home/researcher')
    expect(resolveAbsolute('/scp', '~/projects', '/home/researcher')).toBe(
      '/home/researcher/projects',
    )
  })
  it('ignores home when target has no ~', () => {
    expect(resolveAbsolute('/scp', '/etc', '/home/researcher')).toBe('/etc')
  })
})

describe('splitPath', () => {
  it('splits a nested path', () => {
    expect(splitPath('/etc/hostname')).toEqual({ parent: '/etc', name: 'hostname' })
    expect(splitPath('/scp/scp-173.txt')).toEqual({
      parent: '/scp',
      name: 'scp-173.txt',
    })
  })
  it('splits a top-level path', () => {
    expect(splitPath('/etc')).toEqual({ parent: '/', name: 'etc' })
  })
  it('trims a trailing slash before splitting', () => {
    expect(splitPath('/etc/')).toEqual({ parent: '/', name: 'etc' })
  })
})

describe('resolve', () => {
  const root = createDefaultTree()

  it('resolves absolute paths', () => {
    const node = resolve(root, '/', '/etc/hostname')
    expect(node).not.toBeNull()
    expect(node?.type).toBe('file')
    expect(node?.name).toBe('hostname')
    expect(node?.content).toContain('LATOM-7')
  })

  it('resolves relative paths', () => {
    const node = resolve(root, '/etc', 'hostname')
    expect(node?.name).toBe('hostname')
  })

  it('resolves .. to parent', () => {
    const node = resolve(root, '/etc', '..')
    expect(node?.type).toBe('dir')
  })

  it('resolves . to current directory', () => {
    const node = resolve(root, '/scp', '.')
    expect(node?.type).toBe('dir')
  })

  it('expands ~ to home', () => {
    const node = resolve(root, '/scp', '~', '/home/researcher')
    expect(node?.type).toBe('dir')
    expect(node?.name).toBe('researcher')
  })

  it('returns null for non-existent paths', () => {
    expect(resolve(root, '/', '/nonexistent')).toBeNull()
  })

  it('returns null when descending through a file', () => {
    expect(resolve(root, '/etc', 'hostname/sub')).toBeNull()
  })
})

// ── operations.ts ──

describe('mkdir', () => {
  it('creates a directory inside a parent', () => {
    const parent = dir('p', [])
    const child = mkdir(parent, 'child')
    expect(child?.type).toBe('dir')
    expect(parent.children?.has('child')).toBe(true)
  })
  it('returns null when name already exists', () => {
    const parent = dir('p', [dir('child')])
    expect(mkdir(parent, 'child')).toBeNull()
  })
  it('returns null when parent is a file', () => {
    expect(mkdir(file('f', 'x'), 'child')).toBeNull()
  })
})

describe('mkfile', () => {
  it('creates a file inside a parent', () => {
    const parent = dir('p', [])
    const f = mkfile(parent, 'a.txt', 'hi')
    expect(f?.type).toBe('file')
    expect(f?.content).toBe('hi')
  })
  it('defaults content to empty string', () => {
    const parent = dir('p', [])
    expect(mkfile(parent, 'a')?.content).toBe('')
  })
  it('returns null when name already exists', () => {
    const parent = dir('p', [file('a', '1')])
    expect(mkfile(parent, 'a')).toBeNull()
  })
})

describe('remove', () => {
  it('removes a child by name', () => {
    const parent = dir('p', [file('a', '1')])
    expect(remove(parent, 'a')).toBe(true)
    expect(parent.children?.has('a')).toBe(false)
  })
  it('returns false when child missing', () => {
    expect(remove(dir('p', []), 'nope')).toBe(false)
  })
})

describe('write', () => {
  it('overwrites file content', () => {
    const f = file('a', 'old')
    expect(write(f, 'new')).toBe(true)
    expect(f.content).toBe('new')
  })
  it('returns false for a directory', () => {
    expect(write(dir('d'), 'x')).toBe(false)
  })
})

describe('deepClone', () => {
  it('clones a file node', () => {
    const f = file('a', 'x')
    const c = deepClone(f)
    expect(c).toEqual(f)
    expect(c).not.toBe(f)
  })
  it('clones a directory subtree with new Map instances', () => {
    const root = dir('root', [file('a', '1'), dir('sub', [file('b', '2')])])
    const c = deepClone(root)
    expect(c).not.toBe(root)
    expect(c.children).not.toBe(root.children)
    expect(c.children?.get('sub')?.children).not.toBe(root.children?.get('sub')?.children)
    // mutating the clone must not touch the original
    c.children?.get('sub')?.children?.set('c', file('c', '3'))
    expect(root.children?.get('sub')?.children?.has('c')).toBe(false)
  })
})

// ── protect.ts ──

describe('isProtected', () => {
  it('flags protected top-level paths', () => {
    for (const p of PROTECTED_PATHS) expect(isProtected(p)).toBe(true)
  })
  it('flags paths beneath protected directories', () => {
    expect(isProtected('/scp/scp-173.txt')).toBe(true)
    expect(isProtected('/etc/hostname')).toBe(true)
    expect(isProtected('/documents/protocol-omega.txt')).toBe(true)
  })
  it('does not flag user-writable paths', () => {
    expect(isProtected('/home/researcher')).toBe(false)
    expect(isProtected('/tmp')).toBe(false)
    expect(isProtected('/home/researcher/notes.txt')).toBe(false)
  })
  it('normalizes relative input', () => {
    expect(isProtected('scp/x')).toBe(true)
  })
})

// ── tree.ts ──

describe('createDefaultTree', () => {
  const root = createDefaultTree()

  it('has a root directory with expected top-level children', () => {
    expect(root.type).toBe('dir')
    for (const name of [
      'etc',
      'scp',
      'documents',
      'logs',
      'home',
      'proc',
      'tmp',
      'mnt',
      'opt',
      'var',
    ]) {
      expect(root.children?.has(name)).toBe(true)
    }
  })

  it('ships the SCP entries', () => {
    const scp = root.children?.get('scp')
    expect(scp?.children?.has('scp-173.txt')).toBe(true)
    expect(scp?.children?.get('scp-682.txt')?.content).toContain('Keter')
  })

  it('ships the MOTD with ASCII art', () => {
    const motd = root.children?.get('etc')?.children?.get('motd')?.content ?? ''
    expect(motd).toContain('LATOM NODE DOCUMENTATION TERMINAL')
    expect(motd).toContain('Secure. Contain. Protect.')
  })

  it('ships the researcher home tree', () => {
    const researcher = root.children?.get('home')?.children?.get('researcher')
    expect(researcher?.children?.has('notes.txt')).toBe(true)
    expect(researcher?.children?.has('projects')).toBe(true)
  })

  it('returns a fresh tree each call (no shared mutation)', () => {
    const a = createDefaultTree()
    const b = createDefaultTree()
    a.children?.get('tmp')?.children?.set('x', file('x', ''))
    expect(b.children?.get('tmp')?.children?.has('x')).toBe(false)
  })
})

// ── delta.ts ──

describe('serialize', () => {
  it('serializes a file node', () => {
    expect(serialize(file('t', 'hi'))).toEqual({ type: 'file', content: 'hi' })
  })
  it('serializes a file node with empty content', () => {
    expect(serialize(file('t', ''))).toEqual({ type: 'file', content: '' })
  })
  it('serializes a directory with children', () => {
    const d = dir('root', [file('a', '1'), file('b', '2')])
    expect(serialize(d)).toEqual({
      type: 'dir',
      children: {
        a: { type: 'file', content: '1' },
        b: { type: 'file', content: '2' },
      },
    })
  })
  it('serializes nested directories', () => {
    const d = dir('/', [dir('sub', [file('deep', 'd')])])
    expect(serialize(d)).toEqual({
      type: 'dir',
      children: { sub: { type: 'dir', children: { deep: { type: 'file', content: 'd' } } } },
    })
  })
  it('serializes an empty directory', () => {
    expect(serialize(dir('empty', []))).toEqual({ type: 'dir', children: {} })
  })
})

describe('deserialize', () => {
  it('deserializes a file node', () => {
    expect(deserialize('t', { type: 'file', content: 'hi' })).toEqual({
      type: 'file',
      name: 't',
      content: 'hi',
    })
  })
  it('deserializes a directory with children', () => {
    const n = deserialize('root', {
      type: 'dir',
      children: { a: { type: 'file', content: '1' } },
    })
    expect(n.type).toBe('dir')
    expect(n.children?.get('a')).toEqual({ type: 'file', name: 'a', content: '1' })
  })
  it('roundtrips through serialize and deserialize', () => {
    const original = createDefaultTree()
    const restored = deserialize('/', serialize(original))
    expect(restored.children?.has('etc')).toBe(true)
    expect(restored.children?.get('etc')?.children?.get('hostname')?.content).toBe('LATOM-7\n')
  })
})

describe('computeDelta', () => {
  it('returns empty delta for identical trees', () => {
    const t = createDefaultTree()
    expect(computeDelta(t, t)).toEqual({})
  })
  it('detects user-added files', () => {
    const current = createDefaultTree()
    const baseline = createDefaultTree()
    current.children
      ?.get('home')
      ?.children?.get('researcher')
      ?.children?.set('user.txt', file('user.txt', 'u'))
    const delta = computeDelta(current, baseline)
    expect(delta.home?.children?.researcher?.children?.['user.txt']).toEqual({
      type: 'file',
      content: 'u',
    })
  })
  it('detects user-added directories', () => {
    const current = createDefaultTree()
    const baseline = createDefaultTree()
    current.children?.get('home')?.children?.get('researcher')?.children?.set('mydir', dir('mydir'))
    const delta = computeDelta(current, baseline)
    expect(delta.home?.children?.researcher?.children?.mydir).toEqual({
      type: 'dir',
      children: {},
    })
  })
  it('detects modified file content', () => {
    const current = createDefaultTree()
    const baseline = createDefaultTree()
    const notes = current.children
      ?.get('home')
      ?.children?.get('researcher')
      ?.children?.get('notes.txt')
    if (notes && notes.type === 'file') notes.content = 'changed'
    const delta = computeDelta(current, baseline)
    expect(delta.home?.children?.researcher?.children?.['notes.txt']).toEqual({
      type: 'file',
      content: 'changed',
    })
  })
  it('detects deleted nodes', () => {
    const current = createDefaultTree()
    const baseline = createDefaultTree()
    current.children?.get('home')?.children?.get('researcher')?.children?.delete('notes.txt')
    const delta = computeDelta(current, baseline)
    expect(delta.home?.children?.researcher?.children?.['notes.txt']).toEqual({
      type: 'dir',
      deleted: true,
    })
  })
  it('does not include unchanged files in delta', () => {
    const current = createDefaultTree()
    const baseline = createDefaultTree()
    current.children
      ?.get('home')
      ?.children?.get('researcher')
      ?.children?.set('new.txt', file('new.txt', 'n'))
    const delta = computeDelta(current, baseline)
    const researcher = delta.home?.children?.researcher?.children
    expect(researcher?.['notes.txt']).toBeUndefined()
    expect(researcher?.['.bashrc']).toBeUndefined()
    expect(researcher?.['new.txt']).toBeDefined()
  })
})

describe('mergeDelta', () => {
  it('applies user-added files to default tree', () => {
    const baseline = createDefaultTree()
    const delta: SerializedFSDelta = {
      home: {
        type: 'dir',
        children: {
          researcher: {
            type: 'dir',
            children: { 'user.txt': { type: 'file', content: 'u' } },
          },
        },
      },
    }
    const merged = mergeDelta(baseline, delta)
    const researcher = merged.children?.get('home')?.children?.get('researcher')
    expect(researcher?.children?.get('user.txt')?.content).toBe('u')
    // default files preserved
    expect(researcher?.children?.has('notes.txt')).toBe(true)
  })
  it('applies deleted nodes from delta', () => {
    const baseline = createDefaultTree()
    const delta: SerializedFSDelta = {
      home: {
        type: 'dir',
        children: {
          researcher: {
            type: 'dir',
            children: { 'notes.txt': { type: 'file', deleted: true } },
          },
        },
      },
    }
    const merged = mergeDelta(baseline, delta)
    const researcher = merged.children?.get('home')?.children?.get('researcher')
    expect(researcher?.children?.has('notes.txt')).toBe(false)
    expect(researcher?.children?.has('.bashrc')).toBe(true)
  })
  it('preserves baseline when delta is empty', () => {
    const merged = mergeDelta(createDefaultTree(), {})
    expect(merged.children?.has('etc')).toBe(true)
    expect(merged.children?.has('scp')).toBe(true)
  })
  it('does not mutate the baseline tree', () => {
    const baseline = createDefaultTree()
    const before = baseline.children?.get('etc')?.children?.get('hostname')?.content
    mergeDelta(baseline, {
      home: {
        type: 'dir',
        children: {
          researcher: {
            type: 'dir',
            children: { 'new.txt': { type: 'file', content: 'n' } },
          },
        },
      },
    })
    expect(baseline.children?.get('etc')?.children?.get('hostname')?.content).toBe(before)
  })
  it('full roundtrip: compute delta then merge', () => {
    const baseline = createDefaultTree()
    const modified = createDefaultTree()
    const researcher = modified.children?.get('home')?.children?.get('researcher')
    researcher?.children?.set('test.txt', file('test.txt', 't'))
    researcher?.children?.delete('notes.txt')

    const delta = computeDelta(modified, baseline)
    const merged = mergeDelta(baseline, delta)

    const mResearcher = merged.children?.get('home')?.children?.get('researcher')
    expect(mResearcher?.children?.has('test.txt')).toBe(true)
    expect(mResearcher?.children?.get('test.txt')?.content).toBe('t')
    expect(mResearcher?.children?.has('notes.txt')).toBe(false)
  })
})
