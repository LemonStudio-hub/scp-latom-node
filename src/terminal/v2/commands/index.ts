/**
 * Commands barrel — re-exports the registry, parser, and builtin loaders.
 *
 * Phase 0: contracts only.
 */

export type { CommandContext, CommandHandler, CommandDef, CommandOutput } from './types'
export { CommandRegistry } from './registry'
export { splitPipes, parseArgs } from './parse'
export { registerAllBuiltin } from './builtin'
