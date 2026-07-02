/**
 * Built-in command registration modules.
 *
 * Each module registers its commands into a passed registry. The full
 * command set (~60 commands) matches the legacy implementation:
 *   - core.ts        → help, clear, pwd, whoami, hostname, date, echo,
 *                      uname, history, env, export, exit
 *   - filesystem.ts  → ls, cd, cat, tree, head, tail, mkdir, rm, touch,
 *                      cp, mv, write, append, grep, find
 *   - system.ts      → neofetch, uptime, id, groups, tty, true, false,
 *                      who, last, ps, free, df, du, stat, file, which,
 *                      type, man, alias, unalias
 *   - text.ts        → wc, sort, uniq, diff, rev, nl, tr, cut, fmt,
 *                      fold, strings, yes, tee, seq
 *   - scp.ts         → scp, about, matrix, classify, clearance, incident,
 *                      protocol, status, audit, alert, staff
 */

import type { CommandRegistry } from '../registry'
import { registerCoreCommands } from './core'
import { registerFilesystemCommands } from './filesystem'
import { registerSystemCommands } from './system'
import { registerTextCommands } from './text'
import { registerScpCommands } from './scp'

export {
  registerCoreCommands,
  registerFilesystemCommands,
  registerSystemCommands,
  registerTextCommands,
  registerScpCommands,
}

/** Register all built-in commands onto a registry. */
export function registerAllBuiltin(registry: CommandRegistry): void {
  registerCoreCommands(registry)
  registerFilesystemCommands(registry)
  registerSystemCommands(registry)
  registerTextCommands(registry)
  registerScpCommands(registry)
}
