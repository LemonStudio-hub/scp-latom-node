<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserActivityStore } from '@/stores/userActivity'
import Badge from '@/components/common/Badge.vue'
import ClassBar from '@/components/common/ClassBar.vue'
import type { ObjectClass } from '@/types'

const { t } = useI18n()
const activity = useUserActivityStore()

const showClearConfirm = ref(false)

function setLanguage(lang: string | null) {
  activity.setLangFilter(lang)
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr + 'Z').toLocaleString()
  } catch {
    return dateStr
  }
}

async function handleClear() {
  const ok = await activity.clearHistory()
  if (ok) showClearConfirm.value = false
}

async function handleDeleteHistory(id: number) {
  await activity.deleteHistoryEntryById(id)
}

async function handleRemoveBookmark(lang: string, scpNumber: number) {
  await activity.removeBookmark(lang, scpNumber)
}

onMounted(() => {
  activity.init()
})
</script>

<template>
  <div class="m-activity">
    <!-- Header -->
    <h1 class="m-title">{{ t('activity.title') }}</h1>

    <!-- Tab Bar -->
    <div class="m-tabs">
      <button
        class="m-tab"
        :class="{ active: activity.activeTab === 'bookmarks' }"
        @click="activity.setTab('bookmarks')"
      >
        ★ {{ t('activity.bookmarksTab') }}
      </button>
      <button
        class="m-tab"
        :class="{ active: activity.activeTab === 'history' }"
        @click="activity.setTab('history')"
      >
        ◷ {{ t('activity.historyTab') }}
      </button>
    </div>

    <!-- ═══ Bookmarks Tab ═══ -->
    <template v-if="activity.activeTab === 'bookmarks'">
      <!-- Loading -->
      <div v-if="activity.bookmarkLoading && activity.bookmarks.length === 0" class="m-loading">
        <div class="m-skeleton" v-for="i in 5" :key="i" />
      </div>

      <!-- Error -->
      <div v-else-if="activity.bookmarkError && activity.bookmarks.length === 0" class="m-error">
        <span class="m-error-icon">⚠</span>
        <p>{{ activity.bookmarkError }}</p>
        <button class="m-retry-btn" @click="activity.loadBookmarks()">{{ t('activity.retry') }}</button>
      </div>

      <!-- Empty -->
      <div v-else-if="activity.bookmarks.length === 0 && !activity.bookmarkLoading" class="m-empty">
        <span class="m-empty-icon">★</span>
        <p>{{ t('bookmarks.empty') }}</p>
      </div>

      <!-- Bookmark List -->
      <div v-else class="m-entry-list">
        <div v-for="entry in activity.bookmarks" :key="`${entry.language}:${entry.scpNumber}`" class="m-entry-card">
          <router-link :to="`/entry/${entry.language}/${entry.scpNumber}`" class="m-card-link">
            <div class="m-card-top">
              <div class="m-entry-id-wrap">
                <ClassBar :object-class="(entry.objectClass || 'Safe') as ObjectClass" />
                <span class="m-entry-id">SCP-{{ String(entry.scpNumber).padStart(3, '0') }}</span>
                <span class="m-entry-lang">{{ entry.language.toUpperCase() }}</span>
              </div>
              <Badge v-if="entry.objectClass" :variant="entry.objectClass.toLowerCase() as any">
                {{ entry.objectClass }}
              </Badge>
            </div>
            <h3 class="m-entry-name">{{ entry.name || `SCP-${entry.scpNumber}` }}</h3>
            <p class="m-entry-time">{{ formatTime(entry.createdAt) }}</p>
          </router-link>
          <button class="m-delete-btn" @click="handleRemoveBookmark(entry.language, entry.scpNumber)">✕</button>
        </div>
      </div>
    </template>

    <!-- ═══ History Tab ═══ -->
    <template v-if="activity.activeTab === 'history'">
      <!-- Clear Confirmation -->
      <div v-if="showClearConfirm" class="m-confirm">
        <p>{{ t('history.confirmClear') }}</p>
        <div class="m-confirm-actions">
          <button class="m-confirm-yes" @click="handleClear">{{ t('history.yes') }}</button>
          <button class="m-confirm-no" @click="showClearConfirm = false">{{ t('history.no') }}</button>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="m-toolbar">
        <div class="m-filter-scroll">
          <div class="m-filter-pills">
            <button class="m-pill" :class="{ active: activity.langFilter === null }" @click="setLanguage(null)">{{ t('history.all') }}</button>
            <button class="m-pill" :class="{ active: activity.langFilter === 'en' }" @click="setLanguage('en')">EN</button>
            <button class="m-pill" :class="{ active: activity.langFilter === 'cn' }" @click="setLanguage('cn')">CN</button>
          </div>
        </div>
        <div class="m-toolbar-right">
          <span class="m-results-info">{{ t('history.entries', { count: activity.historyTotal }) }}</span>
          <button v-if="activity.hasHistoryEntries" class="m-clear-btn" @click="showClearConfirm = !showClearConfirm">
            {{ t('history.clearAll') }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="activity.historyLoading && !activity.hasHistoryEntries" class="m-loading">
        <div class="m-skeleton" v-for="i in 6" :key="i" />
      </div>

      <!-- Error -->
      <div v-else-if="activity.historyError && !activity.hasHistoryEntries" class="m-error">
        <span class="m-error-icon">⚠</span>
        <p>{{ activity.historyError }}</p>
        <button class="m-retry-btn" @click="activity.fetchHistoryList()">{{ t('activity.retry') }}</button>
      </div>

      <!-- Empty -->
      <div v-else-if="!activity.hasHistoryEntries && !activity.historyLoading" class="m-empty">
        <span class="m-empty-icon">◷</span>
        <p>{{ t('history.empty') }}</p>
      </div>

      <!-- History List -->
      <template v-else>
        <div class="m-entry-list">
          <div v-for="entry in activity.historyEntries" :key="entry.id" class="m-entry-card">
            <router-link :to="`/entry/${entry.language}/${entry.scp_number}`" class="m-card-link">
              <div class="m-card-top">
                <div class="m-entry-id-wrap">
                  <ClassBar :object-class="entry.object_class as ObjectClass" />
                  <span class="m-entry-id">SCP-{{ String(entry.scp_number).padStart(3, '0') }}</span>
                  <span class="m-entry-lang">{{ entry.language.toUpperCase() }}</span>
                </div>
                <Badge :variant="entry.object_class.toLowerCase() as any">
                  {{ entry.object_class }}
                </Badge>
              </div>
              <h3 class="m-entry-name">{{ entry.name || `SCP-${entry.scp_number}` }}</h3>
              <p class="m-entry-time">{{ t('history.visited') }} {{ formatTime(entry.visited_at) }}</p>
            </router-link>
            <button class="m-delete-btn" @click="handleDeleteHistory(entry.id)">✕</button>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="activity.historyTotalPages > 1" class="m-pagination">
          <button class="m-page-btn" :disabled="activity.historyPage <= 1" @click="activity.setHistoryPage(activity.historyPage - 1)">←</button>
          <span class="m-page-info">{{ activity.historyPage }} / {{ activity.historyTotalPages }}</span>
          <button class="m-page-btn" :disabled="activity.historyPage >= activity.historyTotalPages" @click="activity.setHistoryPage(activity.historyPage + 1)">→</button>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.m-activity {
  padding: var(--space-md);
}

.m-title {
  font-size: var(--text-xl);
  margin-bottom: var(--space-md);
}

/* Tabs */
.m-tabs {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 0;
}

.m-tab {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  background: transparent;
  border: 1px solid transparent;
  border-bottom: none;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  bottom: -1px;
  text-align: center;
}

.m-tab.active {
  color: var(--color-primary);
  background: var(--bg-surface);
  border-color: var(--border-subtle);
  border-bottom: 1px solid var(--bg-surface);
}

/* Toolbar */
.m-toolbar {
  margin-bottom: var(--space-md);
}

.m-toolbar-right {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-sm);
}

