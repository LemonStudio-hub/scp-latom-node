<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Maximize2, Minimize2 } from 'lucide-vue-next'
import { useDevice } from '@/composables/useDevice'
import { useSidebar } from '@/composables/useSidebar'
import { useTerminalV2 } from '@/composables/useTerminalV2'

const { t } = useI18n()
const { isMobile } = useDevice()
const { collapsed } = useSidebar()
const { terminalContainer, ready, refit } = useTerminalV2()

const maximized = ref(false)

const viewStyle = computed(() => {
  // Mobile layout is handled entirely by CSS (always fills header → bottom nav).
  if (isMobile.value || !maximized.value) return {}
  return {
    top: 'var(--header-height)',
    left: collapsed.value ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
    right: '0',
    bottom: '0',
  }
})

function toggleMax() {
  maximized.value = !maximized.value
}

function exitMax() {
  if (maximized.value) maximized.value = false
}

// Refit cols/rows whenever the container size changes (maximize toggle,
// sidebar collapse/expand, or mobile/desktop switch).
watch([maximized, collapsed, isMobile], () => {
  nextTick(() => refit())
})
</script>

<template>
  <div class="terminal-view" :class="{ maximized }" :style="viewStyle">
    <div class="term-surface" :class="{ ready }">
      <div ref="terminalContainer" class="terminal-container-inline" tabindex="0"></div>
      <button
        class="max-btn"
        :title="t(maximized ? 'terminal.minimize' : 'terminal.maximize')"
        :aria-label="t(maximized ? 'terminal.minimize' : 'terminal.maximize')"
        @click="toggleMax"
      >
        <component :is="maximized ? Minimize2 : Maximize2" :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.terminal-view {
  position: relative;
  width: 100%;
  transition:
    top 300ms var(--ease-out-expo),
    left 300ms var(--ease-out-expo),
    right 300ms var(--ease-out-expo),
    bottom 300ms var(--ease-out-expo);
}

.terminal-view.maximized {
  position: fixed;
  z-index: 5;
}

/* ═══ Terminal surface ═══ */
.term-surface {
  position: relative;
  height: calc(100vh - var(--header-height) - var(--space-2xl) * 2);
  min-height: 320px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  overflow: hidden;
  overscroll-behavior: contain;
  background: #0c0c14;
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity 400ms ease,
    transform 400ms ease;
}

.term-surface.ready {
  opacity: 1;
  transform: translateY(0);
}

.terminal-view.maximized .term-surface {
  height: 100%;
  border-radius: 0;
  border: none;
}

[data-theme='light'] .term-surface {
  background: #f6f6fc;
}

.terminal-container-inline {
  position: absolute;
  inset: 0;
  padding: 4px 8px;
  outline: none;
}

/* Output area (rendered by createRenderer) */
.terminal-container-inline :deep(.scp-term-output) {
  height: calc(100% - 28px);
  overflow-y: auto;
  overflow-x: hidden;
}

/* Input line (rendered by createSession) */
.terminal-container-inline :deep(.scp-term-input-line) {
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
}

/* ═══ Maximize button ═══ */
.max-btn {
  position: absolute;
  top: 8px;
  right: 10px;
  z-index: 10;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #6b6b82;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-sm);
  cursor: pointer;
  opacity: 0;
  transition: all var(--transition-fast);
}

.term-surface:hover .max-btn,
.terminal-view.maximized .max-btn {
  opacity: 1;
}

.max-btn:hover {
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
}

[data-theme='light'] .max-btn {
  color: #7a7a92;
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme='light'] .max-btn:hover {
  color: #475569;
  background: rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.12);
}

/* ═══ Mobile: always fill the area between header and bottom nav ═══ */
@media (max-width: 768px) {
  .terminal-view {
    position: fixed;
    top: var(--header-height);
    left: 0;
    right: 0;
    bottom: var(--nav-height);
    z-index: 5;
  }

  .term-surface {
    height: 100%;
    min-height: 0;
    border-radius: 0;
    border: none;
  }

  /* Maximize is redundant on mobile (already fills) — hide the button. */
  .max-btn {
    display: none;
  }
}
</style>
