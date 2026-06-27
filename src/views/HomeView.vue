<script setup lang="ts">
import { onMounted } from 'vue'
import { useCrawlerStore } from '@/stores/crawler'
import HeroSection from '@/components/home/HeroSection.vue'
import StatsGrid from '@/components/home/StatsGrid.vue'
import RecentEntries from '@/components/home/RecentEntries.vue'

const crawler = useCrawlerStore()

onMounted(() => {
  if (!crawler.hasData && !crawler.loading) {
    crawler.init()
  }
})
</script>

<template>
  <div class="home">
    <HeroSection />

    <!-- Loading -->
    <div v-if="crawler.loading && !crawler.hasData" class="home-skeleton">
      <div class="skeleton-stats">
        <div v-for="i in 6" :key="i" class="skeleton-card" />
      </div>
      <div class="skeleton-entries">
        <div v-for="i in 4" :key="i" class="skeleton-entry" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="crawler.error && !crawler.hasData" class="home-error">
      <span class="error-icon">⚠</span>
      <p>{{ crawler.error }}</p>
      <button class="retry-btn" @click="crawler.init()">Retry</button>
    </div>

    <!-- Data -->
    <template v-else>
      <StatsGrid
        :total="crawler.total"
        :entries="crawler.entries"
        :state="crawler.state"
      />
      <RecentEntries :entries="crawler.entries" :language="crawler.language" />
    </template>
  </div>
</template>

<style scoped>
.home-skeleton {
  margin-top: var(--space-xl);
}

.skeleton-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-2xl);
}

.skeleton-card {
  height: 100px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-entries {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md);
}

.skeleton-entry {
  height: 180px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.home-error {
  text-align: center;
  padding: var(--space-3xl);
  margin-top: var(--space-xl);
}

.error-icon {
  font-size: 3rem;
  color: var(--color-danger);
  display: block;
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
  font-size: var(--text-sm);
}
</style>
