<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { fetchEntryContent, type EntryContentResponse } from '@/services/crawler'
import Badge from '@/components/common/Badge.vue'
import ClassBar from '@/components/common/ClassBar.vue'
import type { ObjectClass } from '@/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const lang = computed(() => route.params.lang as 'en' | 'cn')
const scpNumber = computed(() => parseInt(route.params.scpNumber as string, 10))
const scpId = computed(() => `SCP-${String(scpNumber.value).padStart(3, '0')}`)

const loading = ref(true)
const error = ref('')
const data = ref<EntryContentResponse | null>(null)
let pollTimer: ReturnType<typeof setTimeout> | null = null

async function loadContent() {
  loading.value = true
  error.value = ''

  const res = await fetchEntryContent(lang.value, scpNumber.value)

  if (!res.ok) {
    loading.value = false
    error.value = res.error
    return
  }

  data.value = res.data

  if (res.data.status === 'cached' || res.data.status === 'fetched') {
    loading.value = false
    return
  }

  if (res.data.status === 'pending' || res.data.status === 'fetching') {
    // Poll until content is ready
    pollTimer = setTimeout(() => {
      pollForContent()
    }, 2000)
    return
  }

  // status === 'error'
  loading.value = false
  error.value = res.data.error || 'Failed to fetch entry content'
}

async function pollForContent() {
  const res = await fetchEntryContent(lang.value, scpNumber.value)

  if (!res.ok) {
    loading.value = false
    error.value = res.error
    return
  }

  data.value = res.data

  if (res.data.status === 'cached' || res.data.status === 'fetched') {
    loading.value = false
    return
  }

  if (res.data.status === 'pending' || res.data.status === 'fetching') {
    pollTimer = setTimeout(() => {
      pollForContent()
    }, 2000)
    return
  }

  loading.value = false
  error.value = res.data.error || 'Failed to fetch entry content'
}

function retry() {
  data.value = null
  loadContent()
}

onMounted(() => {
  if (!scpNumber.value || isNaN(scpNumber.value)) {
    error.value = 'Invalid SCP number'
    loading.value = false
    return
  }
  loadContent()
})

onUnmounted(() => {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
})
</script>

<template>
  <div class="entry-view">
    <!-- Back Link -->
    <router-link to="/catalog" class="back-link">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      {{ t('entry.back') }}
    </router-link>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="skeleton-header">
        <div class="skeleton skeleton-badge" />
        <div class="skeleton skeleton-title" />
        <div class="skeleton skeleton-subtitle" />
      </div>
      <div class="skeleton-body">
        <div v-for="i in 8" :key="i" class="skeleton skeleton-line" :style="{ width: `${60 + Math.random() * 40}%` }" />
      </div>
      <p class="loading-hint" v-if="data?.status === 'pending' || data?.status === 'fetching'">
        Fetching content from the SCP wiki…
      </p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠</span>
      <h2>{{ scpId }}</h2>
      <p class="error-message">{{ error }}</p>
      <div class="error-actions">
        <button class="retry-btn" @click="retry">Retry</button>
        <a v-if="data?.status !== 'error'" :href="`https://scp-wiki.wikidot.com/scp-${String(scpNumber).padStart(3, '0')}`" target="_blank" rel="noopener noreferrer" class="external-link">
          View on Wiki ↗
        </a>
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="data">
      <div class="entry-header">
        <div class="entry-meta">
          <ClassBar v-if="data.objectClass" :object-class="data.objectClass as ObjectClass" :show-label="true" />
          <Badge v-if="data.objectClass" :variant="data.objectClass.toLowerCase() as any">
            {{ data.objectClass }}
          </Badge>
        </div>
        <h1 class="entry-title">
          <span class="entry-id">{{ scpId }}</span>
          <span v-if="data.name" class="entry-name">— {{ data.name }}</span>
        </h1>
        <div class="entry-info">
          <span class="info-item">
            <span class="info-label">Language</span>
            {{ lang === 'en' ? 'English' : '中文' }}
          </span>
          <span v-if="data.fetchedAt" class="info-item">
            <span class="info-label">Cached</span>
            {{ new Date(data.fetchedAt).toLocaleDateString() }}
          </span>
          <a
            :href="`https://scp-wiki.wikidot.com/scp-${String(scpNumber).padStart(3, '0')}`"
            target="_blank"
            rel="noopener noreferrer"
            class="wiki-link"
          >
            View on Wiki ↗
          </a>
        </div>
      </div>

      <div class="entry-body" v-if="data.content" v-html="data.content" />
    </template>
  </div>
</template>

<style scoped>
.entry-view {
  max-width: var(--max-content);
  margin: 0 auto;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-decoration: none;
  margin-bottom: var(--space-xl);
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-accent);
}

/* ─── Header ─── */

.entry-header {
  margin-bottom: var(--space-lg);
}

.entry-meta {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.entry-title {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  line-height: 1.2;
  margin-bottom: var(--space-md);
}

.entry-id {
  color: var(--color-primary);
  font-family: var(--font-mono);
}

.entry-name {
  color: var(--text-primary);
}

.entry-info {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  align-items: center;
}

.info-label {
  color: var(--text-tertiary);
  font-weight: 500;
  margin-right: var(--space-xs);
}

.wiki-link {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-decoration: none;
  font-family: var(--font-mono);
  transition: color var(--transition-fast);
}

.wiki-link:hover {
  color: var(--color-accent);
}

/* ─── Body ─── */

.entry-body {
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--border-subtle);
}

/* ─── Loading ─── */

.loading-state {
  padding: var(--space-xl) 0;
}

.skeleton-header {
  margin-bottom: var(--space-xl);
}

.skeleton {
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-badge {
  width: 120px;
  height: 28px;
  margin-bottom: var(--space-md);
}

.skeleton-title {
  width: 300px;
  height: 36px;
  margin-bottom: var(--space-sm);
}

.skeleton-subtitle {
  width: 200px;
  height: 20px;
}

.skeleton-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.skeleton-line {
  height: 16px;
}

.loading-hint {
  margin-top: var(--space-lg);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  text-align: center;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* ─── Error ─── */

.error-state {
  text-align: center;
  padding: var(--space-3xl) 0;
}

.error-icon {
  font-size: 3rem;
  color: var(--color-danger);
  display: block;
  margin-bottom: var(--space-md);
}

.error-state h2 {
  margin-bottom: var(--space-sm);
}

.error-message {
  color: var(--text-secondary);
  margin-bottom: var(--space-xl);
}

.error-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
  align-items: center;
}

.retry-btn {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  border: none;
  color: var(--text-inverse);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  transition: background var(--transition-fast);
}

.retry-btn:hover {
  background: var(--color-primary-hover);
}

.external-link {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.external-link:hover {
  color: var(--color-accent);
}

@media (max-width: 480px) {
  .entry-info {
    gap: var(--space-sm);
    font-size: var(--text-xs);
  }

  .error-actions {
    flex-direction: column;
  }
}
</style>
