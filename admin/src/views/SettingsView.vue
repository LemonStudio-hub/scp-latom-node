<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchAdminSettings, type AdminSettings } from '@/services/settings'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { TriangleAlert } from 'lucide-vue-next'

const settings = ref<AdminSettings | null>(null)
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  loading.value = true
  const res = await fetchAdminSettings()
  loading.value = false
  if (res.ok) {
    settings.value = res.data.settings
  } else {
    error.value = res.error
  }
})
</script>

<template>
  <div class="settings-view">
    <div class="page-header">
      <h2>Settings</h2>
      <p class="page-desc">System configuration (read-only)</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="skeleton" style="height: 300px" />
    </div>

    <div v-else-if="error" class="error-state">
      <TriangleAlert class="error-icon" :size="48" />
      <p>{{ error }}</p>
    </div>

    <template v-else-if="settings">
      <!-- Totals -->
      <div class="admin-card">
        <div class="admin-card-header">
          <span class="admin-card-title">Database Totals</span>
        </div>
        <div class="detail-grid">
          <div class="detail-item" v-for="(count, table) in settings.database.tables" :key="table">
            <span class="detail-label">{{ table }}</span>
            <span class="detail-value cell-mono">{{ (count as number).toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- CORS -->
      <div class="admin-card">
        <div class="admin-card-header">
          <span class="admin-card-title">Allowed Origins (CORS)</span>
        </div>
        <div class="cors-list">
          <code v-for="origin in settings.cors" :key="origin" class="cors-item">{{ origin }}</code>
        </div>
      </div>

      <!-- Crawl States -->
      <div class="admin-card" v-if="settings.crawlStates?.length">
        <div class="admin-card-header">
          <span class="admin-card-title">Crawl States</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Language</th><th>Status</th><th>Total Entries</th><th>Last Crawl</th><th>Error</th></tr>
            </thead>
            <tbody>
              <tr v-for="cs in settings.crawlStates" :key="cs.language">
                <td>{{ cs.language?.toUpperCase() }}</td>
                <td><StatusBadge :variant="cs.status === 'idle' ? 'approved' : cs.status === 'error' ? 'rejected' : 'open'" :label="cs.status" /></td>
                <td class="cell-mono">{{ cs.total_entries?.toLocaleString() }}</td>
                <td class="cell-mono">{{ cs.last_crawl ? new Date(cs.last_crawl * 1000).toLocaleString() : '—' }}</td>
                <td style="color: var(--color-danger)">{{ cs.error || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- System Info -->
      <div class="admin-card">
        <div class="admin-card-header">
          <span class="admin-card-title">System Info</span>
        </div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Log Level</span>
            <span class="detail-value">{{ settings.logLevel }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">API Version</span>
            <span class="detail-value cell-mono">v1</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.settings-view { max-width: var(--max-content); margin: 0 auto; }
.page-header { margin-bottom: var(--space-xl); }
.page-header h2 { margin-bottom: var(--space-xs); }
.page-desc { color: var(--text-tertiary); font-size: var(--text-sm); }

.admin-card { margin-bottom: var(--space-md); }

.cors-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.cors-item {
  font-size: var(--text-sm);
}

.table-wrap {
  overflow-x: auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
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
