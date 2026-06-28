<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { fetchEntryContent, type EntryContentResponse } from '@/services/crawler'
import { downloadEntry } from '@/services/download'
import { checkReports } from '@/services/reports'
import { useAuthStore } from '@/stores/auth'
import { useUserActivityStore } from '@/stores/userActivity'
import Badge from '@/components/common/Badge.vue'
import ClassBar from '@/components/common/ClassBar.vue'
import ReportDialog from '@/components/common/ReportDialog.vue'
import { ChevronLeft, Download, Bookmark, TriangleAlert } from 'lucide-vue-next'
import type { ObjectClass } from '@/types'

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()
const activityStore = useUserActivityStore()

const bookmarked = ref(false)
const bookmarkLoading = ref(false)
const downloading = ref(false)
const reportOpen = ref(false)
const reportCount = ref(0)
const reportMax = ref(3)

const lang = computed(() => route.params.lang as 'en' | 'cn')
const scpNumber = computed(() => parseInt(route.params.scpNumber as string, 10))
const scpId = computed(() => `SCP-${String(scpNumber.value).padStart(3, '0')}`)

const loading = ref(true)
const error = ref('')
const data = ref<EntryContentResponse | null>(null)
let pollTimer: ReturnType<typeof setTimeout> | null = null

// Collapse all <details> elements in footer content after render
function collapseFooterDetails() {
  nextTick(() => {
    const body = document.querySelector('.m-entry-body')
    if (!body) return
    body.querySelectorAll('details').forEach((el) => {
      el.removeAttribute('open')
    })
  })
}

watch(() => data.value?.content, (content) => {
  if (content) collapseFooterDetails()
})

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
    recordVisit(res.data)
    return
  }

  if (res.data.status === 'pending' || res.data.status === 'fetching') {
    pollTimer = setTimeout(() => { pollForContent() }, 2000)
    return
  }

  loading.value = false
  error.value = res.data.error || 'Failed to fetch entry content'
}

function recordVisit(entry: EntryContentResponse) {
  if (!auth.isAuthenticated) return
  activityStore.recordVisit({
    language: lang.value,
    scpNumber: scpNumber.value,
    name: entry.name,
    objectClass: entry.objectClass,
  })
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
    recordVisit(res.data)
    return
  }

  if (res.data.status === 'pending' || res.data.status === 'fetching') {
    pollTimer = setTimeout(() => { pollForContent() }, 2000)
    return
  }

  loading.value = false
  error.value = res.data.error || 'Failed to fetch entry content'
}

function retry() {
  data.value = null
  loadContent()
}

async function toggleBookmark() {
  if (!auth.isAuthenticated) return
  bookmarkLoading.value = true
  const result = await activityStore.toggleBookmark(lang.value, scpNumber.value)
  if (result) bookmarked.value = !bookmarked.value
  bookmarkLoading.value = false
}

function handleDownload() {
  if (!data.value || downloading.value) return
  downloading.value = true
  downloadEntry(scpNumber.value, lang.value, data.value)
  downloading.value = false
}

onMounted(() => {
  if (!scpNumber.value || isNaN(scpNumber.value)) {
    error.value = 'Invalid SCP number'
    loading.value = false
    return
  }
  loadContent()

  // Check bookmark status for authenticated users
  if (auth.isAuthenticated) {
    activityStore.checkBookmark(lang.value, scpNumber.value).then((result: boolean) => {
      bookmarked.value = result
    })
    checkReports(lang.value, scpNumber.value).then((res) => {
      if (res.ok) {
        reportCount.value = res.data.count
        reportMax.value = res.data.maxReports
      }
    })
  }
})

onUnmounted(() => {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
})
</script>

