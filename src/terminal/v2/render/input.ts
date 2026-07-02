/**
 * Input line controller.
 *
 * Owns the inline input buffer and cursor. Replaces the legacy
 * bootstrap.ts approach of hand-emulating cursor movement with
 * \x1b[C/D escape codes on the xterm instance.
 *
 * The controller is pure logic — it does NOT render anything. The
 * session (or a Vue component) reads `buffer` and `cursorPos`
 * (both reactive refs) to paint the input line.
 *
 * Supported keys:
 *  - Printable chars        → insert at cursor
 *  - Backspace              → delete before cursor
 *  - Delete                 → delete at cursor
 *  - ArrowLeft/Right        → move cursor
 *  - Home/End (Ctrl+A/E)    → jump to start/end
 *  - Ctrl+U                 → clear line before cursor
 *  - Ctrl+W                 → delete word before cursor
 *  - Enter                  → submit (onCommand)
 *  - Tab                    → complete (onComplete)
 *  - ArrowUp/Down           → history navigation
 *  - Ctrl+C                 → interrupt (onInterrupt)
 *  - Ctrl+L                 → clear screen (onClear)
 */

import { ref, type Ref } from 'vue'

export interface InputControllerOptions {
  /** Called when the user submits a full command line (Enter). */
  onCommand: (input: string) => void | Promise<void>
  /** Called for Tab completion; should return candidates synchronously. */
  onComplete: (input: string) => string[]
  /** Called when multiple completions are available — the session displays them. */
  onShowCompletions?: (completions: string[]) => void
  /** Called for Up/Down history navigation. */
  onHistoryPrev: () => string | null
  onHistoryNext: () => string | null
  /** Called when the user requests a screen clear (Ctrl+L). */
  onClear: () => void
  /** Called when the user interrupts (Ctrl+C). */
  onInterrupt: () => void
}

export interface InputController {
  /** Current input buffer (reactive). */
  readonly buffer: Ref<string>
  /** Current cursor position within the buffer (reactive). */
  readonly cursorPos: Ref<number>
  /** Feed a raw key event into the controller. Returns true if handled. */
  handleKey(ev: KeyboardEvent): boolean
  /** Replace the buffer externally (e.g. history navigation, completion). */
  setBuffer(value: string, cursorAt?: number): void
  /** Reset to an empty buffer (after command submission or interrupt). */
  reset(): void
  /** Release any DOM listeners. */
  dispose(): void
}

