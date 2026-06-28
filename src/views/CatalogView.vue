<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCrawlerStore } from '@/stores/crawler'
import { useEntryProtocol, INTERVAL_OPTIONS } from '@/composables/useEntryProtocol'
import Badge from '@/components/common/Badge.vue'
import ClassBar from '@/components/common/ClassBar.vue'
import { ArrowLeft, ArrowRight, Shield, RotateCw, Settings, Pause, Play, RefreshCw, Search, SearchX, TriangleAlert } from 'lucide-vue-next'
import type { ObjectClass } from '@/types'
import type { ProtocolMode } from '@/composables/useEntryProtocol'

const { t } = useI18n()
const crawler = useCrawlerStore()
const protocol = useEntryProtocol()

const searchQuery = ref('')
const activeClass = ref<ObjectClass | null>(null)
const protocolVisible = ref(false)

const objectClasses: ObjectClass[] = ['Safe', 'Euclid', 'Keter', 'Thaumiel', 'Apollyon', 'Neutralized']

// SVG ring dimensions for countdown
const ringRadius = 18
const ringCircumference = 2 * Math.PI * ringRadius
const ringOffset = computed(() => {
  return ringCircumference * (1 - protocol.countdownProgress.value)
})

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

function switchProtocol(mode: ProtocolMode) {
  protocol.setMode(mode)
}

