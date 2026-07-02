/**
 * Command type contracts. Phase 0: signatures only.
 *
 * Key design: handlers may be async (return Promise) and may stream
 * output via ctx.stdout. The registry awaits async results; the render
 * layer wires ctx.stdout to the terminal during execution.
 */

import type { FSNode, FsOperations } from '../types'

export interface CommandContext {
  args: string[]
  cwd: string
  root: FSNode
  history: string[]
  env: Record<string, string>
  /** Lines from the upstream command in a pipe chain. */
  stdin?: string[]
  /** Filesystem mutation surface (shell-layer implementation). */
  fs: FsOperations
  setcwd: (path: string) => void
  setenv: (key: string, value: string) => void
  clear: () => void
  /** Signal that the filesystem was mutated (triggers persistence). */
  onMutate: () => void
  /** Optional streaming sink. When present, handlers may call it incrementally. */
  stdout?: (chunk: string) => void
}

export type CommandOutput = string | string[] | void
export type CommandHandler = (ctx: CommandContext) => CommandOutput | Promise<CommandOutput>

export interface CommandDef {
  name: string
  description: string
  usage: string
  handler: CommandHandler
}
