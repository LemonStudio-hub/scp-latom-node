/**
 * useTerminalV2 — composable for the rewritten terminal.
 *
 * Inline variant: the terminal mounts directly inside the route page
 * (no full-screen overlay, no confirmation gate). On mount we create
 * storage, restore persisted state, build a ShellStateHandle, and start
 * a TerminalSession inside the container ref.
 */

import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { createSession, type TerminalSession } from '@/terminal/v2/render/lifecycle'
import { createStorage, type TerminalStorage } from '@/terminal/v2/persistence/storage'
import { createDebouncedSave } from '@/terminal/v2/persistence/debounce'
import { createShellState, type ShellStateHandle, type ShellState } from '@/terminal/v2/shell/state'
import { mergeDelta, computeDelta, createDefaultTree } from '@/terminal/v2/fs'
import type { PersistedState, ThemeMode } from '@/terminal/v2/types'

export function useTerminalV2() {
  const { theme } = useTheme()
  const router = useRouter()

  const terminalContainer = ref<HTMLDivElement>()
  const ready = ref(false)

  let session: TerminalSession | null = null
  let storage: TerminalStorage | null = null
  let stateHandle: ShellStateHandle | null = null
  let debouncedSave: (() => void) | null = null

  function snapshot(): PersistedState {
    if (!stateHandle) {
      return { cwd: '/home/researcher', history: [], env: {}, filesystemDelta: {} }
    }
    const s = stateHandle.state
    return {
      cwd: s.cwd,
      history: [...s.history],
      env: { ...s.env },
      filesystemDelta: computeDelta(s.root, createDefaultTree()),
    }
  }

  async function start() {
    if (!terminalContainer.value) return

    if (!storage) {
      storage = await createStorage()
    }

    // Load persisted state
    let initial: Partial<ShellState> = {}
    if (storage) {
      try {
        const persisted = await storage.load()
        if (persisted) {
          const baseline = createDefaultTree()
          const mergedRoot =
            persisted.filesystemDelta && Object.keys(persisted.filesystemDelta).length > 0
              ? mergeDelta(baseline, persisted.filesystemDelta)
              : baseline
          initial = {
            cwd: persisted.cwd || undefined,
            history: persisted.history,
            env: persisted.env,
            root: mergedRoot,
          }
        }
      } catch {
        // Corrupt state — start fresh
      }
    }

    stateHandle = createShellState(initial)

    if (storage) {
      debouncedSave = createDebouncedSave(storage, snapshot, 500)
    }

    const themeMode: ThemeMode = theme.value === 'dark' ? 'dark' : 'light'

    session = createSession({
      container: terminalContainer.value,
      theme: themeMode,
      shellState: stateHandle,
      onExit: () => {
        exitTerminal()
      },
      onMutate: () => {
        debouncedSave?.()
      },
    })

    await session.start()

    // Wait for layout to settle, then mark ready
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
    ready.value = true
  }

  async function exitTerminal() {
    if (session) {
      await session.stop()
      session = null
    }
    if (storage && stateHandle) {
      try {
        await storage.save(snapshot())
      } catch {
        // Non-critical
      }
    }
    stateHandle = null
    debouncedSave = null
    ready.value = false
    router.push('/')
  }

  /** Recompute terminal cols/rows from the current container size. */
  function refit(): void {
    session?.fit()
  }

  let resizeTimer: ReturnType<typeof setTimeout> | null = null
  function onResize(): void {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => session?.fit(), 120)
  }

  onMounted(() => {
    void start()
    window.addEventListener('resize', onResize)
  })

  onBeforeUnmount(async () => {
    window.removeEventListener('resize', onResize)
    if (resizeTimer) clearTimeout(resizeTimer)
    if (session) {
      await session.stop()
      session = null
    }
  })

  watch(theme, () => {
    if (!session) return
    const mode: ThemeMode = theme.value === 'dark' ? 'dark' : 'light'
    session.setTheme(mode)
  })

  return {
    terminalContainer,
    ready,
    exitTerminal,
    refit,
  }
}
