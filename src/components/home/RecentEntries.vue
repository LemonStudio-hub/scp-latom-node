<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Badge from '@/components/common/Badge.vue'
import ClassBar from '@/components/common/ClassBar.vue'
import type { CrawlEntry } from '@/services/crawler'
import type { ObjectClass } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  entries: CrawlEntry[]
  language: 'en' | 'cn'
}>()

const recent = computed(() => props.entries.slice(0, 4))
</script>

<template>
  <section class="recent">
    <div class="section-header">
      <h2 class="section-title">{{ t('recent.title') }}</h2>
      <router-link to="/catalog" class="section-link">
        {{ t('recent.viewAll') }}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </router-link>
    </div>

    <div v-if="recent.length" class="entries-grid">
      <router-link
        v-for="entry in recent"
        :key="entry.scpNumber"
        :to="'/entry/' + language + '/' + entry.scpNumber"
        class="entry-card"
      >
        <div class="entry-header">
          <span class="entry-id">SCP-{{ String(entry.scpNumber).padStart(3, '0') }}</span>
          <ClassBar :object-class="entry.objectClass as ObjectClass" />
        </div>
        <h3 class="entry-name">{{ entry.name || `SCP-${entry.scpNumber}` }}</h3>
        <div class="entry-footer">
          <Badge :variant="entry.objectClass.toLowerCase() as any">{{ entry.objectClass }}</Badge>
        </div>
      </router-link>
    </div>

    <div v-else class="empty-state">
      <span class="empty-icon">◇</span>
      <p class="empty-text">{{ t('catalog.empty') }}</p>
    </div>
  </section>
</template>

<style scoped>
.recent {
  margin-top: var(--space-2xl);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.section-title {
  font-size: var(--text-xl);
  font-weight: 600;
}

.section-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-sm);
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 500;
}

.section-link:hover {
  color: var(--color-accent-hover);
}

.entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md);
}

.entry-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  text-decoration: none;
  transition: all var(--transition-normal);
  display: flex;
  flex-direction: column;
}

.entry-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 0 20px var(--color-primary-muted);
  transform: translateY(-2px);
}

.entry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
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
  margin-bottom: var(--space-sm);
}

.entry-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-subtle);
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

.empty-text {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}
</style>