export function createInputController(options: InputControllerOptions): InputController {
  const buffer = ref('')
  const cursorPos = ref(0)

  /** Insert text at the cursor position. */
  function insert(text: string): void {
    const before = buffer.value.slice(0, cursorPos.value)
    const after = buffer.value.slice(cursorPos.value)
    buffer.value = before + text + after
    cursorPos.value += text.length
  }

  /** Delete the character before the cursor (Backspace). */
  function backspace(): void {
    if (cursorPos.value <= 0) return
    const before = buffer.value.slice(0, cursorPos.value - 1)
    const after = buffer.value.slice(cursorPos.value)
    buffer.value = before + after
    cursorPos.value--
  }

  /** Delete the character at the cursor (Delete). */
  function deleteForward(): void {
    if (cursorPos.value >= buffer.value.length) return
    const before = buffer.value.slice(0, cursorPos.value)
    const after = buffer.value.slice(cursorPos.value + 1)
    buffer.value = before + after
  }

  /** Move cursor to an absolute position within the buffer. */
  function moveCursorTo(pos: number): void {
    cursorPos.value = Math.max(0, Math.min(pos, buffer.value.length))
  }

  /** Clear the line from start to cursor (Ctrl+U). */
  function clearBeforeCursor(): void {
    const after = buffer.value.slice(cursorPos.value)
    buffer.value = after
    cursorPos.value = 0
  }

  /** Delete the word before the cursor (Ctrl+W). */
  function deleteWordBeforeCursor(): void {
    const before = buffer.value.slice(0, cursorPos.value)
    const trimmed = before.trimEnd()
    const lastSpace = trimmed.lastIndexOf(' ')
    const newBefore = lastSpace >= 0 ? trimmed.slice(0, lastSpace + 1) : ''
    const removed = before.length - newBefore.length
    if (removed === 0) return
    const after = buffer.value.slice(cursorPos.value)
    buffer.value = newBefore + after
    cursorPos.value -= removed
  }

  /** Apply a single Tab completion. */
  function applyCompletion(): void {
    const textBeforeCursor = buffer.value.slice(0, cursorPos.value)
    const completions = options.onComplete(textBeforeCursor)
    if (completions.length === 0) return

    if (completions.length === 1) {
      const completed = completions[0]
      const parts = textBeforeCursor.trimStart().split(/\s+/)
      const isFirstWord = parts.length <= 1
      const lastSpace = textBeforeCursor.lastIndexOf(' ')

      if (isFirstWord || lastSpace < 0) {
        // Replace the whole input up to cursor with the completed command
        const afterCursor = buffer.value.slice(cursorPos.value)
        buffer.value = completed + ' ' + afterCursor
        cursorPos.value = completed.length + 1
      } else {
        // Replace only the last token
        const prefix = textBeforeCursor.slice(0, lastSpace + 1)
        const afterCursor = buffer.value.slice(cursorPos.value)
        buffer.value = prefix + completed + afterCursor
        cursorPos.value = (prefix + completed).length
      }
    } else if (completions.length > 1 && options.onShowCompletions) {
      options.onShowCompletions(completions)
    }
  }

  function handleKey(ev: KeyboardEvent): boolean {
    const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey

    // Ctrl+C — interrupt
    if (ev.ctrlKey && ev.key === 'c') {
      ev.preventDefault()
      options.onInterrupt()
      reset()
      return true
    }

    // Ctrl+L — clear screen
    if (ev.ctrlKey && ev.key === 'l') {
      ev.preventDefault()
      options.onClear()
      return true
    }

    // Ctrl+A — move to beginning
    if (ev.ctrlKey && ev.key === 'a') {
      ev.preventDefault()
      moveCursorTo(0)
      return true
    }

    // Ctrl+E — move to end
    if (ev.ctrlKey && ev.key === 'e') {
      ev.preventDefault()
      moveCursorTo(buffer.value.length)
      return true
    }

    // Ctrl+U — clear line before cursor
    if (ev.ctrlKey && ev.key === 'u') {
      ev.preventDefault()
      clearBeforeCursor()
      return true
    }

    // Ctrl+W — delete word before cursor
    if (ev.ctrlKey && ev.key === 'w') {
      ev.preventDefault()
      deleteWordBeforeCursor()
      return true
    }

    // Enter — submit
    if (ev.key === 'Enter') {
      ev.preventDefault()
      const input = buffer.value
      // Reset synchronously so the caller sees an empty buffer
      buffer.value = ''
      cursorPos.value = 0
      void options.onCommand(input)
      return true
    }

    // Backspace
    if (ev.key === 'Backspace') {
      ev.preventDefault()
      backspace()
      return true
    }

    // Delete (forward)
    if (ev.key === 'Delete') {
      ev.preventDefault()
      deleteForward()
      return true
    }

    // Tab — completion
    if (ev.key === 'Tab') {
      ev.preventDefault()
      applyCompletion()
      return true
    }

    // ArrowUp — history previous
    if (ev.key === 'ArrowUp') {
      ev.preventDefault()
      const prev = options.onHistoryPrev()
      if (prev !== null) {
        buffer.value = prev
        cursorPos.value = prev.length
      }
      return true
    }

    // ArrowDown — history next
    if (ev.key === 'ArrowDown') {
      ev.preventDefault()
      const next = options.onHistoryNext()
      if (next !== null) {
        buffer.value = next
        cursorPos.value = next.length
      }
      return true
    }

    // ArrowLeft — move cursor left
    if (ev.key === 'ArrowLeft') {
      ev.preventDefault()
      if (cursorPos.value > 0) cursorPos.value--
      return true
    }

    // ArrowRight — move cursor right
    if (ev.key === 'ArrowRight') {
      ev.preventDefault()
      if (cursorPos.value < buffer.value.length) cursorPos.value++
      return true
    }

    // Home — move to beginning
    if (ev.key === 'Home') {
      ev.preventDefault()
      moveCursorTo(0)
      return true
    }

    // End — move to end
    if (ev.key === 'End') {
      ev.preventDefault()
      moveCursorTo(buffer.value.length)
      return true
    }

    // Regular printable character — insert at cursor
    if (printable && ev.key.length === 1) {
      ev.preventDefault()
      insert(ev.key)
      return true
    }

    return false
  }

  function setBuffer(value: string, cursorAt?: number): void {
    buffer.value = value
    cursorPos.value = cursorAt ?? value.length
  }

  function reset(): void {
    buffer.value = ''
    cursorPos.value = 0
  }

  function dispose(): void {
    // No DOM listeners to clean up — the session owns keyboard routing.
  }

  return {
    buffer,
    cursorPos,
    handleKey,
    setBuffer,
    reset,
    dispose,
  }
}
