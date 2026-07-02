/**
 * Terminal lifecycle orchestration.
 *
 * Wires renderer + input controller + shell state + command execution
 * into a single mountable session. Owns the full-screen overlay
 * lifecycle previously handled by useTerminal.ts.
 *
 * DOM layout (created inside the container):
 *   <div class="scp-terminal">            (focusable, tabindex=0)
 *     <div class="scp-term-output">       (renderer's scrollback area)
 *       ... painted lines ...
 *     </div>
 *     <div class="scp-term-input-line">   (reactive input line)
 *       <span class="prompt">...</span>
 *       <span class="before-cursor">...</span>
 *       <span class="cursor"> </span>     (blinking block)
 *       <span class="after-cursor">...</span>
 *     </div>
 *   </div>
 *
 * The input line is reactively rendered via `watchEffect` — when the
 * InputController's buffer/cursorPos change, or the shell state's cwd
 * changes, the DOM updates automatically.
 */

import { watchEffect } from 'vue'
import type { ThemeMode, FsOperations, FSNode } from '../types'
import { createRenderer, type TerminalRenderer } from './renderer'
import { createInputController, type InputController } from './input'
import { darkTheme, lightTheme } from './theme'
import { createShellState, type ShellStateHandle } from '../shell/state'
import { buildPrompt } from '../shell/prompt'
import { createHistoryNavigator, type HistoryNavigator } from '../shell/history'
import { getCompletions } from '../shell/completion'
import { CommandRegistry } from '../commands/registry'
import { registerAllBuiltin } from '../commands/builtin'
import type { CommandContext } from '../commands/types'
import {
  resolve,
  resolveAbsolute,
  mkdir as fsMkdir,
  mkfile as fsMkfile,
  remove as fsRemove,
  write as fsWrite,
  deepClone as fsDeepClone,
  isProtected,
} from '../fs'

export interface SessionOptions {
  container: HTMLElement
  theme: ThemeMode
  /** Called when the user types 'exit'. */
  onExit?: () => void
  /** Called when shell state is mutated (for persistence triggering). */
  onMutate?: () => void
  /** Pre-created shell state (for restoring from persistence). */
  shellState?: ShellStateHandle
}

export interface TerminalSession {
  /** Start the session (mount renderer, focus input, draw MOTD + prompt). */
  start(): Promise<void>
  /** Persist state and tear down renderer + listeners. */
  stop(): Promise<void>
  /** Switch theme at runtime. */
  setTheme(mode: ThemeMode): void
  /** Recompute cols/rows from the container size and repaint (e.g. on resize). */
  fit(): void
  /** Whether the session is currently active. */
  readonly active: boolean
}

