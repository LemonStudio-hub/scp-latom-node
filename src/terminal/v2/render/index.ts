/**
 * Render layer barrel.
 *
 * Stack: @xterm/headless drives VT emulation; a DOM painter renders rows
 * as <div> lines with colored <span>s; the input controller owns the
 * inline edit line with a blinking block cursor.
 */

export type { TerminalTheme } from './theme'
export { darkTheme, lightTheme, themeFor, paletteColors } from './theme'
export type { TerminalRenderer, RendererOptions } from './renderer'
export { createRenderer } from './renderer'
export type { InputController, InputControllerOptions } from './input'
export { createInputController } from './input'
export type { TerminalSession, SessionOptions } from './lifecycle'
export { createSession } from './lifecycle'
