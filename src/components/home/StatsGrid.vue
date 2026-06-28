<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CrawlEntry, CrawlState } from '@/services/crawler'
import { Circle, Database } from 'lucide-vue-next'

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
  { labelKey: 'stats.totalEntries', value: props.total, icon: Database, color: 'var(--color-primary)' },
  { labelKey: 'stats.safe', value: classCounts.value.Safe, icon: Circle, color: 'var(--class-safe)' },
  { labelKey: 'stats.euclid', value: classCounts.value.Euclid, icon: Circle, color: 'var(--class-euclid)' },
  { labelKey: 'stats.keter', value: classCounts.value.Keter, icon: Circle, color: 'var(--class-keter)' },
])
</script>

<template>
  <section class="stats-grid stagger-children">
    <div v-for="(stat, index) in stats" :key="stat.labelKey" class="stat-card" :style="{ '--accent': stat.color }">
      <div class="stat-icon" :style="{ color: stat.color }">
        <component :is="stat.icon" :size="22" :fill="stat.icon === Circle ? 'currentColor' : 'none'" />
      </div>
      <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
      <div class="stat-label">{{ t(stat.labelKey) }}</div>
      <div class="stat-glow"></div>
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
  transition: all 400ms var(--ease-out-expo);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, var(--accent), transparent 70%);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.stat-card:hover {
  border-color: var(--border-default);
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.stat-card:hover::before {
  opacity: 0.1;
}

.stat-glow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.stat-card:hover .stat-glow {
  opacity: 1;
}

.stat-icon {
  margin-bottom: var(--space-xs);
  transition: transform var(--transition-fast);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card:hover .stat-icon {
  transform: scale(1.2);
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: 700;
  font-family: var(--font-mono);
  line-height: 1;
  margin-bottom: var(--space-xs);
  position: relative;
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
  position: relative;
}
</style>
