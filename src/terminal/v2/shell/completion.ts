/**
 * Tab completion.
 *
 * Thin wrapper over `CommandRegistry.complete` that reads the current
 * shell state. Kept as a free function (rather than only a method on
 * the registry) so the input controller can call it with the live state
 * without needing a reference to the registry's internal completion
 * logic.
 */

import type { FSNode } from '../types'
import type { CommandRegistry } from '../commands/registry'

export function getCompletions(
  input: string,
  cwd: string,
  root: FSNode,
  registry: CommandRegistry,
  home?: string,
): string[] {
  return registry.complete(input, cwd, root, home)
}
