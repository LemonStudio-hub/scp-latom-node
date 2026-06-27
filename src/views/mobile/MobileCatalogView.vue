<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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
  <div class="m-catalog">
    <!-- Sticky Search -->
    <div class="m-search-bar">
      <div class="m-search-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input v-model="searchQuery" type="text" :placeholder="t('catalog.searchPlaceholder')" class="m-search-input" />
      </div>
    </div>

    <!-- Language Selector -->
    <div class="m-lang-bar">
      <button class="m-lang-btn" :class="{ active: crawler.language === 'en' }" @click="setLanguage('en')">EN</button>
      <button class="m-lang-btn" :class="{ active: crawler.language === 'cn' }" @click="setLanguage('cn')">CN</button>
      <span v-if="crawler.state" class="m-crawl-status" :class="crawler.state.status">
        {{ crawler.state.status === 'crawling' ? '⟳' : '' }}
      </span>
    </div>

    <!-- Class Filter Pills -->
    <div class="m-filter-scroll">
      <div class="m-filter-pills">
        <button
          v-for="cls in objectClasses"
          :key="cls"
          class="m-pill"
          :class="{ active: activeClass === cls }"
          @click="toggleClass(cls)"
        >
          {{ t(`classes.${cls}`) }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="crawler.loading && !crawler.hasData" class="m-loading">
      <div v-for="i in 6" :key="i" class="m-skeleton m-skeleton-card" />
    </div>

    <!-- Error -->
    <div v-else-if="crawler.error && !crawler.hasData" class="m-error">
      <span class="m-error-icon">⚠</span>
      <p>{{ crawler.error }}</p>
      <button class="m-retry-btn" @click="crawler.fetchEntries()">Retry</button>
    </div>

    <!-- No Data -->
    <div v-else-if="!crawler.hasData && !crawler.loading" class="m-empty">
      <span class="m-empty-icon">∅</span>
      <p>No data available yet.</p>
    </div>

    <!-- Results -->
    <template v-else>
      <div class="m-results-info">
        <span>{{ t('catalog.entriesFound', { count: crawler.total }) }}</span>
      </div>

      <div class="m-entry-list">
        <router-link
          v-for="entry in crawler.entries"
          :key="entry.scpNumber"
          :to="'/entry/' + crawler.language + '/' + entry.scpNumber"
          class="m-entry-card"
        >
          <div class="m-entry-top">
            <div class="m-entry-id-wrap">
              <ClassBar :object-class="entry.objectClass as ObjectClass" />
              <span class="m-entry-id">SCP-{{ String(entry.scpNumber).padStart(3, '0') }}</span>
            </div>
            <Badge :variant="entry.objectClass.toLowerCase() as any">{{ entry.objectClass }}</Badge>
          </div>
          <h3 class="m-entry-name">{{ entry.name || `SCP-${entry.scpNumber}` }}</h3>
        </router-link>
      </div>

      <div v-if="crawler.entries.length === 0" class="m-empty">
        <span class="m-empty-icon">∅</span>
        <p>{{ t('catalog.empty') }}</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.m-catalog {
  padding: var(--space-md);
}

.m-search-bar {
  position: sticky;
  top: 52px;
  z-index: 10;
  background: var(--bg-primary);
  padding-bottom: var(--space-sm);
}

.m-search-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
}

.m-search-wrap:focus-within {
  border-color: var(--color-primary);
}

.m-search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: var(--text-sm);
  height: 40px;
}

.m-search-input::placeholder {
  color: var(--text-tertiary);
}

.m-filter-scroll {
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  margin-bottom: var(--space-md);
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
  margin-bottom: var(--space-sm);
}

.m-entry-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.m-entry-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  text-decoration: none;
  display: flex;
  flex-direction: column;
}

.m-entry-card:active {
  border-color: var(--color-primary);
}

.m-entry-top {
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

.m-entry-name {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.m-entry-summary {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

/* Language Selector */
.m-lang-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.m-lang-btn {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.m-lang-btn.active {
  background: var(--color-primary-muted);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.m-crawl-status {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.m-crawl-status.crawling { color: var(--color-accent); }

/* Loading */
.m-loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.m-skeleton {
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}

.m-skeleton-card { height: 100px; }

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* Error */
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

.m-error p {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.m-retry-btn {
  margin-top: var(--space-md);
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
