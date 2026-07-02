/**
 * Virtual filesystem barrel — re-exports the public FS API.
 *
 * Phase 0: type contracts + signatures only.
 */

export type { FSNode } from '../types'
export { file, dir } from './node'
export { resolve, resolveAbsolute, splitPath, normalize } from './paths'
export { mkdir, mkfile, remove, write, deepClone } from './operations'
export { isProtected, PROTECTED_PATHS } from './protect'
export { createDefaultTree } from './tree'
export { serialize, deserialize, computeDelta, mergeDelta } from './delta'
