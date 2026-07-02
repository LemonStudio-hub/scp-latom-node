/**
 * Shell layer barrel. Phase 0: contracts only.
 */

export type { ShellState, ShellStateHandle } from './state'
export { createShellState } from './state'
export { buildPrompt, DEFAULT_ENV } from './prompt'
export type { HistoryNavigator } from './history'
export { createHistoryNavigator } from './history'
export { getCompletions } from './completion'