onMounted(async () => {
  crawler.init()
  requestAnimationFrame(() => {
    protocolVisible.value = true
  })

  // If auto mode was active before navigation, restart the timer
  // and refresh entries (countdown resets, isPaused resets)
  if (protocol.mode.value === 'auto') {
    protocol.isPaused.value = false
    await protocol.shuffle()
    protocol.startAutoRotation()
  }
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

    <!-- Protocol Mode Panel -->
    <div class="protocol-panel" :class="{ visible: protocolVisible }">
      <!-- Scanner line effect -->
      <div class="scanner-line" :class="{ active: protocol.mode.value === 'auto' && !protocol.isPaused.value }" />

      <!-- Panel header -->
      <div class="protocol-top">
        <div class="protocol-title-row">
          <span class="protocol-icon-wrap">
            <Shield :size="14" />
          </span>
          <span class="protocol-label">{{ t('catalog.protocol.title') }}</span>
          <span class="protocol-divider" />
          <span class="protocol-status" :class="protocol.mode.value === 'auto' ? (protocol.isPaused.value ? 'paused' : 'active') : 'idle'">
            <span class="status-dot" />
            {{ protocol.mode.value === 'auto' ? (protocol.isPaused.value ? t('catalog.protocol.scannerPaused') : t('catalog.protocol.scannerActive')) : 'STANDBY' }}
          </span>
        </div>

        <!-- Segmented toggle -->
        <div class="protocol-segment">
          <div class="segment-track">
            <div class="segment-indicator" :class="{ right: protocol.mode.value === 'manual' }" />
            <button
              class="segment-option"
              :class="{ active: protocol.mode.value === 'auto' }"
              @click="switchProtocol('auto')"
            >
              <RotateCw :size="14" />
              {{ t('catalog.protocol.auto') }}
            </button>
            <button
              class="segment-option"
              :class="{ active: protocol.mode.value === 'manual' }"
              @click="switchProtocol('manual')"
            >
              <Settings :size="14" />
              {{ t('catalog.protocol.manual') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Description -->
      <p class="protocol-desc">
        {{ protocol.mode.value === 'auto' ? t('catalog.protocol.autoDesc') : t('catalog.protocol.manualDesc') }}
      </p>

      <!-- Auto-Operation Controls -->
      <Transition name="slide">
        <div v-if="protocol.mode.value === 'auto'" class="auto-controls">
          <!-- Countdown ring + timer -->
          <div class="auto-timer-group">
            <div class="countdown-ring-wrap">
              <svg class="countdown-ring" :width="48" :height="48" viewBox="0 0 48 48">
                <circle
                  class="ring-bg"
                  cx="24" cy="24"
                  :r="ringRadius"
                  fill="none"
                  stroke-width="3"
                />
                <circle
                  class="ring-progress"
                  :class="{ paused: protocol.isPaused.value }"
                  cx="24" cy="24"
                  :r="ringRadius"
                  fill="none"
                  stroke-width="3"
                  stroke-linecap="round"
                  :stroke-dasharray="ringCircumference"
                  :stroke-dashoffset="ringOffset"
                  transform="rotate(-90 24 24)"
                />
              </svg>
              <span class="countdown-number" :class="{ paused: protocol.isPaused.value }">
                {{ protocol.countdown.value }}
              </span>
            </div>
            <div class="timer-meta">
              <span class="timer-label">{{ t('catalog.protocol.timerLabel') }}</span>
              <span class="timer-status" :class="protocol.isPaused.value ? 'paused' : 'running'">
                {{ protocol.isPaused.value ? t('catalog.protocol.autoPaused') : t('catalog.protocol.autoActive') }}
              </span>
            </div>
          </div>

          <!-- Interval selector -->
          <div class="interval-selector">
            <span class="interval-label">{{ t('catalog.protocol.intervalLabel') }}</span>
            <div class="interval-options">
              <button
                v-for="opt in INTERVAL_OPTIONS"
                :key="opt"
                class="interval-btn"
                :class="{ active: protocol.interval.value === opt }"
                @click="protocol.setIntervalOption(opt)"
              >
                {{ opt }}{{ t('catalog.protocol.intervalUnit') }}
              </button>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="auto-actions">
            <button class="action-btn pause-btn" @click="protocol.togglePause()">
              <Pause v-if="!protocol.isPaused.value" :size="14" fill="currentColor" />
              <Play v-else :size="14" fill="currentColor" />
              {{ protocol.isPaused.value ? t('catalog.protocol.resume') : t('catalog.protocol.pause') }}
            </button>
            <button class="action-btn shuffle-btn" @click="protocol.shuffle()" :disabled="protocol.transitioning.value">
              <RefreshCw :size="14" :class="{ spinning: protocol.transitioning.value }" />
              {{ t('catalog.protocol.shuffle') }}
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Loading State -->
    <div v-if="crawler.loading && !crawler.hasData" class="loading-state">
      <div class="skeleton shimmer" v-for="i in 10" :key="i" :style="{ animationDelay: `${i * 100}ms` }" />
    </div>

    <!-- Error State -->
    <div v-else-if="crawler.error && !crawler.hasData" class="error-state">
      <TriangleAlert class="error-icon" :size="48" />
      <p>{{ crawler.error }}</p>
      <button class="retry-btn" @click="crawler.fetchEntries()">Retry</button>
    </div>

    <!-- No Data State -->
    <div v-else-if="!crawler.hasData && !crawler.loading" class="empty-state">
      <SearchX class="empty-icon" :size="48" />
      <p>No data available yet.</p>
      <p class="empty-hint">The index is being prepared. Please check back later.</p>
    </div>

    <!-- Data Loaded -->
    <template v-else>
      <!-- Auto-Operation Mode: Recommended Entries -->
      <template v-if="protocol.mode.value === 'auto'">
        <div class="results-info">
          <span class="results-count">
            {{ t('catalog.protocol.recommended') }}
          </span>
          <span class="auto-lang-indicator">
            {{ protocol.crawlerLang.value === 'en' ? 'EN — SCP Wiki' : 'CN — SCP基金会' }}
          </span>
        </div>

        <!-- Loading Recommendations -->
        <div v-if="protocol.loadingRecommendations.value && protocol.recommendedEntries.value.length === 0" class="loading-state">
          <div class="skeleton shimmer" v-for="i in 6" :key="i" :style="{ animationDelay: `${i * 100}ms` }" />
        </div>

        <!-- Transition overlay -->
        <div v-else-if="protocol.transitioning.value" class="transition-overlay">
          <div class="transition-scanner" />
        </div>

        <!-- Recommended Entries Grid -->
        <div v-else class="entries-grid stagger-children" :key="protocol.cardEntranceKey.value">
          <router-link
            v-for="(entry, idx) in protocol.recommendedEntries.value"
            :key="entry.scpNumber"
            :to="'/entry/' + protocol.crawlerLang.value + '/' + entry.scpNumber"
            class="entry-card"
            :class="entry.objectClass.toLowerCase()"
            :style="{ animationDelay: `${idx * 80}ms` }"
          >
            <!-- Class-colored accent bar -->
            <div class="card-accent" />

            <div class="entry-card-header">
              <div class="entry-id-wrap">
                <ClassBar :object-class="entry.objectClass as ObjectClass" />
                <span class="entry-id">SCP-{{ String(entry.scpNumber).padStart(3, '0') }}</span>
              </div>
              <Badge :variant="entry.objectClass.toLowerCase() as any">
                {{ entry.objectClass }}
              </Badge>
            </div>
            <h3 class="entry-name">{{ entry.name || `SCP-${entry.scpNumber}` }}</h3>
            <div class="entry-card-footer">
              <span class="entry-series">Series {{ entry.series }}</span>
              <ArrowRight class="entry-arrow" :size="14" />
            </div>
          </router-link>
        </div>

        <!-- Entries count -->
        <div v-if="protocol.recommendedEntries.value.length > 0" class="entries-loaded-info">
          {{ t('catalog.protocol.entriesLoaded', { count: protocol.recommendedEntries.value.length }) }}
        </div>
      </template>

      <!-- Manual-Operation Mode: Normal Catalog -->
      <template v-else>
        <div class="filters">
          <div class="search-wrap">
            <Search :size="16" />
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

        <div class="entries-list stagger-children">
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
            <ArrowLeft :size="16" /> Prev
          </button>
          <span class="page-info">
            Page {{ crawler.page }} of {{ crawler.totalPages }}
          </span>
          <button
            class="page-btn"
            :disabled="crawler.page >= crawler.totalPages"
            @click="crawler.setPage(crawler.page + 1)"
          >
            Next <ArrowRight :size="16" />
          </button>
        </div>

        <div v-if="crawler.entries.length === 0 && !crawler.loading" class="empty-state">
          <SearchX class="empty-icon" :size="48" />
          <p>{{ t('catalog.empty') }}</p>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.catalog {
  max-width: var(--max-content);
  margin: 0 auto;
}

/* ═══ Protocol Panel ═══ */
.protocol-panel {
  position: relative;
  margin-bottom: var(--space-lg);
  padding: var(--space-lg);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  opacity: 0;
  transform: translateY(12px);
  transition: all 600ms var(--ease-out-expo);
}

.protocol-panel.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Scanner line */
.scanner-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
  opacity: 0;
  pointer-events: none;
}

.scanner-line.active {
  opacity: 1;
  animation: scanner-sweep 3s ease-in-out infinite;
}

@keyframes scanner-sweep {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

/* Panel top row */
.protocol-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
}

.protocol-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.protocol-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-muted);
  color: var(--color-primary);
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.protocol-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.protocol-divider {
  width: 1px;
  height: 16px;
  background: var(--border-subtle);
}

.protocol-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.protocol-status.active {
  color: var(--color-success);
}

.protocol-status.paused {
  color: var(--color-accent);
}

.protocol-status.idle {
  color: var(--text-tertiary);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.protocol-status.active .status-dot {
  animation: status-pulse 2s ease-in-out infinite;
  box-shadow: 0 0 6px currentColor;
}

@keyframes status-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Segmented toggle */
.protocol-segment {
  flex-shrink: 0;
}

.segment-track {
  position: relative;
  display: flex;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  padding: 3px;
  gap: 2px;
}

.segment-indicator {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 4px);
  height: calc(100% - 6px);
  background: var(--color-primary-muted);
  border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  border-radius: var(--radius-full);
  transition: all 300ms var(--ease-out-expo);
  pointer-events: none;
}

.segment-indicator.right {
  transform: translateX(calc(100% + 2px));
}

.segment-option {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: color var(--transition-fast);
  white-space: nowrap;
}

.segment-option:hover {
  color: var(--text-secondary);
}

.segment-option.active {
  color: var(--color-primary);
}

.segment-option svg {
  flex-shrink: 0;
}

/* Description */
.protocol-desc {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
  margin-bottom: 0;
}

/* ═══ Auto-Operation Controls ═══ */
.auto-controls {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-subtle);
}

/* Slide transition for auto controls */
.slide-enter-active {
  transition: all 400ms var(--ease-out-expo);
}

.slide-leave-active {
  transition: all 200ms ease-in;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
}

.slide-enter-to {
  opacity: 1;
  transform: translateY(0);
  max-height: 200px;
}

.slide-leave-from {
  opacity: 1;
  max-height: 200px;
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
}

/* Timer group */
.auto-timer-group {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.countdown-ring-wrap {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.countdown-ring {
  position: absolute;
  inset: 0;
}

.ring-bg {
  stroke: var(--border-subtle);
}

.ring-progress {
  stroke: var(--color-primary);
  transition: stroke-dashoffset 1s linear;
  filter: drop-shadow(0 0 4px var(--color-primary-muted));
}

.ring-progress.paused {
  stroke: var(--text-tertiary);
  filter: none;
}

.countdown-number {
  position: relative;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
}

.countdown-number.paused {
  color: var(--text-tertiary);
}

.timer-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timer-label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.timer-status {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.timer-status.running {
  color: var(--color-success);
}

.timer-status.paused {
  color: var(--color-accent);
}

/* Interval selector */
.interval-selector {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.interval-label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.interval-options {
  display: flex;
  gap: 2px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.interval-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.interval-btn:hover {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

.interval-btn.active {
  color: var(--color-primary);
  background: var(--color-primary-muted);
}

/* Action buttons */
.auto-actions {
  display: flex;
  gap: var(--space-sm);
  margin-left: auto;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.action-btn:hover {
  border-color: var(--border-default);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.action-btn:active {
  transform: translateY(0);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.pause-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.shuffle-btn {
  border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
  color: var(--color-primary);
}

.shuffle-btn:hover {
  background: var(--color-primary-muted);
  border-color: var(--color-primary);
}

.shuffle-btn svg.spinning {
  animation: spin 600ms linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ═══ Entries Grid (Auto Mode) ═══ */
.entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md);
}

.entry-card {
  position: relative;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  padding-top: calc(var(--space-lg) + 2px);
  text-decoration: none;
  transition: all 400ms var(--ease-out-expo);
  overflow: hidden;
  animation: card-entrance 500ms var(--ease-out-expo) backwards;
}

@keyframes card-entrance {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Class-colored accent bar */
.card-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-primary);
  transition: height 300ms var(--ease-out-expo);
}

.entry-card.safe .card-accent { background: var(--class-safe); }
.entry-card.euclid .card-accent { background: var(--class-euclid); }
.entry-card.keter .card-accent { background: var(--class-keter); }
.entry-card.thaumiel .card-accent { background: var(--class-thaumiel); }
.entry-card.apollyon .card-accent { background: var(--class-neutralized); }
.entry-card.neutralized .card-accent { background: var(--class-neutralized); }

.entry-card:hover {
  border-color: var(--border-default);
  box-shadow: var(--shadow-md), 0 0 0 1px var(--color-primary-muted);
  transform: translateY(-4px);
}

.entry-card:hover .card-accent {
  height: 4px;
}

.entry-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.entry-card .entry-name {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
  transition: color var(--transition-fast);
  line-height: var(--leading-tight);
}

.entry-card:hover .entry-name {
  color: var(--color-primary);
}

.entry-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border-subtle);
}

.entry-series {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.entry-arrow {
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
}

.entry-card:hover .entry-arrow {
  color: var(--color-primary);
  transform: translateX(3px);
}

.entries-loaded-info {
  text-align: center;
  margin-top: var(--space-md);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  letter-spacing: 0.04em;
}

/* Transition overlay */
.transition-overlay {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.transition-scanner {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--bg-surface), transparent);
  animation: scan-fade 300ms ease-out;
}

@keyframes scan-fade {
  from { opacity: 0.8; }
  to { opacity: 0; }
}

.auto-lang-indicator {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.page-header {
  margin-bottom: var(--space-xl);
  animation: fade-up 600ms var(--ease-out-expo) backwards;
}

.page-header h1 {
  margin-bottom: var(--space-sm);
}

.page-desc {
  color: var(--text-secondary);
  font-size: var(--text-lg);
}

/* ═══ Language Bar ═══ */
.lang-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
  animation: fade-up 600ms var(--ease-out-expo) 100ms backwards;
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
  transform: translateY(-1px);
}

.lang-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary-muted);
  color: var(--color-primary);
  box-shadow: 0 0 12px var(--color-primary-muted);
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

/* ═══ Filters ═══ */
.filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  animation: fade-up 600ms var(--ease-out-expo) 200ms backwards;
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
  transition: all var(--transition-fast);
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
  transform: translateY(-1px);
}

.class-filter-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary-muted);
  box-shadow: 0 0 12px var(--color-primary-muted);
}

/* ═══ Results Info ═══ */
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

/* ═══ Entries List (Manual Mode) ═══ */
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
  transition: all 400ms var(--ease-out-expo);
  position: relative;
  overflow: hidden;
}

.entry-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: var(--color-primary);
  transition: width 300ms var(--ease-out-expo);
}

