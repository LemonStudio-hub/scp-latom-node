/**
 * Debounced save helper.
 *
 * Coalesces rapid mutation signals into a single storage write. The
 * first call schedules a timer; subsequent calls reset it. Only the
 * last `getState()` snapshot is written when the timer fires.
 */

import type { PersistedState } from '../types'
import type { TerminalStorage } from './storage'

export function createDebouncedSave(
  storage: TerminalStorage,
  getState: () => PersistedState,
  ms = 500,
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null

  return () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      storage.save(getState()).catch((e) => {
        console.warn('[storage] Debounced save failed:', e instanceof Error ? e.message : e)
      })
      timer = null
    }, ms)
  }
}
