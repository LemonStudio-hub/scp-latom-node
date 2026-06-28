<script setup lang="ts">
import { useSearchStore } from '@/stores/search'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search } from 'lucide-vue-next'

const { t } = useI18n()
const search = useSearchStore()
const auth = useAuthStore()
const route = useRoute()

const pageTitle = computed(() => {
  const key = route.meta.titleKey as string
  return key ? t(key) : t('nav.home')
})
</script>

<template>
  <header class="mobile-header">
    <router-link to="/" class="header-logo">
      <div class="logo-icon">
        <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
          <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" />
          <circle cx="16" cy="16" r="4" fill="currentColor" />
          <line x1="16" y1="2" x2="16" y2="8" stroke="currentColor" stroke-width="2" />
          <line x1="16" y1="24" x2="16" y2="30" stroke="currentColor" stroke-width="2" />
          <line x1="2" y1="16" x2="8" y2="16" stroke="currentColor" stroke-width="2" />
          <line x1="24" y1="16" x2="30" y2="16" stroke="currentColor" stroke-width="2" />
        </svg>
      </div>
    </router-link>

    <h1 class="header-title">{{ pageTitle }}</h1>

    <div class="header-actions">
      <button class="action-btn" @click="search.open" :title="t('header.searchTitle')">
        <Search :size="20" />
      </button>

      <router-link v-if="auth.isAuthenticated" to="/profile" class="avatar-btn">
        {{ auth.user?.codename?.charAt(0).toUpperCase() }}
      </router-link>
      <router-link v-else to="/login" class="login-link">
        {{ t('auth.loginBtn') }}
      </router-link>
    </div>
  </header>
</template>

<style scoped>
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-md);
  z-index: var(--z-header);
  backdrop-filter: blur(12px);
  background: color-mix(in srgb, var(--bg-surface) 85%, transparent);
}

.header-logo {
  color: var(--color-primary);
  text-decoration: none;
  display: flex;
  align-items: center;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 var(--space-sm);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.action-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.action-btn:active {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.avatar-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-muted);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: 700;
  font-family: var(--font-mono);
  text-decoration: none;
}

.login-link {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  background: var(--color-primary-muted);
}
</style>
