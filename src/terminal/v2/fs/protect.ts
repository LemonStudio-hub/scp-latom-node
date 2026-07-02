/**
 * Protected-path policy.
 *
 * System directories holding default SCP content are read-only to user
 * commands. The shell layer consults `isProtected` before applying
 * mutations derived from user input.
 */

/** Top-level paths that cannot be modified by user commands. */
export const PROTECTED_PATHS: ReadonlySet<string> = new Set([
  '/etc',
  '/scp',
  '/documents',
  '/opt',
  '/var',
  '/proc',
  '/mnt',
])

/** True if `path` is, or sits beneath, a protected system directory. */
export function isProtected(path: string): boolean {
  const normalized = path.startsWith('/') ? path : '/' + path
  for (const protectedPath of PROTECTED_PATHS) {
    if (normalized === protectedPath || normalized.startsWith(protectedPath + '/')) {
      return true
    }
  }
  return false
}
