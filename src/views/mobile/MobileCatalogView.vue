<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCrawlerStore } from '@/stores/crawler'
import { useEntryProtocol, INTERVAL_OPTIONS } from '@/composables/useEntryProtocol'
import Badge from '@/components/common/Badge.vue'
import ClassBar from '@/components/common/ClassBar.vue'
import { Search, SearchX, Shield, Pause, Play, RefreshCw, TriangleAlert } from 'lucide-vue-next'
import type { ObjectClass } from '@/types'
import type { ProtocolMode } from '@/composables/useEntryProtocol'

const { t } = useI18n()
const crawler = useCrawlerStore()
const protocol = useEntryProtocol()

const searchQuery = ref('')
const activeClass = ref<ObjectClass | null>(null)

const objectClasses: ObjectClass[] = ['Safe', 'Euclid', 'Keter', 'Thaumiel', 'Apollyon', 'Neutralized']

// SVG ring dimensions
const ringRadius = 16
const ringCircumference = 2 * Math.PI * ringRadius
const ringOffset = computed(() => {
  return ringCircumference * (1 - protocol.countdownProgress.value)
})

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

function switchProtocol(mode: ProtocolMode) {
  protocol.setMode(mode)
}

onMounted(async () => {
  crawler.init()

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
  <div class="m-catalog">
    <!-- Sticky Search -->
    <div class="m-search-bar">
      <div class="m-search-wrap">
        <Search :size="16" />
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

    <!-- Protocol Mode Panel -->
    <div class="m-protocol-panel">
      <!-- Scanner effect -->
      <div class="m-scanner-line" :class="{ active: protocol.mode.value === 'auto' && !protocol.isPaused.value }" />

      <!-- Header row -->
      <div class="m-protocol-top">
        <div class="m-protocol-title-row">
          <span class="m-protocol-icon-wrap">
            <Shield :size="12" />
          </span>
          <span class="m-protocol-label">{{ t('catalog.protocol.title') }}</span>
          <span class="m-protocol-status" :class="protocol.mode.value === 'auto' ? (protocol.isPaused.value ? 'paused' : 'active') : 'idle'">
            <span class="m-status-dot" />
            {{ protocol.mode.value === 'auto' ? (protocol.isPaused.value ? t('catalog.protocol.scannerPaused') : t('catalog.protocol.scannerActive')) : 'STANDBY' }}
          </span>
        </div>

        <!-- Segmented toggle -->
        <div class="m-segment-track">
          <div class="m-segment-indicator" :class="{ right: protocol.mode.value === 'manual' }" />
          <button
            class="m-segment-option"
            :class="{ active: protocol.mode.value === 'auto' }"
            @click="switchProtocol('auto')"
          >
            {{ t('catalog.protocol.auto') }}
          </button>
          <button
            class="m-segment-option"
            :class="{ active: protocol.mode.value === 'manual' }"
            @click="switchProtocol('manual')"
          >
            {{ t('catalog.protocol.manual') }}
          </button>
        </div>
      </div>

      <p class="m-protocol-desc">
        {{ protocol.mode.value === 'auto' ? t('catalog.protocol.autoDesc') : t('catalog.protocol.manualDesc') }}
      </p>

      <!-- Auto-Operation Controls -->
      <Transition name="m-slide">
        <div v-if="protocol.mode.value === 'auto'" class="m-auto-controls">
          <div class="m-auto-row">
            <!-- Countdown ring -->
            <div class="m-countdown-group">
              <div class="m-countdown-ring-wrap">
                <svg class="m-countdown-ring" :width="40" :height="40" viewBox="0 0 40 40">
                  <circle
                    class="m-ring-bg"
                    cx="20" cy="20"
                    :r="ringRadius"
                    fill="none"
                    stroke-width="2.5"
                  />
                  <circle
                    class="m-ring-progress"
                    :class="{ paused: protocol.isPaused.value }"
                    cx="20" cy="20"
                    :r="ringRadius"
                    fill="none"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    :stroke-dasharray="ringCircumference"
                    :stroke-dashoffset="ringOffset"
                    transform="rotate(-90 20 20)"
                  />
                </svg>
                <span class="m-countdown-number" :class="{ paused: protocol.isPaused.value }">
                  {{ protocol.countdown.value }}
                </span>
              </div>
              <div class="m-timer-meta">
                <span class="m-timer-status" :class="protocol.isPaused.value ? 'paused' : 'running'">
                  {{ protocol.isPaused.value ? t('catalog.protocol.autoPaused') : t('catalog.protocol.autoActive') }}
                </span>
              </div>
            </div>

            <!-- Interval selector -->
            <div class="m-interval-group">
              <span class="m-interval-label">{{ t('catalog.protocol.intervalLabel') }}</span>
              <div class="m-interval-options">
                <button
                  v-for="opt in INTERVAL_OPTIONS"
                  :key="opt"
                  class="m-interval-btn"
                  :class="{ active: protocol.interval.value === opt }"
                  @click="protocol.setIntervalOption(opt)"
                >
                  {{ opt }}s
                </button>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="m-auto-actions">
            <button class="m-action-btn m-pause-btn" @click="protocol.togglePause()">
              <Pause v-if="!protocol.isPaused.value" :size="12" fill="currentColor" />
              <Play v-else :size="12" fill="currentColor" />
              {{ protocol.isPaused.value ? t('catalog.protocol.resume') : t('catalog.protocol.pause') }}
            </button>
            <button class="m-action-btn m-shuffle-btn" @click="protocol.shuffle()" :disabled="protocol.transitioning.value">
              <RefreshCw :size="12" :class="{ spinning: protocol.transitioning.value }" />
              {{ t('catalog.protocol.shuffle') }}
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Class Filter Pills (Manual Mode) -->
    <div v-if="protocol.mode.value === 'manual'" class="m-filter-scroll">
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
      <TriangleAlert class="m-error-icon" :size="40" />
      <p>{{ crawler.error }}</p>
      <button class="m-retry-btn" @click="crawler.fetchEntries()">Retry</button>
    </div>

    <!-- No Data -->
    <div v-else-if="!crawler.hasData && !crawler.loading" class="m-empty">
      <SearchX class="m-empty-icon" :size="40" />
      <p>No data available yet.</p>
    </div>

    <!-- Results -->
    <template v-else>
      <!-- Auto-Operation Mode: Recommended Entries -->
      <template v-if="protocol.mode.value === 'auto'">
        <div class="m-results-info">
          <span>{{ t('catalog.protocol.recommended') }}</span>
          <span class="m-auto-lang-indicator">
            {{ protocol.crawlerLang.value === 'en' ? 'EN' : 'CN' }}
          </span>
        </div>

        <!-- Loading Recommendations -->
        <div v-if="protocol.loadingRecommendations.value && protocol.recommendedEntries.value.length === 0" class="m-loading">
          <div v-for="i in 4" :key="i" class="m-skeleton m-skeleton-card" />
        </div>

        <!-- Recommended Entries Grid -->
        <div v-else class="m-entry-grid" :key="protocol.cardEntranceKey.value">
          <router-link
            v-for="(entry, idx) in protocol.recommendedEntries.value"
            :key="entry.scpNumber"
            :to="'/entry/' + protocol.crawlerLang.value + '/' + entry.scpNumber"
            class="m-entry-card"
            :class="entry.objectClass.toLowerCase()"
            :style="{ animationDelay: `${idx * 60}ms` }"
          >
            <!-- Class accent bar -->
            <div class="m-card-accent" />

            <div class="m-entry-top">
              <div class="m-entry-id-wrap">
                <ClassBar :object-class="entry.objectClass as ObjectClass" />
                <span class="m-entry-id">SCP-{{ String(entry.scpNumber).padStart(3, '0') }}</span>
              </div>
              <Badge :variant="entry.objectClass.toLowerCase() as any">{{ entry.objectClass }}</Badge>
            </div>
            <h3 class="m-entry-name">{{ entry.name || `SCP-${entry.scpNumber}` }}</h3>
            <div class="m-entry-footer">
              <span class="m-entry-series">Series {{ entry.series }}</span>
            </div>
          </router-link>
        </div>
      </template>

      <!-- Manual-Operation Mode: Normal Catalog -->
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
          <SearchX class="m-empty-icon" :size="40" />
          <p>{{ t('catalog.empty') }}</p>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.m-catalog {
  padding: var(--space-md);
}

/* ═══ Search Bar ═══ */
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

/* ═══ Language Selector ═══ */
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

/* ═══ Protocol Panel ═══ */
.m-protocol-panel {
  position: relative;
  margin-bottom: var(--space-md);
  padding: var(--space-md);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* Scanner line */
.m-scanner-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
  opacity: 0;
  pointer-events: none;
}

.m-scanner-line.active {
  opacity: 1;
  animation: m-scanner-sweep 3s ease-in-out infinite;
}

@keyframes m-scanner-sweep {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

/* Panel top */
.m-protocol-top {
  margin-bottom: var(--space-xs);
}

.m-protocol-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-sm);
}

.m-protocol-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: var(--color-primary-muted);
  color: var(--color-primary);
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.m-protocol-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.m-protocol-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin-left: auto;
}

