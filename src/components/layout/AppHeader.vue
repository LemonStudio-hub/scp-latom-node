<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { useLocale } from '@/composables/useLocale'
import { useSearchStore } from '@/stores/search'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import InlineSearch from './InlineSearch.vue'
import { Sun, Moon } from 'lucide-vue-next'

const { theme, toggle: toggleTheme } = useTheme()
const { toggleLocale } = useLocale()
const { t } = useI18n()
const search = useSearchStore()
const auth = useAuthStore()
const route = useRoute()

const breadcrumbs = computed(() => {
  const key = route.meta.titleKey as string
  return key ? t(key) : t('nav.home')
})

// Inline search emits this so the header shell can keep its center-element
// transition in sync with the search collapse animation (see .header-center).
const isSearchClosing = ref(false)
</script>

<template>
  <header
    class="header"
    :class="{
      'search-expanded': search.isOpen && !isSearchClosing,
      'search-closing': isSearchClosing,
    }"
  >
    <div class="header-left">
      <router-link to="/" class="logo-link">
        <div class="logo-icon">
          <svg viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" />
            <circle cx="16" cy="16" r="4" fill="currentColor" />
            <line x1="16" y1="2" x2="16" y2="8" stroke="currentColor" stroke-width="2" />
            <line x1="16" y1="24" x2="16" y2="30" stroke="currentColor" stroke-width="2" />
            <line x1="2" y1="16" x2="8" y2="16" stroke="currentColor" stroke-width="2" />
            <line x1="24" y1="16" x2="30" y2="16" stroke="currentColor" stroke-width="2" />
          </svg>
        </div>
        <div class="logo-text">
          <span class="logo-title">{{ t('hero.titleLine') }}</span>
          <span class="logo-subtitle">{{ t('hero.titleAccent') }}</span>
        </div>
      </router-link>
    </div>

    <div class="header-center">
      <span class="breadcrumb">{{ breadcrumbs }}</span>
    </div>

    <div class="header-right">
      <!-- 右侧按钮组 - 固定在最右边 -->
      <div class="right-buttons">
        <button class="lang-btn" :title="t('header.langSwitch')" @click="toggleLocale">
          <span class="lang-label">{{ t('header.langSwitch') }}</span>
        </button>

        <button
          class="icon-btn"
          :title="theme === 'dark' ? t('header.lightMode') : t('header.darkMode')"
          @click="toggleTheme"
        >
          <Transition name="fade" mode="out-in">
            <Sun v-if="theme === 'dark'" key="sun" :size="18" />
            <Moon v-else key="moon" :size="18" />
          </Transition>
        </button>

        <!-- Auth: logged in -->
        <router-link
          v-if="auth.isAuthenticated"
          to="/profile"
          class="user-btn"
          :title="t('auth.profile')"
        >
          <div class="user-avatar">{{ auth.user?.codename?.charAt(0).toUpperCase() }}</div>
          <span class="user-codename">{{ auth.user?.codename }}</span>
        </router-link>

        <!-- Auth: logged out -->
        <router-link v-else to="/login" class="login-btn">
          {{ t('auth.loginBtn') }}
        </router-link>
      </div>

      <!-- 搜索区域 - 在按钮组左侧，向左展开（右边缘固定） -->
      <InlineSearch @closing-change="isSearchClosing = $event" />
    </div>
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-lg);
  z-index: var(--z-header);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  background: var(--glass-bg);
  animation: header-in 600ms var(--ease-out-expo) backwards;
}

@keyframes header-in {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
}

.header-left {
  flex: none;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-primary);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.logo-link:hover {
  color: var(--text-primary);
}

.logo-link:hover .logo-icon {
  transform: rotate(90deg);
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: var(--color-primary);
  transition: transform 500ms var(--ease-out-back);
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.logo-title {
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-primary);
}

.logo-subtitle {
  font-size: var(--text-xs);
  color: var(--color-primary);
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.header-center {
  flex: 1;
  min-width: 0;
  text-align: center;
  transition: transform 220ms var(--ease-out-expo);
}

.header.search-expanded .header-center {
  transform: translateX(calc((min(420px, 50vw) - 150px) / 6));
}

.breadcrumb {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  font-weight: 500;
  transition: color var(--transition-fast);
}

.header-right {
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-sm);
}

/* 右侧按钮组 - 固定在最右边 */
.right-buttons {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.lang-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 10px;
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--color-primary);
  font-size: var(--text-xs);
  font-weight: 600;
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
  transition: all var(--transition-fast);
}

.lang-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-muted);
  transform: translateY(-1px);
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  overflow: hidden;
}

.icon-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
  transform: scale(1.05);
}

/* Auth buttons */
.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 14px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--text-inverse);
  font-size: var(--text-xs);
  font-weight: 600;
  text-decoration: none;
  transition: all var(--transition-fast);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}

.login-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transform: translateX(-100%);
  transition: transform 500ms ease;
}

.login-btn:hover {
  background: var(--color-primary-hover);
  color: var(--text-inverse);
  box-shadow: 0 4px 16px var(--color-primary-muted);
  transform: translateY(-1px);
}

.login-btn:hover::before {
  transform: translateX(100%);
}

.user-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  height: 36px;
  padding: 0 10px 0 4px;
  border-radius: var(--radius-full);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  text-decoration: none;
  transition: all var(--transition-fast);
  max-width: 160px;
}

.user-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-muted);
  transform: translateY(-1px);
}

.user-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--color-primary-muted);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: 700;
  font-family: var(--font-mono);
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.user-btn:hover .user-avatar {
  background: var(--color-primary);
  color: var(--text-inverse);
}

.user-codename {
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .user-codename {
    display: none;
  }
  .user-btn {
    padding: 4px;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 0 var(--space-md);
  }

  .header-center {
    display: none;
  }
}
</style>
