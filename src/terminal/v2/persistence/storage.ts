/**
 * Terminal persistence backend.
 *
 * OPFS (Origin Private File System) is the primary store; IndexedDB is
 * the fallback. Both persist the same PersistedState shape: cwd, history,
 * env, and a filesystem delta against the default tree.
 *
 * The backend is detected once and cached; call `resetStorageCache()` in
 * tests to force re-detection.
 */

import type { PersistedState } from '../types'

export interface TerminalStorage {
  load(): Promise<PersistedState | null>
  save(state: PersistedState): Promise<void>
  clear(): Promise<void>
}

const DB_NAME = 'SCP-Terminal-V2'
const DB_VERSION = 1
const STORE_NAME = 'state'
const OPFS_DIR = 'terminal-v2'
const STORAGE_VERSION = 1
const STATE_KEY = 'shell-state'

// ── OPFS Backend ──

async function createOPFSStorage(): Promise<TerminalStorage | null> {
  try {
    const root = await navigator.storage.getDirectory()
    const dirHandle = await root.getDirectoryHandle(OPFS_DIR, { create: true })

    return {
      async load() {
        try {
          const fileHandle = await dirHandle.getFileHandle('shell-state.json')
          const file = await fileHandle.getFile()
          const text = await file.text()
          const parsed = JSON.parse(text) as PersistedState
          // Discard if version mismatch — start fresh
          if ((parsed as unknown as { version?: number }).version !== STORAGE_VERSION) return null
          return parsed
        } catch {
          return null
        }
      },

      async save(state) {
        const fileHandle = await dirHandle.getFileHandle('shell-state.json', { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(JSON.stringify({ ...state, version: STORAGE_VERSION }))
        await writable.close()
      },

      async clear() {
        try {
          await dirHandle.removeEntry('shell-state.json')
        } catch {
          // File may not exist
        }
      },
    }
  } catch {
    return null
  }
}

// ── IndexedDB Backend ──

function createIndexedDBStorage(): Promise<TerminalStorage> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      const db = request.result

      function getTransaction(key: string): Promise<PersistedState | null> {
        return new Promise((res, rej) => {
          const tx = db.transaction(STORE_NAME, 'readonly')
          const store = tx.objectStore(STORE_NAME)
          const req = store.get(key)
          req.onsuccess = () => res(req.result ?? null)
          req.onerror = () => rej(req.error)
        })
      }

      function putTransaction(key: string, value: PersistedState): Promise<void> {
        return new Promise((res, rej) => {
          const tx = db.transaction(STORE_NAME, 'readwrite')
          const store = tx.objectStore(STORE_NAME)
          const req = store.put(value, key)
          req.onsuccess = () => res()
          req.onerror = () => rej(req.error)
        })
      }

      function deleteTransaction(key: string): Promise<void> {
        return new Promise((res, rej) => {
          const tx = db.transaction(STORE_NAME, 'readwrite')
          const store = tx.objectStore(STORE_NAME)
          const req = store.delete(key)
          req.onsuccess = () => res()
          req.onerror = () => rej(req.error)
        })
      }

      resolve({
        async load() {
          return getTransaction(STATE_KEY)
        },
        async save(state) {
          await putTransaction(STATE_KEY, { ...state })
        },
        async clear() {
          await deleteTransaction(STATE_KEY)
        },
      })
    }
  })
}

// ── Factory (cached) ──

let cachedStorage: TerminalStorage | null = null
let detectionDone = false

/** Detect and cache the best available backend (OPFS → IndexedDB → null). */
export async function createStorage(): Promise<TerminalStorage | null> {
  if (detectionDone) return cachedStorage
  detectionDone = true

  const opfs = await createOPFSStorage()
  if (opfs) {
    cachedStorage = opfs
    return cachedStorage
  }

  try {
    cachedStorage = await createIndexedDBStorage()
    return cachedStorage
  } catch {
    cachedStorage = null
    return null
  }
}

/** Reset the cached backend detection (for tests). */
export function resetStorageCache(): void {
  cachedStorage = null
  detectionDone = false
}
