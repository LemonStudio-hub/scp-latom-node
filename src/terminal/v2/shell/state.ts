/**
 * Reactive shell state.
 *
 * Wraps cwd/history/env/root in Vue reactivity and exposes mutation
 * helpers that the command layer uses via setcwd/setenv/pushHistory.
 * The state object is a single `reactive()` so any consumer (renderer,
 * prompt builder) tracking a field re-renders automatically when it
 * changes.
 *
 * Design notes:
 *  - `pushHistory` skips empty input and consecutive duplicates, matching
 *    the legacy shell.ts behavior so the up-arrow doesn't replay the same
 *    command repeatedly.
 *  - `resetHistoryCursor` is called after each command execution so the
 *    next Up-arrow starts from the latest entry.
 *  - `setRoot` swaps the filesystem tree (used when merging a persisted
 *    delta on load). The new tree must be a fresh instance; we don't
 *    deep-clone here so callers can pass a tree they already own.
 */

import { reactive } from 'vue'
import { createDefaultTree } from '../fs'
import { DEFAULT_ENV } from './prompt'
import type { FSNode } from '../types'

export interface ShellState {
  cwd: string
  history: string[]
  historyIndex: number
  env: Record<string, string>
  root: FSNode
}

export interface ShellStateHandle {
  state: ShellState
  setcwd(path: string): void
  setenv(key: string, value: string): void
  pushHistory(cmd: string): void
  /** Reset the history navigation cursor (after executing a command). */
  resetHistoryCursor(): void
  /** Replace the root tree (used when merging persisted delta). */
  setRoot(root: FSNode): void
}

export function createShellState(initial?: Partial<ShellState>): ShellStateHandle {
  const state = reactive<ShellState>({
    cwd: initial?.cwd ?? initial?.env?.HOME ?? DEFAULT_ENV.HOME,
    history: initial?.history ? [...initial.history] : [],
    historyIndex: -1,
    env: { ...DEFAULT_ENV, ...(initial?.env ?? {}) },
    root: initial?.root ?? createDefaultTree(),
  })

  return {
    state,

    setcwd(path) {
      state.cwd = path
    },

    setenv(key, value) {
      state.env[key] = value
    },

    pushHistory(cmd) {
      const trimmed = cmd.trim()
      if (!trimmed) return
      // Skip consecutive duplicates
      if (state.history[state.history.length - 1] === trimmed) return
      state.history.push(trimmed)
      // Cap at 500 entries to bound memory
      if (state.history.length > 500) {
        state.history.splice(0, state.history.length - 500)
      }
    },

    resetHistoryCursor() {
      state.historyIndex = -1
    },

    setRoot(root) {
      state.root = root
    },
  }
}
