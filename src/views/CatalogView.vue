<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCrawlerStore } from '@/stores/crawler'
import Badge from '@/components/common/Badge.vue'
import ClassBar from '@/components/common/ClassBar.vue'
import type { ObjectClass } from '@/types'

const { t } = useI18n()
const crawler = useCrawlerStore()

const searchQuery = ref('')
const activeClass = ref<ObjectClass | null>(null)

const objectClasses: ObjectClass[] = ['Safe', 'Euclid', 'Keter', 'Thaumiel', 'Apollyon', 'Neutralized']

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    crawler.setSearchQuery(val)
  }, 300)
})

function toggleClass(cls: ObjectClass) {
  if (activeClass.value === cls) {
    activeClass.value = null
    crawler.setClassFilter(null)
  } else {
    activeClass.value = cls
    crawler.setClassFilter(cls)
  }
}

function setLanguage(lang: 'en' | 'cn') {
  activeClass.value = null
  searchQuery.value = ''
  crawler.setLanguage(lang)
}

onMounted(() => {
  crawler.init()
})
</script>

<template>
  <div class="catalog">
    <div class="page-header">
      <h1>{{ t('catalog.title') }}</h1>
      <p class="page-desc">{{ t('catalog.description') }}</p>
    </div>

    <!-- Language Selector -->
    <div class="lang-bar">
      <button
        class="lang-btn"
        :class="{ active: crawler.language === 'en' }"
        @click="setLanguage('en')"
      >
        EN — SCP Wiki
      </button>
      <button
        class="lang-btn"
        :class="{ active: crawler.language === 'cn' }"
        @click="setLanguage('cn')"
      >
        CN — SCP基金会
      </button>
      <div class="crawl-info">
        <span v-if="crawler.state" class="crawl-status" :class="crawler.state.status">
          {{ crawler.state.status === 'crawling' ? '⟳ Syncing…' : crawler.state.status === 'error' ? '✗ Sync error' : '' }}
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="crawler.loading && !crawler.hasData" class="loading-state">
      <div class="skeleton" v-for="i in 10" :key="i" />
    </div>

    <!-- Error State -->
    <div v-else-if="crawler.error && !crawler.hasData" class="error-state">
      <span class="error-icon">⚠</span>
      <p>{{ crawler.error }}</p>
      <button class="retry-btn" @click="crawler.fetchEntries()">Retry</button>
    </div>

    <!-- No Data State -->
    <div v-else-if="!crawler.hasData && !crawler.loading" class="empty-state">
      <span class="empty-icon">🔍</span>
      <p>No data available yet.</p>
      <p class="empty-hint">The index is being prepared. Please check back later.</p>
    </div>

    <!-- Data Loaded -->
    <template v-else>
      <div class="filters">
        <div class="search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('catalog.searchPlaceholder')"
            class="filter-input"
          />
        </div>
        <div class="class-filters">
          <button
            v-for="cls in objectClasses"
            :key="cls"
            class="class-filter-btn"
            :class="{ active: activeClass === cls }"
            @click="toggleClass(cls)"
          >
            <ClassBar :object-class="cls" :show-label="true" />
          </button>
        </div>
      </div>

      <div class="results-info">
        <span class="results-count">
          {{ t('catalog.entriesFound', { count: crawler.total }) }}
        </span>
        <span v-if="crawler.lastCrawlTime" class="last-crawl">
          Updated: {{ crawler.lastCrawlTime.toLocaleString() }}
        </span>
      </div>

      <div class="entries-list">
        <router-link
          v-for="entry in crawler.entries"
          :key="entry.scpNumber"
          :to="'/entry/' + crawler.language + '/' + entry.scpNumber"
          class="entry-row"
        >
          <div class="entry-left">
            <div class="entry-id-wrap">
              <ClassBar :object-class="entry.objectClass as ObjectClass" />
              <span class="entry-id">SCP-{{ String(entry.scpNumber).padStart(3, '0') }}</span>
            </div>
            <h3 class="entry-name">{{ entry.name || `SCP-${entry.scpNumber}` }}</h3>
            <p class="entry-class">{{ entry.objectClass }}</p>
          </div>
          <div class="entry-right">
            <Badge :variant="entry.objectClass.toLowerCase() as any">
              {{ entry.objectClass }}
            </Badge>
          </div>
        </router-link>
      </div>

      <!-- Pagination -->
      <div v-if="crawler.totalPages > 1" class="pagination">
        <button
          class="page-btn"
          :disabled="crawler.page <= 1"
          @click="crawler.setPage(crawler.page - 1)"
        >
          ← Prev
        </button>
        <span class="page-info">
          Page {{ crawler.page }} of {{ crawler.totalPages }}
        </span>
        <button
          class="page-btn"
          :disabled="crawler.page >= crawler.totalPages"
          @click="crawler.setPage(crawler.page + 1)"
        >
          Next →
        </button>
      </div>

      <div v-if="crawler.entries.length === 0 && !crawler.loading" class="empty-state">
        <span class="empty-icon">∅</span>
        <p>{{ t('catalog.empty') }}</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.catalog {
  max-width: var(--max-content);
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-header h1 {
  margin-bottom: var(--space-sm);
}

.page-desc {
  color: var(--text-secondary);
  font-size: var(--text-lg);
}

/* Language Bar */
.lang-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.lang-btn {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.lang-btn:hover {
  border-color: var(--border-default);
  color: var(--text-primary);
}

.lang-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary-muted);
  color: var(--color-primary);
}

.crawl-info {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.crawl-status {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
}

.crawl-status.crawling {
  color: var(--color-accent);
}

.crawl-status.error {
  color: var(--color-danger);
}

/* Filters */
.filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
}

.search-wrap:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-muted);
}

.filter-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.filter-input::placeholder {
  color: var(--text-tertiary);
}

.class-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.class-filter-btn {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  transition: all var(--transition-fast);
}

.class-filter-btn:hover {
  border-color: var(--border-default);
}

.class-filter-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary-muted);
}

/* Results Info */
.results-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.results-count {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.last-crawl {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

/* Entries List */
.entries-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.entry-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: all var(--transition-normal);
}

.entry-row:hover {
  border-color: var(--color-primary);
  box-shadow: 0 0 16px var(--color-primary-muted);
}

.entry-left {
  flex: 1;
  min-width: 0;
}

.entry-id-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}

.entry-id {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-primary);
}

.entry-name {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.entry-class {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.entry-right {
  flex-shrink: 0;
  padding-top: 4px;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-md);
  margin-top: var(--space-xl);
  padding: var(--space-lg) 0;
}

.page-btn {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

/* States */
.loading-state {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.skeleton {
  height: 80px;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.error-state {
  text-align: center;
  padding: var(--space-3xl);
}

.error-icon {
  font-size: 3rem;
  color: var(--color-danger);
  display: block;
  margin-bottom: var(--space-md);
}

.retry-btn {
  margin-top: var(--space-md);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-sm);
  background: var(--color-danger);
  border: none;
  color: white;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: var(--space-3xl);
}

.empty-icon {
  font-size: 3rem;
  color: var(--text-tertiary);
  display: block;
  margin-bottom: var(--space-md);
}

.empty-hint {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  margin-top: var(--space-xs);
}

@media (max-width: 640px) {
  .entry-row {
    flex-direction: column;
    padding: var(--space-md);
  }

  .entry-right {
    padding-top: var(--space-sm);
  }

  .lang-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .crawl-info {
    margin-left: 0;
    justify-content: flex-start;
  }
}
</style>
