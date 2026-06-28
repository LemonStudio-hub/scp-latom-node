<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  value: string | number
  icon?: string | Component
  trend?: string
  trendUp?: boolean
}>()
</script>

<template>
  <div class="admin-card stats-card">
    <div class="admin-card-header">
      <span class="admin-card-title">{{ label }}</span>
      <component v-if="icon && typeof icon !== 'string'" :is="icon" class="stats-icon" :size="22" />
      <span v-else-if="icon" class="stats-icon">{{ icon }}</span>
    </div>
    <div class="admin-card-value">{{ value }}</div>
    <div v-if="trend" class="stats-trend" :class="{ up: trendUp, down: !trendUp }">
      {{ trend }}
    </div>
  </div>
</template>

<style scoped>
.stats-card {
  position: relative;
  overflow: hidden;
}

.stats-icon {
  opacity: 0.3;
}

.stats-trend {
  margin-top: var(--space-xs);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
}

.stats-trend.up {
  color: var(--color-success);
}

.stats-trend.down {
  color: var(--color-danger);
}
</style>
