<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSidebar } from '@/composables/useSidebar'

const { t } = useI18n()
const route = useRoute()
const { collapsed, toggle } = useSidebar()

const navItems = [
  { path: '/', labelKey: 'nav.dashboard', icon: '◈' },
  { path: '/catalog', labelKey: 'nav.catalog', icon: '☰' },
  { path: '/documents', labelKey: 'nav.documents', icon: '◫' },
  { path: '/about', labelKey: 'nav.about', icon: '◎' },
]
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <nav class="nav">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: route.path === item.path || (item.path !== '/' && route.path.startsWith(item.path)) }"
        :title="collapsed ? t(item.labelKey) : undefined"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ t(item.labelKey) }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-divider"></div>
      <div class="sidebar-info">
        <div class="info-row">
          <span class="info-label">{{ t('sidebar.node') }}</span>
          <span class="info-value">{{ t('sidebar.nodeValue') }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('sidebar.status') }}</span>
          <span class="status-dot"></span>
          <span class="info-value">{{ t('sidebar.active') }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('sidebar.clearance') }}</span>
          <span class="info-value level-4">{{ t('sidebar.level4') }}</span>
        </div>
      </div>
    </div>

    <button
      class="collapse-btn"
      @click="toggle"
      :title="collapsed ? t('sidebar.expand') : t('sidebar.collapse')"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline :points="collapsed ? '6 3 11 8 6 13' : '10 3 5 8 10 13'" />
      </svg>
    </button>
  </aside>

  <!-- Mobile bottom nav -->
  <nav class="mobile-nav">
    <router-link
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="mobile-nav-item"
      :class="{ active: route.path === item.path || (item.path !== '/' && route.path.startsWith(item.path)) }"
    >
      <span class="mobile-nav-icon">{{ item.icon }}</span>
      <span class="mobile-nav-label">{{ t(item.labelKey) }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: var(--header-height);
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  z-index: var(--z-sidebar);
  padding: var(--space-md) 0;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width var(--transition-normal);
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 var(--space-sm);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 10px var(--space-md);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  text-decoration: none;
  transition: all var(--transition-fast);
  position: relative;
  white-space: nowrap;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--color-primary-muted);
  color: var(--color-primary);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--color-primary);
  border-radius: 0 var(--radius-full) var(--radius-full) 0;
}

.nav-icon {
  font-size: var(--text-lg);
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.nav-label {
  overflow: hidden;
  transition: opacity var(--transition-fast);
}

.collapsed .nav-label {
  opacity: 0;
  width: 0;
}

.sidebar-footer {
  margin-top: auto;
  padding: 0 var(--space-md);
  overflow: hidden;
  transition: opacity var(--transition-fast);
}

.collapsed .sidebar-footer {
  opacity: 0;
  pointer-events: none;
}

.sidebar-divider {
  height: 1px;
  background: var(--border-subtle);
  margin-bottom: var(--space-md);
}

.sidebar-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.info-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
}

.info-label {
  color: var(--text-tertiary);
  width: 80px;
}

.info-value {
  color: var(--text-secondary);
}

.level-4 {
  color: var(--color-primary);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
}

.collapse-btn {
  position: absolute;
  bottom: var(--space-md);
  right: var(--space-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.collapse-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.collapsed .collapse-btn {
  right: 50%;
  transform: translateX(50%);
}

/* Mobile nav */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
  z-index: var(--z-header);
  padding: 0 var(--space-sm);
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: 1;
  color: var(--text-tertiary);
  text-decoration: none;
  font-size: var(--text-xs);
  transition: color var(--transition-fast);
}

.mobile-nav-item.active {
  color: var(--color-primary);
}

.mobile-nav-icon {
  font-size: var(--text-lg);
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
  .mobile-nav {
    display: flex;
  }
}
</style>
