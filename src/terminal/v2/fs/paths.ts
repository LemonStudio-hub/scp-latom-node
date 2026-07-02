/**
 * Path resolution utilities for the virtual filesystem.
 *
 * Supports `~` expansion against an optional home directory, `.`/`..`
 * normalization, and absolute/relative resolution against a cwd.
 * All functions are pure — they neither read nor mutate FSNode trees
 * except `resolve`, which walks a tree read-only.
 */

import type { FSNode } from '../types'

/** Normalize `.`/`..` segments and collapse redundant slashes. */
export function normalize(path: string): string {
  const parts = path.split('/').filter(Boolean)
  const resolved: string[] = []
  for (const part of parts) {
    if (part === '.') continue
    if (part === '..') {
      resolved.pop()
      continue
    }
    resolved.push(part)
  }
  return '/' + resolved.join('/')
}

/** Return the canonical absolute path string for `target` under `cwd`. */
export function resolveAbsolute(cwd: string, target: string, home?: string): string {
  let expanded = target
  if (home && target.startsWith('~')) {
    expanded = target === '~' ? home : home + target.slice(1)
  }
  const startFromRoot = expanded.startsWith('/')
  const parts = startFromRoot
    ? expanded.split('/').filter(Boolean)
    : [...cwd.split('/').filter(Boolean), ...expanded.split('/').filter(Boolean)]
  return normalize('/' + parts.join('/'))
}

/** Split an absolute path into parent path + leaf name. */
export function splitPath(path: string): { parent: string; name: string } {
  const trimmed = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path
  const lastSlash = trimmed.lastIndexOf('/')
  if (lastSlash <= 0) return { parent: '/', name: trimmed.slice(1) }
  return { parent: trimmed.slice(0, lastSlash), name: trimmed.slice(lastSlash + 1) }
}

/**
 * Resolve `target` relative to `cwd`, walking `root`. Returns null if
 * any path component is missing or passes through a file as a directory.
 */
export function resolve(root: FSNode, cwd: string, target: string, home?: string): FSNode | null {
  const absolute = resolveAbsolute(cwd, target, home)
  const parts = absolute.split('/').filter(Boolean)

  let current: FSNode = root
  for (const part of parts) {
    if (current.type !== 'dir' || !current.children) return null
    const child = current.children.get(part)
    if (!child) return null
    current = child
  }
  return current
}
