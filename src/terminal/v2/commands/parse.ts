/**
 * Input parsing utilities.
 *
 * Quoting ("..." and '...') is respected: quoted pipes stay literal,
 * quoted spaces don't split tokens. Quotes are stripped from the final
 * tokens, matching common shell behavior.
 */

/** Split an input line on unquoted `|` characters. */
export function splitPipes(input: string): string[] {
  const segments: string[] = []
  let current = ''
  let inQuote: string | null = null

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (inQuote) {
      if (ch === inQuote) inQuote = null
      current += ch
    } else if (ch === '"' || ch === "'") {
      inQuote = ch
      current += ch
    } else if (ch === '|') {
      segments.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) segments.push(current)

  return segments
}

/** Tokenize a single command segment, respecting quotes (stripped from output). */
export function parseArgs(segment: string): string[] {
  const parts: string[] = []
  let current = ''
  let inQuote: string | null = null

  for (let i = 0; i < segment.length; i++) {
    const ch = segment[i]
    if (inQuote) {
      if (ch === inQuote) {
        inQuote = null
      } else {
        current += ch
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = ch
    } else if (ch === ' ') {
      if (current) {
        parts.push(current)
        current = ''
      }
    } else {
      current += ch
    }
  }
  if (current) parts.push(current)
  return parts
}