/** Build an FsOperations implementation backed by the shell state's root tree. */
function createFsOperations(stateHandle: ShellStateHandle, onMutate: () => void): FsOperations {
  const { state } = stateHandle

  function resolveForMutation(target: string) {
    const abs = resolveAbsolute(state.cwd, target, state.env.HOME)
    const ls = abs.lastIndexOf('/')
    const parent = ls <= 0 ? '/' : abs.slice(0, ls)
    const name = abs.slice(ls + 1)
    return {
      abs,
      name,
      parentNode: resolve(state.root, '/', parent, state.env.HOME),
    }
  }

  return {
    mkdir(target) {
      const { abs, name, parentNode } = resolveForMutation(target)
      if (isProtected(abs))
        return `mkdir: cannot create directory '${name}': Permission denied (protected system path)`
      if (!parentNode || parentNode.type !== 'dir')
        return `mkdir: cannot create directory '${target}': No such file or directory`
      if (parentNode.children?.has(name))
        return `mkdir: cannot create directory '${name}': File exists`
      return fsMkdir(parentNode, name)
        ? null
        : `mkdir: cannot create directory '${name}': Operation failed`
    },

    rm(target) {
      const { abs, name, parentNode } = resolveForMutation(target)
      if (isProtected(abs))
        return `rm: cannot remove '${name}': Permission denied (protected system path)`
      if (!parentNode || parentNode.type !== 'dir')
        return `rm: cannot remove '${target}': No such file or directory`
      const node = parentNode.children?.get(name)
      if (!node) return `rm: cannot remove '${target}': No such file or directory`
      if (node.type === 'dir' && node.children && node.children.size > 0)
        return `rm: cannot remove '${name}': Directory not empty`
      fsRemove(parentNode, name)
      return null
    },

    touch(target) {
      const { abs, name, parentNode } = resolveForMutation(target)
      if (isProtected(abs))
        return `touch: cannot create '${name}': Permission denied (protected system path)`
      if (!parentNode || parentNode.type !== 'dir')
        return `touch: cannot create '${target}': No such file or directory`
      if (parentNode.children?.has(name)) return null
      return fsMkfile(parentNode, name) ? null : `touch: cannot create '${name}': Operation failed`
    },

    copy(src, dest) {
      const srcPath = resolveAbsolute(state.cwd, src, state.env.HOME)
      const srcNode = resolve(state.root, '/', srcPath, state.env.HOME)
      if (!srcNode) return `cp: cannot stat '${src}': No such file or directory`
      const destPath = resolveAbsolute(state.cwd, dest, state.env.HOME)
      const destNode = resolve(state.root, '/', destPath, state.env.HOME)
      if (destNode && destNode.type === 'dir') {
        const childName = srcNode.name
        if (destNode.children?.has(childName))
          return `cp: cannot copy '${src}': '${dest}/${childName}' already exists`
        destNode.children!.set(childName, fsDeepClone(srcNode))
        return null
      }
      const ls = destPath.lastIndexOf('/')
      const parent = ls <= 0 ? '/' : destPath.slice(0, ls)
      const name = destPath.slice(ls + 1)
      const parentNode = resolve(state.root, '/', parent, state.env.HOME)
      if (!parentNode || parentNode.type !== 'dir')
        return `cp: cannot create '${dest}': No such file or directory`
      if (isProtected(destPath))
        return `cp: cannot create '${name}': Permission denied (protected system path)`
      const cloned = fsDeepClone(srcNode)
      cloned.name = name
      parentNode.children!.set(name, cloned)
      return null
    },

    move(src, dest) {
      const srcPath = resolveAbsolute(state.cwd, src, state.env.HOME)
      const ls = srcPath.lastIndexOf('/')
      const srcParent = ls <= 0 ? '/' : srcPath.slice(0, ls)
      const srcName = srcPath.slice(ls + 1)
      const srcParentNode = resolve(state.root, '/', srcParent, state.env.HOME)
      if (!srcParentNode || srcParentNode.type !== 'dir')
        return `mv: cannot stat '${src}': No such file or directory`
      const srcNode = srcParentNode.children?.get(srcName)
      if (!srcNode) return `mv: cannot stat '${src}': No such file or directory`
      if (isProtected(srcPath))
        return `mv: cannot move '${src}': Permission denied (protected system path)`
      const destPath = resolveAbsolute(state.cwd, dest, state.env.HOME)
      const destNode = resolve(state.root, '/', destPath, state.env.HOME)
      if (destNode && destNode.type === 'dir') {
        if (destNode.children?.has(srcName))
          return `mv: cannot move '${src}': '${dest}/${srcName}' already exists`
        srcParentNode.children!.delete(srcName)
        destNode.children!.set(srcName, srcNode)
        return null
      }
      const dls = destPath.lastIndexOf('/')
      const dParent = dls <= 0 ? '/' : destPath.slice(0, dls)
      const dName = destPath.slice(dls + 1)
      const dParentNode = resolve(state.root, '/', dParent, state.env.HOME)
      if (!dParentNode || dParentNode.type !== 'dir')
        return `mv: cannot move to '${dest}': No such file or directory`
      if (isProtected(destPath))
        return `mv: cannot move to '${dName}': Permission denied (protected system path)`
      srcParentNode.children!.delete(srcName)
      srcNode.name = dName
      dParentNode.children!.set(dName, srcNode)
      return null
    },

    rmrf(target) {
      const { abs, name, parentNode } = resolveForMutation(target)
      if (isProtected(abs))
        return `rm: cannot remove '${name}': Permission denied (protected system path)`
      if (!parentNode || parentNode.type !== 'dir')
        return `rm: cannot remove '${target}': No such file or directory`
      if (!parentNode.children?.get(name))
        return `rm: cannot remove '${target}': No such file or directory`
      fsRemove(parentNode, name)
      return null
    },

    writeFile(target, content) {
      const { abs, name, parentNode } = resolveForMutation(target)
      if (isProtected(abs))
        return `write: cannot write '${name}': Permission denied (protected system path)`
      const existing = resolve(state.root, '/', abs, state.env.HOME)
      if (existing && existing.type === 'file') {
        fsWrite(existing, content)
        return null
      }
      if (!parentNode || parentNode.type !== 'dir')
        return `write: cannot create '${target}': No such file or directory`
      return fsMkfile(parentNode, name, content)
        ? null
        : `write: cannot create '${name}': Operation failed`
    },

    appendFile(target, content) {
      const abs = resolveAbsolute(state.cwd, target, state.env.HOME)
      if (isProtected(abs))
        return `append: cannot write '${target}': Permission denied (protected system path)`
      const node = resolve(state.root, '/', abs, state.env.HOME)
      if (node && node.type === 'file') {
        fsWrite(node, (node.content || '') + content)
        return null
      }
      const { name, parentNode } = resolveForMutation(target)
      if (!parentNode || parentNode.type !== 'dir')
        return `append: cannot create '${target}': No such file or directory`
      return fsMkfile(parentNode, name, content)
        ? null
        : `append: cannot create '${name}': Operation failed`
    },
  }
}

