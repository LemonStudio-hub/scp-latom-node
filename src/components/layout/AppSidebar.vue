<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSidebar } from '@/composables/useSidebar'
import {
  LayoutDashboard,
  Grid2x2,
  FileText,
  Diamond,
  Clock,
  Terminal,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()
const { collapsed, toggle } = useSidebar()

const navItems = computed(() => [
  { path: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { path: '/catalog', labelKey: 'nav.catalog', icon: Grid2x2 },
  { path: '/documents', labelKey: 'nav.documents', icon: FileText },
  { path: '/proposals', labelKey: 'nav.proposals', icon: Diamond },
  { path: '/activity', labelKey: 'nav.activity', icon: Clock },
  { path: '/terminal', labelKey: 'nav.terminal', icon: Terminal },
  { path: '/about', labelKey: 'nav.about', icon: Info },
])
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <nav class="nav">
      <router-link
        v-for="(item, index) in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{
          active:
            route.path === item.path || (item.path !== '/' && route.path.startsWith(item.path)),
        }"
        :title="collapsed ? t(item.labelKey) : undefined"
        :style="{ animationDelay: `${index * 50 + 200}ms` }"
      >
        <span class="nav-icon"><component :is="item.icon" :size="18" /></span>
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
      :title="collapsed ? t('sidebar.expand') : t('sidebar.collapse')"
      @click="toggle"
    >
      <ChevronRight v-if="collapsed" :size="16" :stroke-width="1.5" />
      <ChevronLeft v-else :size="16" :stroke-width="1.5" />
    </button>
  </aside>

  <!-- Mobile bottom nav -->
  <nav class="mobile-nav">
    <router-link
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="mobile-nav-item"
      :class="{
        active: route.path === item.path || (item.path !== '/' && route.path.startsWith(item.path)),
      }"
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
  transition: width 400ms var(--ease-out-expo);
  animation: sidebar-in 500ms var(--ease-out-expo) backwards;
}

@keyframes sidebar-in {
  from {
    opacity: 0;
    transform: translateX(-100%);
  }
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
  animation: nav-item-in 400ms var(--ease-out-expo) backwards;
}

@keyframes nav-item-in {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  transform: translateX(2px);
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
  animation: indicator-in 300ms var(--ease-out-back) backwards;
}

@keyframes indicator-in {
  from {
    height: 0;
    opacity: 0;
  }
}

.nav-icon {
  font-size: var(--text-lg);
  width: 24px;
  text-align: center;
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.nav-item:hover .nav-icon {
  transform: scale(1.1);
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
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 4px var(--color-success);
  }
  50% {
    box-shadow: 0 0 10px var(--color-success);
  }
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
  transform: scale(1.1);
}

.collapsed .collapse-btn {
  right: 50%;
  transform: translateX(50%);
}

.collapsed .collapse-btn:hover {
  transform: translateX(50%) scale(1.1);
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
  transition: all var(--transition-fast);
}

.mobile-nav-item.active {
  color: var(--color-primary);
}

.mobile-nav-item:active {
  transform: scale(0.95);
}

.mobile-nav-icon {
  font-size: var(--text-lg);
  transition: transform var(--transition-fast);
}

.mobile-nav-item.active .mobile-nav-icon {
  transform: scale(1.15);
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