.entry-row:hover {
  border-color: var(--color-primary);
  box-shadow: 0 0 20px var(--color-primary-muted);
  transform: translateX(4px);
}

.entry-row:hover::before {
  width: 3px;
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
  transition: color var(--transition-fast);
}

.entry-row:hover .entry-name {
  color: var(--color-primary);
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

/* ═══ Pagination ═══ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-md);
  margin-top: var(--space-xl);
  padding: var(--space-lg) 0;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
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
  transform: translateY(-1px);
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

/* ═══ States ═══ */
.loading-state {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.skeleton {
  height: 80px;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
}

.shimmer {
  background: linear-gradient(
    90deg,
    var(--bg-surface) 25%,
    var(--bg-elevated) 50%,
    var(--bg-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.error-state {
  text-align: center;
  padding: var(--space-3xl);
  animation: fade-up 600ms var(--ease-out-expo) backwards;
}

.error-icon {
  color: var(--color-danger);
  display: inline-block;
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
  transition: all var(--transition-fast);
}

.retry-btn:hover {
  background: color-mix(in srgb, var(--color-danger) 90%, white);
  transform: translateY(-1px);
}

.empty-state {
  text-align: center;
  padding: var(--space-3xl);
  animation: fade-up 600ms var(--ease-out-expo) backwards;
}

.empty-icon {
  color: var(--text-tertiary);
  display: inline-block;
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

  .protocol-top {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .auto-controls {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-md);
  }

  .auto-actions {
    margin-left: 0;
  }

  .entries-grid {
    grid-template-columns: 1fr;
  }
}
</style>
