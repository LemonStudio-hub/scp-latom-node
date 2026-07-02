/**
 * FSNode constructors.
 *
 * Pure factory helpers — no validation, no side effects. Callers own
 * mutation and protection policy.
 */

import type { FSNode } from '../types'

export function file(name: string, content: string): FSNode {
  return { type: 'file', name, content }
}

export function dir(name: string, children: FSNode[] = []): FSNode {
  const map = new Map<string, FSNode>()
  for (const child of children) {
    map.set(child.name, child)
  }
  return { type: 'dir', name, children: map }
}
