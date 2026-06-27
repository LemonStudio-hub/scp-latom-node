<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()

const navItems = [
  { path: '/', icon: 'home', labelKey: 'nav.home' },
  { path: '/catalog', icon: 'catalog', labelKey: 'nav.catalog' },
  { path: '/documents', icon: 'documents', labelKey: 'nav.documents' },
  { path: '/proposals', icon: 'proposals', labelKey: 'nav.proposals' },
  { path: '/activity', icon: 'activity', labelKey: 'nav.activity' },
  { path: '/about', icon: 'about', labelKey: 'nav.about' },
  { path: '/profile', icon: 'profile', labelKey: 'auth.profile' },
]

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
      <!-- Home -->
      <svg v-if="item.icon === 'home'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
      <!-- Catalog -->
      <svg v-else-if="item.icon === 'catalog'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
      <!-- Documents -->
      <svg v-else-if="item.icon === 'documents'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
      <!-- Proposals -->
      <svg v-else-if="item.icon === 'proposals'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2l10 10-10 10L2 12z" />
      </svg>
      <!-- Activity -->
      <svg v-else-if="item.icon === 'activity'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
      <!-- About -->
      <svg v-else-if="item.icon === 'about'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <!-- Profile -->
      <svg v-else-if="item.icon === 'profile'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>

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
