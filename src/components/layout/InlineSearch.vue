<script setup lang="ts">
import { useSearchStore } from '@/stores/search'
import { useRouter } from 'vue-router'
import { computed, ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSearchResults } from '@/composables/useSearchResults'
import { Search, SearchX, ChevronRight } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'closing-change', value: boolean): void
}>()

const { t } = useI18n()
const search = useSearchStore()
const router = useRouter()

// ─── Inline-expanding search (replaces the old full-screen search modal) ───
const searchWrapRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const shortcutEscMeasureRef = ref<HTMLElement | null>(null)
const shortcutCompactMeasureRef = ref<HTMLElement | null>(null)
const selectedIndex = ref(0)
const showSearchDropdown = ref(false)
const isSearchExpanding = ref(false)
const isSearchDropdownClosing = ref(false)
const isSearchClosing = ref(false)
const useCompactSearchLabel = ref(false)

// Only the short label-swap delay stays as a timer — it has no matching CSS
// transition to hook into (it runs during width/opacity transitions).
const SEARCH_LABEL_SWAP_MS = 70

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent)
const shortcutLabel = computed(() => (isMac ? '⌘K' : 'Ctrl+K'))
const SHORTCUT_KEY_CHROME = {
  esc: 18,
  compact: 16,
}
let searchLabelTimer: ReturnType<typeof window.setTimeout> | undefined
const shortcutEscWidth = ref<number | null>(null)
const shortcutCompactWidth = ref<number | null>(null)

const shortcutKeyStyle = computed(() =>
  (useCompactSearchLabel.value ? shortcutCompactWidth.value : shortcutEscWidth.value)
    ? {
        width: `${useCompactSearchLabel.value ? shortcutCompactWidth.value : shortcutEscWidth.value}px`,
      }
    : undefined,
)
const compactShortcutKeyStyle = computed(() =>
  shortcutCompactWidth.value
    ? {
        width: `${shortcutCompactWidth.value}px`,
      }
    : undefined,
)

function updateShortcutKeyWidth() {
  nextTick(() => {
    if (shortcutEscMeasureRef.value) {
      shortcutEscWidth.value =
        Math.ceil(shortcutEscMeasureRef.value.getBoundingClientRect().width) +
        SHORTCUT_KEY_CHROME.esc
    }
    if (shortcutCompactMeasureRef.value) {
      shortcutCompactWidth.value =
        Math.ceil(shortcutCompactMeasureRef.value.getBoundingClientRect().width) +
        SHORTCUT_KEY_CHROME.compact
    }
  })
}

function clearSearchLabelTimer() {
  if (searchLabelTimer) {
    window.clearTimeout(searchLabelTimer)
    searchLabelTimer = undefined
  }
}

const { searchResults } = useSearchResults()

/**
 * Fires when the search-container's CSS width transition completes.
 * During expand this means the container has grown to full width and the
 * dropdown can be shown; during collapse it means the container has
 * shrunk back so the store can be closed.
 */
function onSearchTransitionEnd(e: TransitionEvent) {
  if (e.propertyName !== 'width' || e.target !== searchWrapRef.value) return

  if (isSearchExpanding.value) {
    isSearchExpanding.value = false
    showSearchDropdown.value = true
  } else if (isSearchClosing.value) {
    search.close()
    search.query = ''
    isSearchExpanding.value = false
    isSearchClosing.value = false
    emit('closing-change', false)
    useCompactSearchLabel.value = false
  }
}

function startSearchWidthCollapse() {
  clearSearchLabelTimer()
  isSearchDropdownClosing.value = false
  isSearchExpanding.value = false
  isSearchClosing.value = true
  emit('closing-change', true)
  useCompactSearchLabel.value = false
  searchLabelTimer = window.setTimeout(() => {
    useCompactSearchLabel.value = true
    searchLabelTimer = undefined
  }, SEARCH_LABEL_SWAP_MS)
}

function onDropdownAfterLeave() {
  if (isSearchDropdownClosing.value) {
    startSearchWidthCollapse()
  }
}

function expandSearch() {
  clearSearchLabelTimer()
  isSearchExpanding.value = true
  isSearchDropdownClosing.value = false
  isSearchClosing.value = false
  emit('closing-change', false)
  useCompactSearchLabel.value = true
  search.open()
  selectedIndex.value = 0
  showSearchDropdown.value = false
  searchLabelTimer = window.setTimeout(() => {
    useCompactSearchLabel.value = false
    searchLabelTimer = undefined
  }, SEARCH_LABEL_SWAP_MS)
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

function collapseSearch() {
  if (!search.isOpen || isSearchClosing.value || isSearchDropdownClosing.value) return

  if (showSearchDropdown.value) {
    isSearchDropdownClosing.value = true
    showSearchDropdown.value = false
    return
  }

  startSearchWidthCollapse()
}

function navigate(targetRoute: string) {
  router.push(targetRoute)
  collapseSearch()
}

function handleSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, searchResults.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter' && searchResults.value[selectedIndex.value]) {
    navigate(searchResults.value[selectedIndex.value].route)
  } else if (e.key === 'Escape') {
    collapseSearch()
  }
}

