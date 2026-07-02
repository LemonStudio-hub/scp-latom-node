/**
 * Filesystem delta serialization.
 *
 * Deltas capture user additions/modifications/deletions relative to the
 * default tree, enabling compact persistence of user filesystem state.
 * The delta shape is JSON-compatible so it can round-trip through
 * OPFS / IndexedDB without custom codecs.
 */

import type { FSNode, SerializedFSDelta } from '../types'
import { deepClone } from './operations'

/** Serialize an FSNode subtree to a JSON-compatible structure. */
export function serialize(node: FSNode): SerializedFSDelta[string] {
  if (node.type === 'file') {
    return { type: 'file', content: node.content ?? '' }
  }
  const children: SerializedFSDelta = {}
  if (node.children) {
    for (const [name, child] of node.children) {
      children[name] = serialize(child)
    }
  }
  return { type: 'dir', children }
}

/** Reconstruct an FSNode subtree from its serialized form. */
export function deserialize(name: string, data: SerializedFSDelta[string]): FSNode {
  if (data.type === 'file') {
    return { type: 'file', name, content: data.content ?? '' }
  }
  const map = new Map<string, FSNode>()
  if (data.children) {
    for (const [childName, childData] of Object.entries(data.children)) {
      map.set(childName, deserialize(childName, childData))
    }
  }
  return { type: 'dir', name, children: map }
}

/**
 * Compute the delta from `current` against `baseline` (the default tree).
 * Only includes user-added, user-modified, or user-deleted nodes.
 */
export function computeDelta(current: FSNode, baseline: FSNode): SerializedFSDelta {
  const delta: SerializedFSDelta = {}
  if (!current.children || !baseline.children) return delta

  // Added or modified nodes
  for (const [name, currentNode] of current.children) {
    const baselineNode = baseline.children.get(name)
    if (!baselineNode) {
      // User-added — serialize entirely
      delta[name] = serialize(currentNode)
    } else if (currentNode.type === 'file' && baselineNode.type === 'file') {
      if (currentNode.content !== baselineNode.content) {
        delta[name] = { type: 'file', content: currentNode.content ?? '' }
      }
    } else if (currentNode.type === 'dir' && baselineNode.type === 'dir') {
      const childDelta = computeDelta(currentNode, baselineNode)
      if (Object.keys(childDelta).length > 0) {
        delta[name] = { type: 'dir', children: childDelta }
      }
    } else if (currentNode.type !== baselineNode.type) {
      // Type mismatch (file↔dir) — treat as modification
      delta[name] = serialize(currentNode)
    }
  }

  // Deleted nodes (in baseline but not in current)
  for (const [name] of baseline.children) {
    if (!current.children.has(name)) {
      delta[name] = { type: 'dir', deleted: true }
    }
  }

  return delta
}

/** Apply a serialized delta onto a baseline tree, returning a new tree. */
export function mergeDelta(baseline: FSNode, delta: SerializedFSDelta): FSNode {
  const cloned = deepClone(baseline)
  if (!cloned.children) return cloned

  for (const [name, entry] of Object.entries(delta)) {
    if (entry.deleted) {
      cloned.children.delete(name)
    } else if (entry.type === 'file') {
      cloned.children.set(name, { type: 'file', name, content: entry.content ?? '' })
    } else if (entry.type === 'dir') {
      const existing = cloned.children.get(name)
      if (existing && existing.type === 'dir' && entry.children) {
        cloned.children.set(name, mergeDelta(existing, entry.children))
      } else {
        cloned.children.set(name, deserialize(name, entry))
      }
    }
  }

  return cloned
}