.m-protocol-status.active { color: var(--color-success); }
.m-protocol-status.paused { color: var(--color-accent); }

.m-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.m-protocol-status.active .m-status-dot {
  animation: m-status-pulse 2s ease-in-out infinite;
  box-shadow: 0 0 6px currentColor;
}

@keyframes m-status-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Segmented toggle */
.m-segment-track {
  position: relative;
  display: flex;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  padding: 3px;
  gap: 2px;
}

.m-segment-indicator {
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

.m-segment-indicator.right {
  transform: translateX(calc(100% + 2px));
}

.m-segment-option {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 6px 10px;
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
  text-align: center;
}

.m-segment-option.active {
  color: var(--color-primary);
}

/* Description */
.m-protocol-desc {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
  margin-bottom: 0;
}

/* ═══ Auto-Operation Controls ═══ */
.m-auto-controls {
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border-subtle);
}

.m-slide-enter-active {
  transition: all 400ms var(--ease-out-expo);
}

.m-slide-leave-active {
  transition: all 200ms ease-in;
}

.m-slide-enter-from,
.m-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
}

.m-slide-enter-to,
.m-slide-leave-from {
  opacity: 1;
  max-height: 300px;
}

.m-auto-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
}

/* Countdown ring */
.m-countdown-group {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.m-countdown-ring-wrap {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-countdown-ring {
  position: absolute;
  inset: 0;
}

.m-ring-bg {
  stroke: var(--border-subtle);
}

.m-ring-progress {
  stroke: var(--color-primary);
  transition: stroke-dashoffset 1s linear;
  filter: drop-shadow(0 0 3px var(--color-primary-muted));
}

.m-ring-progress.paused {
  stroke: var(--text-tertiary);
  filter: none;
}

.m-countdown-number {
  position: relative;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
}

.m-countdown-number.paused {
  color: var(--text-tertiary);
}

.m-timer-meta {
  display: flex;
  flex-direction: column;
}

.m-timer-status {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.m-timer-status.running { color: var(--color-success); }
.m-timer-status.paused { color: var(--color-accent); }

/* Interval selector */
.m-interval-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.m-interval-label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.m-interval-options {
  display: flex;
  gap: 2px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 2px;
}

.m-interval-btn {
  padding: 3px 6px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.m-interval-btn.active {
  color: var(--color-primary);
  background: var(--color-primary-muted);
}

/* Action buttons */
.m-auto-actions {
  display: flex;
  gap: var(--space-sm);
}

.m-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: var(--space-xs) var(--space-sm);
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
}

.m-action-btn:active {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.m-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.m-pause-btn:active {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.m-shuffle-btn {
  border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
  color: var(--color-primary);
}

.m-shuffle-btn svg.spinning {
  animation: m-spin 600ms linear infinite;
}

@keyframes m-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ═══ Filter Pills ═══ */
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

/* ═══ Results ═══ */
.m-results-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  margin-bottom: var(--space-sm);
}

.m-auto-lang-indicator {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

/* Entry Grid (Auto Mode) */
.m-entry-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
}

/* Entry List (Manual Mode) */
.m-entry-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

/* Entry Card */
.m-entry-card {
  position: relative;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  padding-top: calc(var(--space-md) + 2px);
  text-decoration: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all var(--transition-fast);
}

/* Card entrance animation (auto mode grid) */
.m-entry-grid .m-entry-card {
  animation: m-card-entrance 400ms var(--ease-out-expo) backwards;
}

@keyframes m-card-entrance {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Class accent bar */
.m-card-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.m-entry-card.safe .m-card-accent { background: var(--class-safe); }
.m-entry-card.euclid .m-card-accent { background: var(--class-euclid); }
.m-entry-card.keter .m-card-accent { background: var(--class-keter); }
.m-entry-card.thaumiel .m-card-accent { background: var(--class-thaumiel); }
.m-entry-card.apollyon .m-card-accent { background: var(--class-neutralized); }
.m-entry-card.neutralized .m-card-accent { background: var(--class-neutralized); }

.m-entry-card:active {
  border-color: var(--color-primary);
}

.m-entry-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
}

.m-entry-id-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.m-entry-id {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-primary);
}

.m-entry-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
  line-height: var(--leading-tight);
}

.m-entry-footer {
  margin-top: var(--space-xs);
  padding-top: var(--space-xs);
  border-top: 1px solid var(--border-subtle);
}

.m-entry-series {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text-tertiary);
}

/* ═══ Loading / Error / Empty ═══ */
.m-loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.m-skeleton {
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  animation: m-pulse 1.5s ease-in-out infinite;
}

.m-skeleton-card { height: 100px; }

@keyframes m-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.m-error {
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
}

.m-error-icon {
  color: var(--color-danger);
  display: inline-block;
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

.m-empty {
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
}

.m-empty-icon {
  color: var(--text-tertiary);
  display: inline-block;
  margin-bottom: var(--space-md);
}

.m-empty p {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}
</style>