function onClickOutside(e: MouseEvent) {
  if (search.isOpen && searchWrapRef.value && !searchWrapRef.value.contains(e.target as Node)) {
    collapseSearch()
  }
}

function globalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    if (search.isOpen) {
      collapseSearch()
    } else {
      expandSearch()
    }
  }
}

onMounted(() => {
  updateShortcutKeyWidth()
  window.addEventListener('keydown', globalKeydown)
  window.addEventListener('mousedown', onClickOutside)
})

onUnmounted(() => {
  clearSearchLabelTimer()
  window.removeEventListener('keydown', globalKeydown)
  window.removeEventListener('mousedown', onClickOutside)
})

watch(useCompactSearchLabel, updateShortcutKeyWidth)
</script>

<template>
  <div
    ref="searchWrapRef"
    class="search-container"
    :class="{
      expanded: search.isOpen && !isSearchClosing,
      expanding: isSearchExpanding,
      closing: isSearchClosing,
      'dropdown-open':
        search.isOpen && !isSearchClosing && (showSearchDropdown || isSearchDropdownClosing),
    }"
    @transitionend="onSearchTransitionEnd"
  >
    <span ref="shortcutEscMeasureRef" class="shortcut-measure">ESC</span>
    <span ref="shortcutCompactMeasureRef" class="shortcut-measure">{{ shortcutLabel }}</span>

    <button
      v-if="!search.isOpen && !isSearchClosing"
      class="search-btn"
      :title="t('header.searchTitle')"
      @click="expandSearch"
    >
      <span class="search-icon-slot">
        <Search :size="18" />
      </span>
      <span class="search-label">{{ t('header.searchPlaceholder') }}</span>
      <kbd class="shortcut-key" :style="compactShortcutKeyStyle">{{ shortcutLabel }}</kbd>
    </button>

    <div
      v-else
      class="search-shell"
      :class="{
        closing: isSearchClosing,
        'dropdown-open': showSearchDropdown || isSearchDropdownClosing,
      }"
    >
      <div class="search-input-wrap" @keydown="handleSearchKeydown">
        <span class="search-icon-slot">
          <Search class="search-icon" :size="18" />
        </span>
        <input
          ref="searchInputRef"
          v-model="search.query"
          type="text"
          role="combobox"
          :aria-label="t('header.searchTitle')"
          :aria-expanded="search.isOpen && !isSearchClosing && showSearchDropdown"
          aria-controls="search-results-listbox"
          :aria-activedescendant="
            searchResults[selectedIndex]
              ? `search-result-${searchResults[selectedIndex].id}`
              : undefined
          "
          aria-autocomplete="list"
          :placeholder="
            useCompactSearchLabel ? t('header.searchPlaceholder') : t('search.placeholder')
          "
          class="search-input"
          spellcheck="false"
          autocomplete="off"
        />
        <kbd class="esc-key" :class="{ compact: useCompactSearchLabel }" :style="shortcutKeyStyle">
          <Transition name="shortcut" mode="out-in">
            <span :key="useCompactSearchLabel ? 'shortcut' : 'esc'" class="shortcut-value">
              {{ useCompactSearchLabel ? shortcutLabel : 'ESC' }}
            </span>
          </Transition>
        </kbd>
      </div>

      <Transition name="dropdown" @after-leave="onDropdownAfterLeave">
        <div
          v-if="search.isOpen && showSearchDropdown"
          id="search-results-listbox"
          class="search-dropdown"
          role="listbox"
          :aria-label="t('header.searchTitle')"
        >
          <div v-if="searchResults.length > 0" class="results">
            <div class="results-header">
              <span class="results-count">{{
                t('search.results', { count: searchResults.length })
              }}</span>
            </div>
            <div class="results-list">
              <button
                v-for="(item, i) in searchResults"
                :id="`search-result-${item.id}`"
                :key="item.id"
                class="result-item"
                :class="{ selected: i === selectedIndex }"
                role="option"
                :aria-selected="i === selectedIndex"
                @click="navigate(item.route)"
                @mouseenter="selectedIndex = i"
              >
                <span class="result-type" :class="item.type">
                  {{ item.type === 'entry' ? t('search.scp') : t('search.doc') }}
                </span>
                <div class="result-text">
                  <span class="result-title">{{ item.title }}</span>
                  <span class="result-subtitle">{{ item.subtitle }}</span>
                </div>
                <ChevronRight class="result-arrow" :size="16" />
              </button>
            </div>
          </div>

          <div v-else-if="search.query" class="results empty">
            <div class="empty-state">
              <SearchX class="empty-icon" :size="36" />
              <span class="empty-text">{{ t('search.empty', { query: search.query }) }}</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  --search-radius: 10px;
  --search-key-radius: 6px;
  --search-key-inset: 4px;
  --search-key-height: 28px;
  --search-content-height: 28px;
  --search-width-duration: 220ms;
  --search-dropdown-duration: 180ms;
  --search-dropdown-opacity-duration: 150ms;
  position: relative;
  display: flex;
  justify-content: flex-end;
  width: 42px;
  height: 36px;
  flex-shrink: 0;
  max-width: min(420px, 50vw);
  transition: width var(--search-width-duration) var(--ease-out-expo);
}

