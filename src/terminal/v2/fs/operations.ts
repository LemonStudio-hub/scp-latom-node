/**
 * Pure-data filesystem mutation helpers.
 *
 * These operate on FSNode trees directly: insert/remove/overwrite
 * children, deep-clone subtrees. Path resolution and protection
 * enforcement happen in the shell layer via FsOperations; these
 * primitives assume the caller has already validated the target.
 */

import type { FSNode } from '../types'

/** Create a directory inside `parent`. Returns the new node, or null if it exists. */
export function mkdir(parent: FSNode, name: string): FSNode | null {
  if (parent.type !== 'dir' || !parent.children) return null
  if (parent.children.has(name)) return null
  const node: FSNode = { type: 'dir', name, children: new Map() }
  parent.children.set(name, node)
  return node
}

/** Create a file inside `parent`. Returns the new node, or null if it exists. */
export function mkfile(parent: FSNode, name: string, content = ''): FSNode | null {
  if (parent.type !== 'dir' || !parent.children) return null
  if (parent.children.has(name)) return null
  const node: FSNode = { type: 'file', name, content }
  parent.children.set(name, node)
  return node
}

/** Remove a child node by name. Returns true if removed, false if not found. */
export function remove(parent: FSNode, name: string): boolean {
  if (parent.type !== 'dir' || !parent.children) return false
  return parent.children.delete(name)
}

/** Overwrite content on an existing file node. Returns false if not a file. */
export function write(node: FSNode, content: string): boolean {
  if (node.type !== 'file') return false
  node.content = content
  return true
}

/** Deep-clone an FSNode subtree (new Map instances at every level). */
export function deepClone(node: FSNode): FSNode {
  if (node.type === 'file') {
    return { type: 'file', name: node.name, content: node.content }
  }
  const children = new Map<string, FSNode>()
  if (node.children) {
    for (const [key, child] of node.children) {
      children.set(key, deepClone(child))
    }
  }
  return { type: 'dir', name: node.name, children }
}