/** Read the MOTD from the filesystem tree (/etc/motd). */
function readMotd(root: FSNode): string {
  const etc = root.children?.get('etc')
  const motd = etc?.children?.get('motd')
  return motd?.content || ''
}

/** Build the prompt as a DOM element with colored spans. */
function buildPromptDom(state: ShellStateHandle, theme: ThemeMode): HTMLSpanElement {
  const span = document.createElement('span')
  span.className = 'scp-term-prompt'
  const t = theme === 'dark' ? darkTheme() : lightTheme()
  const { state: s } = state
  const user = s.env.USER ?? 'researcher'
  const host = s.env.HOSTNAME ?? 'LATOM-7'
  const home = s.env.HOME ?? '/home/researcher'
  const dir =
    s.cwd === home ? '~' : s.cwd.startsWith(home + '/') ? '~' + s.cwd.slice(home.length) : s.cwd

  // user@host:dir$
  const userSpan = document.createElement('span')
  userSpan.style.color = t.green
  userSpan.style.fontWeight = 'bold'
  userSpan.textContent = user
  span.appendChild(userSpan)

  span.appendChild(document.createTextNode('@'))

  const hostSpan = document.createElement('span')
  hostSpan.style.color = t.blue
  hostSpan.style.fontWeight = 'bold'
  hostSpan.textContent = host
  span.appendChild(hostSpan)

  span.appendChild(document.createTextNode(':'))

  const dirSpan = document.createElement('span')
  dirSpan.style.color = t.cyan
  dirSpan.style.fontWeight = 'bold'
  dirSpan.textContent = dir
  span.appendChild(dirSpan)

  span.appendChild(document.createTextNode('$ '))

  return span
}