.search-container.expanded {
  width: min(420px, 50vw);
}

.search-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  width: 100%;
  box-sizing: border-box;
  padding: 0 var(--search-key-inset);
  border-radius: var(--search-radius);
  background: var(--bg-elevated);
  border: 1px solid var(--color-primary);
  border-bottom-color: var(--color-primary);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  transition: all var(--transition-fast);
}

.search-btn:hover {
  border-color: var(--color-primary);
  color: var(--text-primary);
  background: var(--bg-hover);
}

.search-icon-slot {
  width: var(--search-content-height);
  height: var(--search-content-height);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.search-icon-slot svg {
  color: var(--color-primary);
  flex-shrink: 0;
  display: block;
}

.search-label {
  display: none;
  min-width: 0;
  color: var(--text-tertiary);
  line-height: var(--search-content-height);
}

.search-btn:hover .search-label {
  color: var(--text-primary);
}

.shortcut-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--search-key-height);
  line-height: 1;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .search-container {
    width: 150px;
  }

  .search-label {
    display: inline-flex;
    align-items: center;
    flex: 1;
    justify-content: flex-start;
    height: var(--search-content-height);
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: var(--search-content-height);
    white-space: nowrap;
  }
}

.search-container kbd {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  box-sizing: border-box;
  height: var(--search-key-height);
  padding: 2px 6px;
  border-radius: var(--search-key-radius);
  background: var(--color-primary-muted);
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  display: none;
  overflow: hidden;
  text-align: center;
  line-height: 1;
  white-space: nowrap;
}

.search-container kbd span {
  display: inline-block;
}

.shortcut-key,
.esc-key.compact {
  padding-inline: 7px;
}

@media (min-width: 640px) {
  .search-container kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}

.search-shell {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid var(--color-primary);
  border-radius: var(--search-radius);
  background: var(--bg-elevated);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  height: 34px;
  width: 100%;
  box-sizing: border-box;
  padding: 0 var(--search-key-inset);
  background: transparent;
  transform-origin: right center;
}

.search-input-wrap .search-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  min-width: 0;
  padding-right: 70px;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: var(--text-sm);
  line-height: var(--search-content-height);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.esc-key {
  position: absolute;
  top: 50%;
  right: var(--search-key-inset);
  transform: translateY(-50%);
  flex-shrink: 0;
  display: inline-grid;
  grid-template-areas: 'shortcut';
  align-items: center;
  justify-content: center;
  transition:
    width 180ms var(--ease-out-expo),
    padding 180ms var(--ease-out-expo);
}

.esc-key.compact {
  padding-inline: 7px;
}

.esc-key:not(.compact) {
  padding-inline: 8px;
}

.shortcut-measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.shortcut-value {
  grid-area: shortcut;
  white-space: nowrap;
}

.shortcut-enter-active,
.shortcut-leave-active {
  transition:
    opacity 120ms var(--ease-out-expo),
    transform 160ms var(--ease-out-expo);
}

.shortcut-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.92);
}

.shortcut-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.92);
}

.search-dropdown {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  max-height: 60vh;
  overflow-y: auto;
  background: transparent;
  transform-origin: top center;
  scrollbar-width: none;
}

.search-dropdown::-webkit-scrollbar {
  display: none;
}

.dropdown-enter-active,
.dropdown-leave-active {
  overflow: hidden;
  transition: max-height var(--search-dropdown-duration) var(--ease-out-expo);
}

.dropdown-enter-active .results,
.dropdown-leave-active .results {
  transition:
    opacity var(--search-dropdown-opacity-duration) var(--ease-out-expo),
    transform var(--search-dropdown-duration) var(--ease-out-expo);
}

.dropdown-enter-from,
.dropdown-leave-to {
  max-height: 0;
}

.dropdown-enter-from .results,
.dropdown-leave-to .results {
  opacity: 0;
  transform: translateY(-8px);
}

.results-header {
  padding: var(--space-md) var(--space-md) var(--space-sm);
}

.results-count {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.results-list {
  padding: 0 var(--space-sm) var(--space-sm);
}

.result-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: 10px var(--space-sm);
  border-radius: var(--radius-md);
  text-align: left;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.result-item.selected,
.result-item:hover {
  background: var(--bg-hover);
}

.result-type {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.result-type.entry {
  background: var(--color-primary-muted);
  color: var(--color-primary);
}

.result-type.document {
  background: var(--color-accent-muted);
  color: var(--color-accent);
}

.result-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.result-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.result-subtitle {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-arrow {
  color: var(--color-primary);
  opacity: 0;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.result-item.selected .result-arrow {
  opacity: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xl);
}

.empty-icon {
  color: var(--text-tertiary);
}

.empty-text {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  text-align: center;
}
</style>
