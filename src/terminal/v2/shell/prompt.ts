/**
 * Prompt rendering.
 *
 * Produces the ANSI-decorated prompt string, e.g.
 * `researcher@LATOM-7:~$ ` with color escapes. The home directory is
 * abbreviated to `~` (matching common shell behavior) so the prompt
 * stays short when the user is in their home.
 */

import type { ShellState } from './state'

/** Default environment values for a fresh shell. */
export const DEFAULT_ENV: Readonly<Record<string, string>> = {
  USER: 'researcher',
  HOME: '/home/researcher',
  HOSTNAME: 'LATOM-7',
  SHELL: '/bin/bash',
  TERM: 'xterm-256color',
  PATH: '/usr/local/bin:/usr/bin:/bin:/opt/scf/bin',
  LANG: 'en_US.UTF-8',
  PS1: '\\u@\\h:\\w\\$ ',
  EDITOR: 'vim',
  OLDPWD: '/home/researcher',
}

/** Abbreviate the home directory in a path to `~` for display. */
function displayDir(cwd: string, home: string): string {
  if (cwd === home) return '~'
  if (cwd.startsWith(home + '/')) return '~' + cwd.slice(home.length)
  return cwd
}

export function buildPrompt(state: ShellState): string {
  const user = state.env.USER ?? 'researcher'
  const host = state.env.HOSTNAME ?? 'LATOM-7'
  const home = state.env.HOME ?? '/home/researcher'
  const dir = displayDir(state.cwd, home)
  return `\x1b[1;32m${user}\x1b[0m@\x1b[1;34m${host}\x1b[0m:\x1b[1;36m${dir}\x1b[0m$ `
}