export function createSession(options: SessionOptions): TerminalSession {
  const { container, onExit, onMutate } = options
  let themeMode: ThemeMode = options.theme
  let active = false

  // ── Core components ──
  const stateHandle = options.shellState ?? createShellState()
  const registry = new CommandRegistry()
  registerAllBuiltin(registry)
  const historyNav = createHistoryNavigator(stateHandle.state.history)
  const fsOps = createFsOperations(stateHandle, () => onMutate?.())

  // ── Renderer ──
  const renderer: TerminalRenderer = createRenderer({
    container,
    theme: themeMode,
  })

  // ── Input line DOM ──
  const inputLine = document.createElement('div')
  inputLine.className = 'scp-term-input-line'
  const t = themeMode === 'dark' ? darkTheme() : lightTheme()
  inputLine.style.cssText = `
    font-family: ${renderer.outputElement.style.fontFamily};
    font-size: ${renderer.outputElement.style.fontSize};
    line-height: ${renderer.outputElement.style.lineHeight};
    color: ${t.foreground};
    background: ${t.background};
    white-space: pre;
    padding: 0 8px 4px 8px;
    margin: 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    user-select: text;
    cursor: text;
  `
  container.appendChild(inputLine)

  // ── Input controller ──
  let executing = false
  const inputController: InputController = createInputController({
    onCommand: async (input) => {
      if (executing) return
      executing = true

      // Jump to the newest line so the user sees the echoed prompt + output
      renderer.scrollToBottom()

      // Write the prompt + submitted input into the scrollback
      const prompt = buildPrompt(stateHandle.state)
      renderer.write(prompt + input + '\r\n')

      // Push to history and reset cursor
      stateHandle.pushHistory(input)
      historyNav.reset()

      const trimmed = input.trim()

      // Handle exit
      if (trimmed === 'exit') {
        const output = await registry.execute('exit', makeCtx())
        if (output.length > 0) {
          renderer.write(output.join('\r\n') + '\r\n')
        }
        renderer.write('\r\n\x1b[90m[Process completed]\x1b[0m\r\n')
        active = false
        onExit?.()
        executing = false
        return
      }

      // Execute and write output
      const output = await registry.execute(trimmed, makeCtx())
      if (output.length > 0) {
        renderer.write(output.join('\r\n') + '\r\n')
      }

      executing = false
    },
    onComplete: (input) => {
      return getCompletions(
        input,
        stateHandle.state.cwd,
        stateHandle.state.root,
        registry,
        stateHandle.state.env.HOME,
      )
    },
    onShowCompletions: (completions) => {
      // Write the current prompt + input, then the completion list
      const prompt = buildPrompt(stateHandle.state)
      renderer.write(prompt + inputController.buffer.value + '\r\n')
      renderer.write('\x1b[90m' + completions.join('  ') + '\x1b[0m\r\n')
    },
    onHistoryPrev: () => historyNav.prev(),
    onHistoryNext: () => historyNav.next(),
    onClear: () => {
      renderer.clear()
    },
    onInterrupt: () => {
      renderer.write('^C\r\n')
      inputController.reset()
      historyNav.reset()
    },
  })

  /** Build a CommandContext from the current shell state. */
  function makeCtx(): Omit<CommandContext, 'args'> {
    const { state: s } = stateHandle
    return {
      cwd: s.cwd,
      root: s.root,
      history: s.history,
      env: { ...s.env },
      fs: fsOps,
      setcwd: (path) => {
        stateHandle.setcwd(path)
        onMutate?.()
      },
      setenv: (key, value) => {
        stateHandle.setenv(key, value)
        onMutate?.()
      },
      clear: () => renderer.clear(),
      onMutate: () => onMutate?.(),
      stdout: (chunk) => renderer.write(chunk),
    }
  }

  // ── Reactive input line rendering ──
  const stopPromptWatch = watchEffect(() => {
    // Rebuild the input line DOM whenever buffer/cursorPos/cwd/env change
    inputLine.replaceChildren()

    // Prompt
    inputLine.appendChild(buildPromptDom(stateHandle, themeMode))

    // Input text with cursor
    const buf = inputController.buffer.value
    const pos = inputController.cursorPos.value
    const before = buf.slice(0, pos)
    const cursorChar = buf.slice(pos, pos + 1) || ' '
    const after = buf.slice(pos + 1)

    if (before) {
      const beforeSpan = document.createElement('span')
      beforeSpan.textContent = before
      inputLine.appendChild(beforeSpan)
    }

    // Blinking cursor block
    const cursorSpan = document.createElement('span')
    cursorSpan.className = 'scp-term-cursor'
    const ct = themeMode === 'dark' ? darkTheme() : lightTheme()
    cursorSpan.style.cssText = `
      background: ${ct.cursor};
      color: ${ct.cursorAccent};
      display: inline-block;
      min-width: 0.6em;
      animation: scp-term-blink 1s step-end infinite;
    `
    cursorSpan.textContent = cursorChar
    inputLine.appendChild(cursorSpan)

    if (after) {
      const afterSpan = document.createElement('span')
      afterSpan.textContent = after
      inputLine.appendChild(afterSpan)
    }
  })

  // ── Keyboard routing ──
  function onKeyDown(ev: KeyboardEvent): void {
    if (!active) return

    // Scrollback shortcuts take precedence over line input when Shift is
    // held with the arrow/page keys (matches xterm.js conventions).
    if (ev.shiftKey) {
      switch (ev.key) {
        case 'PageUp':
          ev.preventDefault()
          renderer.scrollPages(-1)
          return
        case 'PageDown':
          ev.preventDefault()
          renderer.scrollPages(1)
          return
        case 'ArrowUp':
          ev.preventDefault()
          renderer.scrollLines(-1)
          return
        case 'ArrowDown':
          ev.preventDefault()
          renderer.scrollLines(1)
          return
      }
    }
    // Ctrl+Shift+Home/End → jump to the top/bottom of the scrollback
    if (ev.ctrlKey && ev.shiftKey) {
      switch (ev.key) {
        case 'Home':
          ev.preventDefault()
          renderer.scrollToTop()
          return
        case 'End':
          ev.preventDefault()
          renderer.scrollToBottom()
          return
      }
    }

    inputController.handleKey(ev)
  }

  // Inject cursor blink keyframes (once)
  if (!document.getElementById('scp-term-cursor-style')) {
    const style = document.createElement('style')
    style.id = 'scp-term-cursor-style'
    style.textContent = `
      @keyframes scp-term-blink {
        0%, 50% { opacity: 1; }
        50.01%, 100% { opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }

  // ── Public API ──

  async function start(): Promise<void> {
    active = true
    container.addEventListener('keydown', onKeyDown)

    // Fit first so the terminal has the right dimensions before content
    renderer.fit()

    // Draw MOTD + initial prompt
    const motd = readMotd(stateHandle.state.root)
    if (motd) {
      renderer.write(motd)
    }

    // Schedule another fit after layout settles (container may not have
    // its final dimensions on the first synchronous call)
    requestAnimationFrame(() => {
      renderer.fit()
    })
  }

  async function stop(): Promise<void> {
    active = false
    container.removeEventListener('keydown', onKeyDown)
    stopPromptWatch()
    inputController.dispose()
    renderer.dispose()
    inputLine.remove()
  }

  function setTheme(mode: ThemeMode): void {
    themeMode = mode
    renderer.setTheme(mode)
    const t = mode === 'dark' ? darkTheme() : lightTheme()
    inputLine.style.color = t.foreground
    inputLine.style.background = t.background
    // The watchEffect will re-render the prompt + cursor with new colors
  }

  return {
    start,
    stop,
    setTheme,
    fit: () => renderer.fit(),
    get active() {
      return active
    },
  }
}
