/**
 * Terminal theme definitions.
 *
 * Color sets for the SCP-themed terminal, paired with the design
 * system's gold/amber accent. The 16-color palette is used by the
 * headless VT core for SGR color codes; the DOM painter reads the
 * same palette when converting cells to colored spans.
 */

import type { ThemeMode } from '../types'

export interface TerminalTheme {
  background: string
  foreground: string
  cursor: string
  cursorAccent: string
  selectionBackground: string
  selectionForeground: string
  black: string
  red: string
  green: string
  yellow: string
  blue: string
  magenta: string
  cyan: string
  white: string
  brightBlack: string
  brightRed: string
  brightGreen: string
  brightYellow: string
  brightBlue: string
  brightMagenta: string
  brightCyan: string
  brightWhite: string
}

export function darkTheme(): TerminalTheme {
  return {
    background: '#0c0c14',
    foreground: '#d4d4e0',
    cursor: '#c9a44a',
    cursorAccent: '#0c0c14',
    selectionBackground: '#c9a44a28',
    selectionForeground: '#e8e8ec',
    black: '#0c0c14',
    red: '#f87171',
    green: '#4ade80',
    yellow: '#fbbf24',
    blue: '#60a5fa',
    magenta: '#c084fc',
    cyan: '#22d3ee',
    white: '#d4d4e0',
    brightBlack: '#6b6b82',
    brightRed: '#fca5a5',
    brightGreen: '#86efac',
    brightYellow: '#fde68a',
    brightBlue: '#93bbfd',
    brightMagenta: '#d8b4fe',
    brightCyan: '#67e8f9',
    brightWhite: '#f0f0f8',
  }
}

export function lightTheme(): TerminalTheme {
  return {
    background: '#f6f6fc',
    foreground: '#2a2a3e',
    cursor: '#a8842a',
    cursorAccent: '#f6f6fc',
    selectionBackground: '#a8842a1a',
    selectionForeground: '#1a1a2e',
    black: '#1a1a2e',
    red: '#dc2626',
    green: '#16a34a',
    yellow: '#ca8a04',
    blue: '#2563eb',
    magenta: '#9333ea',
    cyan: '#0891b2',
    white: '#f6f6fc',
    brightBlack: '#7a7a92',
    brightRed: '#ef4444',
    brightGreen: '#22c55e',
    brightYellow: '#eab308',
    brightBlue: '#3b82f6',
    brightMagenta: '#a855f7',
    brightCyan: '#06b6d4',
    brightWhite: '#ffffff',
  }
}

export function themeFor(mode: ThemeMode): TerminalTheme {
  return mode === 'dark' ? darkTheme() : lightTheme()
}

/** Palette indices 0-15 in display order, for cell color lookup. */
export function paletteColors(theme: TerminalTheme): string[] {
  return [
    theme.black,
    theme.red,
    theme.green,
    theme.yellow,
    theme.blue,
    theme.magenta,
    theme.cyan,
    theme.white,
    theme.brightBlack,
    theme.brightRed,
    theme.brightGreen,
    theme.brightYellow,
    theme.brightBlue,
    theme.brightMagenta,
    theme.brightCyan,
    theme.brightWhite,
  ]
}
