/**
 * Cross-layer shared types for the rewritten SCP Foundation terminal.
 *
 * Phase 0: type contracts only. Implementations land in later phases.
 */

// ── Virtual Filesystem ──

export interface FSNode {
  type: 'file' | 'dir'
  name: string
  content?: string
  children?: Map<string, FSNode>
}

/** Serialized form of an FSNode subtree, JSON-compatible for persistence. */
export interface SerializedFSDelta {
  [name: string]: {
    type: 'file' | 'dir'
    content?: string
    children?: SerializedFSDelta
    deleted?: boolean
  }
}

// ── Persistence ──

export interface PersistedState {
  cwd: string
  history: string[]
  env: Record<string, string>
  filesystemDelta: SerializedFSDelta
}

// ── Rendering ──

export type ThemeMode = 'dark' | 'light'

// ── Filesystem operations injected into command context ──

/**
 * Mutation surface exposed to commands. The shell layer provides the
 * implementation (resolving paths against cwd, enforcing protection,
 * triggering persistence); commands stay pure data callers.
 */
export interface FsOperations {
  mkdir(path: string): string | null
  rm(path: string): string | null
  touch(path: string): string | null
  copy(src: string, dest: string): string | null
  move(src: string, dest: string): string | null
  rmrf(path: string): string | null
  writeFile(path: string, content: string): string | null
  appendFile(path: string, content: string): string | null
}
