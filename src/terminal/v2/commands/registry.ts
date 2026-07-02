/**
 * Command registry.
 *
 * Holds command definitions, dispatches input (with pipe support and
 * async handlers), and provides tab-completion candidates.
 *
 * Key changes vs. legacy engine:
 *  - `execute` is async: each segment's handler is awaited, so commands
 *    may return Promises and stream via ctx.stdout.
 *  - Pipe stdin flows forward across awaited segments.
 *  - Completion lives on the registry rather than a free function, so
 *    it reads the registered command set directly.
 */

import type { FSNode } from '../types'
import type { CommandContext, CommandDef } from './types'
import { splitPipes, parseArgs } from './parse'
import { resolve } from '../fs'

export class CommandRegistry {
  private commands = new Map<string, CommandDef>()

  register(def: CommandDef): void {
    this.commands.set(def.name, def)
  }

  get(name: string): CommandDef | undefined {
    return this.commands.get(name)
  }

  names(): string[] {
    return [...this.commands.keys()]
  }

  /**
   * Execute a full input line (may contain pipes). Each segment's output
   * feeds the next as stdin. Async handlers are awaited. Returns the
   * final segment's output lines (empty array if no output).
   */
  async execute(input: string, ctx: Omit<CommandContext, 'args'>): Promise<string[]> {
    const trimmed = input.trim()
    if (!trimmed) return []

    const segments = splitPipes(trimmed)
    if (segments.length === 0) return []

    let pipeStdin: string[] | undefined

    for (const segment of segments) {
      const parts = parseArgs(segment.trim())
      if (parts.length === 0) continue

      const cmdName = parts[0]
      const args = parts.slice(1)

      const cmd = this.commands.get(cmdName)
      if (!cmd) {
        return [`scf-bash: ${cmdName}: command not found`]
      }

      try {
        const result = await cmd.handler({ ...ctx, args, stdin: pipeStdin })
        pipeStdin = Array.isArray(result) ? result : typeof result === 'string' ? [result] : []
      } catch (e) {
        return [`${cmdName}: internal error: ${e instanceof Error ? e.message : 'unknown'}`]
      }
    }

    return pipeStdin ?? []
  }

  /**
   * Tab-completion candidates for a partial input line.
   * First token completes against command names; subsequent tokens
   * complete against filesystem paths under the resolved directory.
   */
  complete(input: string, cwd: string, root: FSNode, home?: string): string[] {
    const trimmed = input.trimStart()
    const parts = trimmed.split(/\s+/)

    if (parts.length <= 1) {
      const partial = parts[0] || ''
      return this.names().filter((c) => c.startsWith(partial))
    }

    const partial = parts[parts.length - 1]
    const lastSlash = partial.lastIndexOf('/')
    let dirPath: string
    let prefix: string

    if (lastSlash >= 0) {
      dirPath = partial.slice(0, lastSlash) || '/'
      prefix = partial.slice(lastSlash + 1)
    } else {
      dirPath = '.'
      prefix = partial
    }

    const dirNode = resolve(root, cwd, dirPath, home)
    if (!dirNode || dirNode.type !== 'dir' || !dirNode.children) return []

    const candidates: string[] = []
    for (const [name, child] of dirNode.children) {
      if (name.startsWith(prefix)) {
        const suffix = child.type === 'dir' ? '/' : ''
        if (lastSlash >= 0) {
          candidates.push(dirPath === '/' ? `/${name}${suffix}` : `${dirPath}/${name}${suffix}`)
        } else {
          candidates.push(`${name}${suffix}`)
        }
      }
    }

    return candidates
  }
}
