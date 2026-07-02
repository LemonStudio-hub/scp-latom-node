/**
 * History navigation.
 *
 * Tracks a cursor over the history array for Up/Down arrow navigation.
 * The cursor is a "virtual" index: -1 means "not navigating" (the user
 * is editing fresh input); 0..n-1 points at a real entry. Pressing Up
 * moves toward older entries (higher index in the array's storage, but
 * we treat the last element as the newest and walk backwards).
 *
 * Convention (matches the legacy shell.ts):
 *  - prev() returns the previous (older) entry, or null at the top.
 *  - next() returns the next (newer) entry, or '' at the bottom (fresh).
 *  - reset() returns to the "not navigating" state.
 */

export interface HistoryNavigator {
  /** Move to the previous (older) entry. Returns null at the top. */
  prev(): string | null
  /** Move to the next (newer) entry. Returns '' at the bottom (fresh input). */
  next(): string | null
  /** Reset cursor so the next prev() yields the latest entry. */
  reset(): void
}

export function createHistoryNavigator(history: string[]): HistoryNavigator {
  let cursor = -1

  return {
    prev() {
      if (history.length === 0) return null
      if (cursor === -1) {
        cursor = history.length - 1
      } else if (cursor > 0) {
        cursor--
      } else {
        // already at the oldest entry
        return history[cursor] ?? null
      }
      return history[cursor] ?? null
    },

    next() {
      if (cursor === -1) return null
      if (cursor < history.length - 1) {
        cursor++
        return history[cursor]
      }
      // fell off the bottom — back to fresh input
      cursor = -1
      return ''
    },

    reset() {
      cursor = -1
    },
  }
}
