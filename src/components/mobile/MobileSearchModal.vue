<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/search'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, SearchX, X } from 'lucide-vue-next'

const { t } = useI18n()
const search = useSearchStore()
const router = useRouter()
const inputRef = ref<HTMLInputElement | null>(null)
const selectedIndex = ref(0)

const results = computed(() => {
  const items: Array<{ type: string; id: string; title: string; subtitle: string; route: string }> = []
  for (const e of search.filteredEntries) {
    items.push({
      type: 'entry',
      id: e.id,
      title: `SCP-${String(e.number).padStart(3, '0')}`,
      subtitle: t(`entries.${e.id}.name`),
      route: `/entry/${e.id}`,
    })
  }
  for (const d of search.filteredDocuments) {
    items.push({
      type: 'document',
      id: d.id,
      title: t(`docs.${d.id}.title`),
      subtitle: t(`documents.types.${d.type}`),
      route: `/documents`,
    })
  }
  return items
})

watch(() => search.isOpen, async (open) => {
  if (open) {
    selectedIndex.value = 0
    await nextTick()
    inputRef.value?.focus()
  }
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter' && results.value[selectedIndex.value]) {
    navigate(results.value[selectedIndex.value].route)
  }
}

function navigate(route: string) {
  router.push(route)
  search.close()
}

function globalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    search.toggle()
  }
}

onMounted(() => window.addEventListener('keydown', globalKeydown))
onUnmounted(() => window.removeEventListener('keydown', globalKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="search.isOpen" class="search-overlay">
        <div class="search-bar">
          <button class="back-btn" @click="search.close">
            <ChevronLeft :size="20" />
          </button>
          <input
            ref="inputRef"
            v-model="search.query"
            type="text"
            :placeholder="t('search.placeholder')"
            class="search-input"
            spellcheck="false"
            autocomplete="off"
            @keydown="handleKeydown"
          />
          <button v-if="search.query" class="clear-btn" @click="search.query = ''">
            <X :size="16" />
          </button>
        </div>

        <div class="search-results" v-if="results.length > 0">
          <div class="results-count">{{ t('search.results', { count: results.length }) }}</div>
          <button
            v-for="(item, i) in results"
            :key="item.id"
            class="result-item"
            :class="{ selected: i === selectedIndex }"
            @click="navigate(item.route)"
          >
            <span class="result-type" :class="item.type">
              {{ item.type === 'entry' ? t('search.scp') : t('search.doc') }}
            </span>
            <div class="result-text">
              <span class="result-title">{{ item.title }}</span>
              <span class="result-subtitle">{{ item.subtitle }}</span>
            </div>
          </button>
        </div>

        <div class="search-empty" v-else-if="search.query">
          <SearchX class="empty-icon" :size="40" />
          <span class="empty-text">{{ t('search.empty', { query: search.query }) }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.search-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-primary);
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
}

.back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.back-btn:active {
  background: var(--bg-hover);
}

.search-input {
  flex: 1;
  height: 44px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0 var(--space-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  outline: none;
}

.search-input:focus {
  border-color: var(--color-primary);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.clear-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.clear-btn:active {
  color: var(--text-secondary);
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-sm);
}

.results-count {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--space-sm) var(--space-sm) var(--space-xs);
}

.result-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-md);
  border-radius: var(--radius-md);
  text-align: left;
  color: var(--text-secondary);
  transition: background var(--transition-fast);
  min-height: 56px;
}

.result-item:active,
.result-item.selected {
  background: var(--bg-hover);
}

.result-type {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 3px 8px;
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
  gap: 2px;
}

.result-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.result-subtitle {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.search-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
}

.empty-icon {
  color: var(--text-tertiary);
}

.empty-text {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  text-align: center;
  padding: 0 var(--space-xl);
}
</style>
