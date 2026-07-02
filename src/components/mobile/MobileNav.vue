<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Home, Grid2x2, FileText, Diamond, Clock, Terminal, Info, User } from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()

const navItems = computed(() => [
  { path: '/', icon: Home, labelKey: 'nav.home' },
  { path: '/catalog', icon: Grid2x2, labelKey: 'nav.catalog' },
  { path: '/documents', icon: FileText, labelKey: 'nav.documents' },
  { path: '/proposals', icon: Diamond, labelKey: 'nav.proposals' },
  { path: '/activity', icon: Clock, labelKey: 'nav.activity' },
  { path: '/terminal', icon: Terminal, labelKey: 'nav.terminal' },
  { path: '/about', icon: Info, labelKey: 'nav.about' },
  { path: '/profile', icon: User, labelKey: 'auth.profile' },
])

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="mobile-nav">
    <router-link
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="nav-item"
      :class="{ active: isActive(item.path) }"
    >
      <component :is="item.icon" :size="22" />

      <span class="nav-label">{{ t(item.labelKey) }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: var(--z-header);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  backdrop-filter: blur(12px);
  background: color-mix(in srgb, var(--bg-surface) 90%, transparent);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-decoration: none;
  color: var(--text-tertiary);
  padding: 6px 8px;
  border-radius: var(--radius-md);
  transition: color var(--transition-fast);
  position: relative;
  min-width: 40px;
}

.nav-item:active {
  color: var(--text-secondary);
}

.nav-item.active {
  color: var(--color-primary);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: var(--color-primary);
  border-radius: 1px;
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.02em;
}
</style>