.m-filter-scroll {
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.m-filter-scroll::-webkit-scrollbar {
  display: none;
}

.m-filter-pills {
  display: flex;
  gap: var(--space-sm);
  padding-bottom: var(--space-xs);
}

.m-pill {
  flex: 0 0 auto;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: 500;
  white-space: nowrap;
}

.m-pill.active {
  background: var(--color-primary-muted);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.m-results-info {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.m-clear-btn {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  font-size: var(--text-xs);
  cursor: pointer;
}

/* Confirm */
.m-confirm {
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  background: var(--color-danger-muted, rgba(220, 38, 38, 0.1));
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.m-confirm p {
  margin-bottom: var(--space-sm);
  color: var(--text-primary);
}

.m-confirm-actions {
  display: flex;
  gap: var(--space-sm);
}

.m-confirm-yes {
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  background: var(--color-danger);
  border: none;
  color: white;
  font-size: var(--text-sm);
  cursor: pointer;
}

.m-confirm-no {
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
}

/* Entry List */
.m-entry-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.m-entry-card {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.m-card-link {
  flex: 1;
  min-width: 0;
  padding: var(--space-lg);
  text-decoration: none;
  display: block;
}

.m-card-link:active {
  border-color: var(--color-primary);
}

.m-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.m-entry-id-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.m-entry-id {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-primary);
}

.m-entry-lang {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
}

.m-entry-name {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.m-entry-time {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.m-delete-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  cursor: pointer;
  margin-right: var(--space-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-delete-btn:active {
  background: var(--color-danger);
  color: white;
}

/* Pagination */
.m-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-md);
  margin-top: var(--space-lg);
  padding: var(--space-md) 0;
}

.m-page-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.m-page-info {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

/* States */
.m-loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.m-skeleton {
  height: 80px;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.m-error {
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
}

.m-error-icon {
  font-size: 2.5rem;
  color: var(--color-danger);
  display: block;
  margin-bottom: var(--space-md);
}

.m-retry-btn {
  margin-top: var(--space-md);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-sm);
  background: var(--color-danger);
  border: none;
  color: white;
  cursor: pointer;
}

.m-empty {
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
}

.m-empty-icon {
  font-size: 2.5rem;
  color: var(--text-tertiary);
  display: block;
  margin-bottom: var(--space-md);
}

.m-empty p {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}
</style>
