<script setup lang="ts">
import { onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import StatsCard from '@/components/common/StatsCard.vue'
import { Diamond, FileText, TriangleAlert, Users } from 'lucide-vue-next'

const dashboard = useDashboardStore()

onMounted(() => dashboard.fetchStats())
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <h2>Dashboard</h2>
      <p class="page-desc">System overview and statistics</p>
    </div>

    <div v-if="dashboard.loading && !dashboard.stats" class="loading-state">
      <div class="skeleton" v-for="i in 4" :key="i" style="height: 120px" />
    </div>

    <div v-else-if="dashboard.error" class="error-state">
      <TriangleAlert class="error-icon" :size="48" />
      <p>{{ dashboard.error }}</p>
      <button class="btn btn-ghost" @click="dashboard.fetchStats()">Retry</button>
    </div>

    <template v-else-if="dashboard.stats">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <StatsCard
          label="Total Personnel"
          :value="dashboard.stats.totalUsers"
          :icon="Users"
        />
        <StatsCard
          label="Total Entries"
          :value="(dashboard.stats.entriesByLanguage || []).reduce((s, e) => s + e.count, 0)"
          :icon="FileText"
        />
        <StatsCard
          label="Open Proposals"
          :value="(dashboard.stats.proposalsByStatus || []).find(p => p.status === 'open')?.count || 0"
          :icon="Diamond"
        />
        <StatsCard
          label="Errors (24h)"
          :value="dashboard.stats.recentActivity?.errorsLast24h || 0"
          :icon="TriangleAlert"
        />
      </div>

      <!-- Activity Summary -->
      <div class="dashboard-grid">
        <div class="admin-card">
          <div class="admin-card-header">
            <span class="admin-card-title">Recent Activity</span>
          </div>
          <div class="activity-list">
            <div class="activity-item">
              <span class="activity-label">New users today</span>
              <span class="activity-value">{{ dashboard.stats.recentActivity?.newUsersToday || 0 }}</span>
            </div>
            <div class="activity-item">
              <span class="activity-label">New proposals today</span>
              <span class="activity-value">{{ dashboard.stats.recentActivity?.newProposalsToday || 0 }}</span>
            </div>
            <div class="activity-item">
              <span class="activity-label">Votes today</span>
              <span class="activity-value">{{ dashboard.stats.recentActivity?.newVotesToday || 0 }}</span>
            </div>
            <div class="activity-item">
              <span class="activity-label">Error rate (7d)</span>
              <span class="activity-value">{{ dashboard.stats.logErrorRate?.rate?.toFixed(1) || 0 }}%</span>
            </div>
          </div>
        </div>

        <div class="admin-card">
          <div class="admin-card-header">
            <span class="admin-card-title">Entries by Language</span>
          </div>
          <div class="activity-list">
            <div v-for="entry in (dashboard.stats.entriesByLanguage || [])" :key="entry.language" class="activity-item">
              <span class="activity-label">{{ entry.language.toUpperCase() }}</span>
              <span class="activity-value">{{ entry.count.toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <div class="admin-card">
          <div class="admin-card-header">
            <span class="admin-card-title">Proposals by Status</span>
          </div>
          <div class="activity-list">
            <div v-for="p in (dashboard.stats.proposalsByStatus || [])" :key="p.status" class="activity-item">
              <span class="badge" :class="`badge-${p.status}`">{{ p.status }}</span>
              <span class="activity-value">{{ p.count }}</span>
            </div>
            <div v-if="!(dashboard.stats.proposalsByStatus || []).length" class="activity-item">
              <span class="activity-label" style="color: var(--text-tertiary)">No proposals yet</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: var(--max-content);
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-header h2 {
  margin-bottom: var(--space-xs);
}

.page-desc {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-md);
  margin-top: var(--space-lg);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.activity-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs) 0;
}

.activity-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.activity-value {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: 500;
}

.loading-state {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-md);
}

.error-state {
  text-align: center;
  padding: var(--space-3xl);
}

.error-icon {
  color: var(--color-danger);
  display: inline-block;
  margin-bottom: var(--space-md);
}
</style>
