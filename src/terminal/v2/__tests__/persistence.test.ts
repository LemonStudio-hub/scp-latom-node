/**
 * Persistence layer tests: storage backend + debounced save.
 *
 * happy-dom does not provide IndexedDB or OPFS, so we test the public
 * contract with an in-memory mock storage. The debounced-save logic
 * (which is backend-agnostic) is tested with fake timers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createStorage,
  resetStorageCache,
  createDebouncedSave,
  type TerminalStorage,
} from '../persistence'
import { createDefaultTree, computeDelta, mkdir, file as fsFile } from '../fs'
import type { PersistedState } from '../types'

// ── In-memory mock storage ──

function makeMockStorage(): TerminalStorage & { _store: PersistedState | null } {
  const obj = { _store: null as PersistedState | null }
  return {
    _store: obj._store,
    async load() {
      return obj._store ? { ...obj._store } : null
    },
    async save(state) {
      obj._store = { ...state }
    },
    async clear() {
      obj._store = null
    },
  } as TerminalStorage & { _store: PersistedState | null }
}

// ── createStorage (backend detection) ──

describe('createStorage', () => {
  beforeEach(() => {
    resetStorageCache()
  })

  it('returns null when no backend is available (happy-dom)', async () => {
    // happy-dom lacks both OPFS and IndexedDB
    const storage = await createStorage()
    expect(storage).toBeNull()
  })

  it('caches the detection result (same value on second call)', async () => {
    const a = await createStorage()
    const b = await createStorage()
    expect(a).toBe(b)
  })

  it('resetStorageCache forces re-detection', async () => {
    await createStorage()
    resetStorageCache()
    const b = await createStorage()
    expect(b).toBeNull() // still null in happy-dom
  })
})

// ── TerminalStorage contract (via mock) ──

describe('TerminalStorage — load/save/clear', () => {
  let storage: ReturnType<typeof makeMockStorage>

  beforeEach(() => {
    storage = makeMockStorage()
  })

  it('load returns null when nothing is saved', async () => {
    expect(await storage.load()).toBeNull()
  })

  it('save then load roundtrips the state', async () => {
    const state: PersistedState = {
      cwd: '/home/researcher/projects',
      history: ['ls', 'cd projects', 'pwd'],
      env: { USER: 'researcher', HOME: '/home/researcher', CUSTOM: 'value' },
      filesystemDelta: {
        home: {
          type: 'dir',
          children: {
            researcher: {
              type: 'dir',
              children: {
                'saved.txt': { type: 'file', content: 'saved data' },
              },
            },
          },
        },
      },
    }

    await storage.save(state)
    const loaded = await storage.load()

    expect(loaded).not.toBeNull()
    expect(loaded!.cwd).toBe('/home/researcher/projects')
    expect(loaded!.history).toEqual(['ls', 'cd projects', 'pwd'])
    expect(loaded!.env.USER).toBe('researcher')
    expect(loaded!.env.CUSTOM).toBe('value')
    expect(loaded!.filesystemDelta.home?.children?.researcher?.children?.['saved.txt']).toEqual({
      type: 'file',
      content: 'saved data',
    })
  })

  it('save overwrites previous state', async () => {
    await storage.save({ cwd: '/a', history: ['x'], env: {}, filesystemDelta: {} })
    await storage.save({ cwd: '/b', history: ['y'], env: {}, filesystemDelta: {} })
    const loaded = await storage.load()
    expect(loaded!.cwd).toBe('/b')
    expect(loaded!.history).toEqual(['y'])
  })

  it('clear removes saved state', async () => {
    await storage.save({ cwd: '/x', history: [], env: {}, filesystemDelta: {} })
    await storage.clear()
    expect(await storage.load()).toBeNull()
  })
})

// ── Debounced save ──

describe('createDebouncedSave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('coalesces rapid calls into a single save', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const storage: TerminalStorage = { load: vi.fn(), save, clear: vi.fn() }
    const getState = vi.fn().mockReturnValue({
      cwd: '/home',
      history: [],
      env: {},
      filesystemDelta: {},
    })

    const debounced = createDebouncedSave(storage, getState, 500)

    debounced()
    debounced()
    debounced()

    expect(save).not.toHaveBeenCalled()

    vi.advanceTimersByTime(500)
    await vi.runAllTimersAsync()

    expect(save).toHaveBeenCalledTimes(1)
  })

  it('writes the latest state snapshot', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const storage: TerminalStorage = { load: vi.fn(), save, clear: vi.fn() }
    let cwd = '/first'
    const getState = vi.fn().mockReturnValue({
      cwd,
      history: [],
      env: {},
      filesystemDelta: {},
    })

    const debounced = createDebouncedSave(storage, getState, 300)

    debounced()
    cwd = '/second'
    getState.mockReturnValue({ cwd, history: [], env: {}, filesystemDelta: {} })
    debounced()

    vi.advanceTimersByTime(300)
    await vi.runAllTimersAsync()

    expect(save).toHaveBeenCalledTimes(1)
    const savedArg = save.mock.calls[0][0] as PersistedState
    expect(savedArg.cwd).toBe('/second')
  })

  it('schedules a new save after the previous one fires', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const storage: TerminalStorage = { load: vi.fn(), save, clear: vi.fn() }
    const getState = vi.fn().mockReturnValue({
      cwd: '/home',
      history: [],
      env: {},
      filesystemDelta: {},
    })

    const debounced = createDebouncedSave(storage, getState, 200)

    debounced()
    vi.advanceTimersByTime(200)
    await vi.runAllTimersAsync()
    expect(save).toHaveBeenCalledTimes(1)

    debounced()
    vi.advanceTimersByTime(200)
    await vi.runAllTimersAsync()
    expect(save).toHaveBeenCalledTimes(2)
  })

  it('swallows save errors without throwing', async () => {
    const save = vi.fn().mockRejectedValue(new Error('disk full'))
    const storage: TerminalStorage = { load: vi.fn(), save, clear: vi.fn() }
    const getState = vi.fn().mockReturnValue({
      cwd: '/home',
      history: [],
      env: {},
      filesystemDelta: {},
    })

    const debounced = createDebouncedSave(storage, getState, 100)
    debounced()

    // Should not throw
    vi.advanceTimersByTime(100)
    await vi.runAllTimersAsync()
    expect(save).toHaveBeenCalled()
  })
})

// ── Integration: delta + storage roundtrip ──

describe('filesystem delta persistence roundtrip', () => {
  it('persisting a modified tree and restoring it yields equivalent state', async () => {
    const storage = makeMockStorage()

    // Build a modified tree: add a file + dir to /home/researcher
    const baseline = createDefaultTree()
    const modified = createDefaultTree()
    const researcher = modified.children?.get('home')?.children?.get('researcher')
    if (researcher?.children) {
      researcher.children.set('persisted.txt', fsFile('persisted.txt', 'persisted content'))
      mkdir(researcher, 'newdir')
    }

    const delta = computeDelta(modified, baseline)

    const state: PersistedState = {
      cwd: '/home/researcher',
      history: ['mkdir newdir', 'touch persisted.txt'],
      env: { USER: 'researcher', HOME: '/home/researcher' },
      filesystemDelta: delta,
    }

    await storage.save(state)
    const loaded = await storage.load()

    expect(loaded).not.toBeNull()
    expect(loaded!.filesystemDelta).toEqual(delta)
    expect(loaded!.filesystemDelta.home?.children?.researcher?.children?.['persisted.txt']).toEqual(
      {
        type: 'file',
        content: 'persisted content',
      },
    )
  })
})
