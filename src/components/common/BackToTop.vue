<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronUp } from 'lucide-vue-next'

const { t } = useI18n()
const visible = ref(false)
let ticking = false

function onScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      visible.value = window.scrollY > 300
      ticking = false
    })
    ticking = true
  }
}

function scrollToTop() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  visible.value = window.scrollY > 300
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <Transition name="back-to-top">
    <button
      v-if="visible"
      class="back-to-top"
      :aria-label="t('backToTop')"
      :title="t('backToTop')"
      @click="scrollToTop"
    >
      <ChevronUp :size="20" />
      <span class="back-to-top-ring"></span>
    </button>
  </Transition>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: var(--space-2xl);
  right: var(--space-2xl);
  z-index: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: all 400ms var(--ease-out-expo);
  overflow: hidden;
}

.back-to-top-ring {
  position: absolute;
  inset: -2px;
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  transition: border-color var(--transition-fast);
}

.back-to-top:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-primary-muted);
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg), 0 0 20px var(--color-primary-muted);
}

.back-to-top:hover .back-to-top-ring {
  border-color: var(--color-primary-muted);
}

.back-to-top:active {
  transform: translateY(-1px) scale(0.95);
}

.back-to-top:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Transition — spring bounce */
.back-to-top-enter-active {
  transition: all 500ms var(--ease-out-back);
}

.back-to-top-leave-active {
  transition: all 250ms cubic-bezier(0.4, 0, 1, 1);
}

.back-to-top-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.8);
}

.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.9);
}

@media (max-width: 768px) {
  .back-to-top {
    bottom: calc(var(--nav-height) + var(--space-lg));
    right: var(--space-lg);
    width: 40px;
    height: 40px;
  }
}
</style>
