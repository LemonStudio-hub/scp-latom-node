<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCrawlerStore } from '@/stores/crawler'
import Badge from '@/components/common/Badge.vue'
import ClassBar from '@/components/common/ClassBar.vue'
import type { ObjectClass } from '@/types'

const { t } = useI18n()
const crawler = useCrawlerStore()

const recent = computed(() => crawler.entries.slice(0, 4))

const stats = computed(() => [
  { labelKey: 'stats.totalEntries', value: crawler.total, color: 'var(--color-primary)' },
  { labelKey: 'stats.safe', value: crawler.classDistribution?.['Safe'] ?? 0, color: 'var(--class-safe)' },
  { labelKey: 'stats.keter', value: crawler.classDistribution?.['Keter'] ?? 0, color: 'var(--class-keter)' },
])

onMounted(() => {
  if (!crawler.hasData && !crawler.loading) {
    crawler.init()
  }
})
</script>

<template>
  <div class="m-home">
    <!-- Hero -->
    <section class="m-hero">
      <div class="m-hero-badge">
        <span class="pulse-dot"></span>
        <span>LATOM NODE v7.2.1</span>
      </div>
      <h1 class="m-hero-title">
        {{ t('hero.titleLine') }}
        <span class="m-hero-accent">{{ t('hero.titleAccent') }}</span>
      </h1>
      <p class="m-hero-desc">{{ t('hero.description') }}</p>
      <router-link to="/catalog" class="m-hero-btn">
        {{ t('hero.browseCatalog') }}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </router-link>
    </section>

    <!-- Stats Scroll -->
    <section class="m-stats">
      <div class="m-stats-scroll">
        <div v-for="stat in stats" :key="stat.labelKey" class="m-stat-card">
          <div class="m-stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
          <div class="m-stat-label">{{ t(stat.labelKey) }}</div>
        </div>
      </div>
    </section>

    <!-- Recent Entries -->
    <section class="m-recent">
      <div class="m-section-header">
        <h2 class="m-section-title">{{ t('recent.title') }}</h2>
        <router-link to="/catalog" class="m-section-link">
          {{ t('recent.viewAll') }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </router-link>
      </div>

      <!-- Loading -->
      <div v-if="crawler.loading && !crawler.hasData" class="m-loading">
        <div v-for="i in 4" :key="i" class="m-skeleton m-skeleton-card" />
      </div>

      <!-- Error -->
      <div v-else-if="crawler.error && !crawler.hasData" class="m-error">
        <span class="m-error-icon">⚠</span>
        <p>{{ crawler.error }}</p>
        <button class="m-retry-btn" @click="crawler.init()">Retry</button>
      </div>

      <!-- Empty -->
      <div v-else-if="!recent.length" class="m-empty">
        <span class="m-empty-icon">∅</span>
        <p>{{ t('catalog.empty') }}</p>
      </div>

      <!-- Entries -->
      <div v-else class="m-entry-list">
        <router-link
          v-for="entry in recent"
          :key="entry.scpNumber"
          :to="'/entry/' + crawler.language + '/' + entry.scpNumber"
          class="m-entry-card"
        >
          <div class="m-entry-top">
            <span class="m-entry-id">SCP-{{ String(entry.scpNumber).padStart(3, '0') }}</span>
            <Badge :variant="entry.objectClass.toLowerCase() as any">{{ entry.objectClass }}</Badge>
          </div>
          <h3 class="m-entry-name">{{ entry.name || `SCP-${entry.scpNumber}` }}</h3>
          <div class="m-entry-footer">
            <ClassBar :object-class="entry.objectClass as ObjectClass" />
          </div>
        </router-link>
      </div>
    </section>
  </div>
</template>

<style scoped>
.m-home {
  padding: var(--space-md);
}

/* Hero */
.m-hero {
  padding: var(--space-xl) 0 var(--space-lg);
}

.m-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  margin-bottom: var(--space-md);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.m-hero-title {
  font-size: clamp(1.75rem, 7vw, 2.5rem);
  font-weight: 700;
  line-height: 1.1;
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}

.m-hero-accent {
  display: block;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.m-hero-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-lg);
}

.m-hero-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 12px 24px;
  background: var(--color-primary);
  color: var(--text-inverse);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  text-decoration: none;
}

/* Stats */
.m-stats {
  margin-bottom: var(--space-xl);
}

.m-stats-scroll {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: var(--space-xs);
}

.m-stats-scroll::-webkit-scrollbar {
  display: none;
}

.m-stat-card {
  flex: 0 0 auto;
  min-width: 100px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  text-align: center;
}

.m-stat-value {
  font-size: var(--text-2xl);
  font-weight: 700;
  font-family: var(--font-mono);
  line-height: 1;
  margin-bottom: var(--space-xs);
}

.m-stat-label {
  font-size: 10px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
}

/* Recent Entries */
.m-recent {
  margin-bottom: var(--space-xl);
}

.m-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.m-section-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.m-section-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-sm);
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 500;
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
  margin-bottom: var(--space-md);
}

.m-entry-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border-subtle);
}

.m-entry-date {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
}

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

.m-skeleton-card { height: 120px; }

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* Error & Empty */
.m-error, .m-empty {
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
}

.m-error-icon, .m-empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: var(--space-md);
}

.m-error-icon { color: var(--color-danger); }
.m-empty-icon { color: var(--text-tertiary); }

.m-error p, .m-empty p {
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
