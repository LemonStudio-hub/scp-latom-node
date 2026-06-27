<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CrawlEntry, CrawlState } from '@/services/crawler'

const { t } = useI18n()

const props = defineProps<{
  total: number
  entries: CrawlEntry[]
  state: CrawlState | null
}>()

const classCounts = computed(() => {
  const counts: Record<string, number> = { Safe: 0, Euclid: 0, Keter: 0, Thaumiel: 0, Apollyon: 0, Neutralized: 0 }
  for (const entry of props.entries) {
    const cls = entry.objectClass
    if (cls in counts) counts[cls]++
  }
  return counts
})

const stats = computed(() => [
  { labelKey: 'stats.totalEntries', value: props.total, icon: '◈', color: 'var(--color-primary)' },
  { labelKey: 'stats.safe', value: classCounts.value.Safe, icon: '●', color: 'var(--class-safe)' },
  { labelKey: 'stats.euclid', value: classCounts.value.Euclid, icon: '●', color: 'var(--class-euclid)' },
  { labelKey: 'stats.keter', value: classCounts.value.Keter, icon: '●', color: 'var(--class-keter)' },
])
</script>

<template>
  <section class="stats-grid">
    <div v-for="stat in stats" :key="stat.labelKey" class="stat-card">
      <div class="stat-icon" :style="{ color: stat.color }">{{ stat.icon }}</div>
      <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
      <div class="stat-label">{{ t(stat.labelKey) }}</div>
    </div>
  </section>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--space-md);
  margin: var(--space-xl) 0;
}

.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  text-align: center;
  transition: all var(--transition-normal);
}

.stat-card:hover {
  border-color: var(--border-default);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  font-size: var(--text-xl);
  margin-bottom: var(--space-xs);
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: 700;
  font-family: var(--font-mono);
  line-height: 1;
  margin-bottom: var(--space-xs);
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
}
</style>