<template>
  <div class="m-entry">
    <!-- Back -->
    <router-link to="/catalog" class="m-back">
      <ChevronLeft :size="16" />
      {{ t('entry.back') }}
    </router-link>

    <!-- Loading -->
    <div v-if="loading" class="m-loading">
      <div class="m-skeleton m-skeleton-badge" />
      <div class="m-skeleton m-skeleton-title" />
      <div class="m-skeleton m-skeleton-sub" />
      <div v-for="i in 6" :key="i" class="m-skeleton m-skeleton-line" :style="{ width: `${50 + Math.random() * 50}%` }" />
      <p class="m-loading-hint" v-if="data?.status === 'pending' || data?.status === 'fetching'">
        Fetching from wiki…
      </p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="m-error">
      <TriangleAlert class="m-error-icon" :size="40" />
      <h2>{{ scpId }}</h2>
      <p>{{ error }}</p>
      <div class="m-error-actions">
        <button class="m-retry-btn" @click="retry">Retry</button>
        <a :href="`https://scp-wiki.wikidot.com/scp-${String(scpNumber).padStart(3, '0')}`" target="_blank" rel="noopener noreferrer" class="m-wiki-link">
          View on Wiki ↗
        </a>
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="data">
      <div class="m-entry-header">
        <div class="m-entry-meta">
          <ClassBar v-if="data.objectClass" :object-class="data.objectClass as ObjectClass" :show-label="true" />
          <Badge v-if="data.objectClass" :variant="data.objectClass.toLowerCase() as any">
            {{ data.objectClass }}
          </Badge>
          <div class="m-entry-actions">
            <button
              class="m-download-btn"
              :disabled="downloading"
              :title="t('entry.download')"
              @click="handleDownload"
            >
              <Download :size="16" />
            </button>
            <button
              v-if="auth.isAuthenticated"
              class="m-bookmark-btn"
              :class="{ active: bookmarked }"
              :disabled="bookmarkLoading"
              :title="bookmarked ? t('bookmarks.remove') : t('bookmarks.add')"
              @click="toggleBookmark"
            >
              <Bookmark :size="16" :fill="bookmarked ? 'currentColor' : 'none'" />
            </button>
            <button
              v-if="auth.isAuthenticated"
              class="m-report-btn"
              :title="t('entry.report')"
              @click="reportOpen = true"
            >
              <TriangleAlert :size="16" />
            </button>
          </div>
        </div>
        <h1 class="m-entry-title">
          <span class="m-entry-id">{{ scpId }}</span>
          <span v-if="data.name" class="m-entry-name"> — {{ data.name }}</span>
        </h1>
        <div class="m-entry-info">
          <span>{{ lang === 'en' ? 'English' : '中文' }}</span>
          <a :href="`https://scp-wiki.wikidot.com/scp-${String(scpNumber).padStart(3, '0')}`" target="_blank" rel="noopener noreferrer" class="m-wiki-link">
            Wiki ↗
          </a>
        </div>
      </div>

      <div class="m-entry-body" v-if="data.content" v-html="data.content" />

      <ReportDialog
        :open="reportOpen"
        :scp-number="scpNumber"
        :language="lang"
        :scp-id="scpId"
        :existing-count="reportCount"
        :max-reports="reportMax"
        @close="reportOpen = false"
        @submitted="reportCount++"
      />
    </template>
  </div>
</template>

<style scoped>
.m-entry {
  padding: var(--space-md);
}

.m-back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-decoration: none;
  margin-bottom: var(--space-lg);
  padding: var(--space-sm) 0;
}

/* ─── Header ─── */

.m-entry-header {
  margin-bottom: var(--space-lg);
}

.m-entry-meta {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
}

.m-entry-actions {
  display: flex;
  gap: var(--space-sm);
  margin-left: auto;
}

.m-download-btn,
.m-bookmark-btn,
.m-report-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.m-download-btn:hover,
.m-bookmark-btn:hover,
.m-bookmark-btn.active,
.m-report-btn:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.m-download-btn:disabled,
.m-bookmark-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.m-entry-title {
  font-size: clamp(1.25rem, 5vw, 1.75rem);
  line-height: 1.2;
  margin-bottom: var(--space-md);
}

.m-entry-id {
  color: var(--color-primary);
  font-family: var(--font-mono);
}

.m-entry-name {
  color: var(--text-primary);
}

.m-entry-info {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  align-items: center;
}

.m-wiki-link {
  color: var(--text-tertiary);
  text-decoration: none;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.m-wiki-link:hover {
  color: var(--color-accent);
}

/* ─── Body ─── */

.m-entry-body {
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-subtle);
  overflow-x: hidden;
  overflow-wrap: break-word;
}

/* ─── Loading ─── */

.m-loading {
  padding: var(--space-lg) 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.m-skeleton {
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}

.m-skeleton-badge {
  width: 100px;
  height: 24px;
}

.m-skeleton-title {
  width: min(250px, 80%);
  height: 30px;
}

.m-skeleton-sub {
  width: min(150px, 50%);
  height: 18px;
  margin-bottom: var(--space-sm);
}

.m-skeleton-line {
  height: 14px;
}

.m-loading-hint {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  text-align: center;
  margin-top: var(--space-md);
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* ─── Error ─── */

.m-error {
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
}

.m-error-icon {
  color: var(--color-danger);
  display: inline-block;
  margin-bottom: var(--space-md);
}

.m-error h2 {
  margin-bottom: var(--space-sm);
}

.m-error p {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin-bottom: var(--space-xl);
}

.m-error-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
  align-items: center;
}

.m-retry-btn {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  border: none;
  color: var(--text-inverse);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}
</style>
