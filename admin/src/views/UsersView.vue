<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import SearchInput from '@/components/common/SearchInput.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Pagination from '@/components/common/Pagination.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { TriangleAlert } from 'lucide-vue-next'

const store = useUsersStore()
const router = useRouter()
const deleteTarget = ref<number | null>(null)

onMounted(() => store.fetchUsers())

function onSearch(q: string) {
  store.setSearch(q)
}

function onRoleFilter(e: Event) {
  store.setRoleFilter((e.target as HTMLSelectElement).value)
}

async function confirmDelete() {
  if (deleteTarget.value !== null) {
    await store.remove(deleteTarget.value)
    deleteTarget.value = null
  }
}

function formatDate(d: string) {
  return new Date(d + 'Z').toLocaleDateString()
}
</script>

<template>
  <div class="users-view">
    <div class="page-header">
      <h2>User Management</h2>
      <p class="page-desc">Manage personnel accounts, roles, and clearance levels</p>
    </div>

    <div class="filter-bar">
      <SearchInput :model-value="store.searchQuery" @update:model-value="onSearch" placeholder="Search by codename..." />
      <select class="select" @change="onRoleFilter">
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="personnel">Personnel</option>
        <option value="banned">Banned</option>
      </select>
      <span class="results-count">{{ store.total }} users</span>
    </div>

    <div v-if="store.loading && !store.users.length" class="loading-state">
      <div class="skeleton" v-for="i in 10" :key="i" style="height: 48px" />
    </div>

    <div v-else-if="store.error" class="error-state">
      <TriangleAlert class="error-icon" :size="48" />
      <p>{{ store.error }}</p>
    </div>

    <template v-else>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Codename</th>
              <th>Role</th>
              <th>Clearance</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in store.users" :key="user.id">
              <td class="cell-mono">{{ user.id }}</td>
              <td>
                <router-link :to="`/users/${user.id}`" class="user-link">{{ user.codename }}</router-link>
              </td>
              <td><StatusBadge :variant="user.role" :label="user.role" /></td>
              <td class="cell-mono">Level {{ user.clearance }}</td>
              <td class="cell-mono">{{ formatDate(user.created_at) }}</td>
              <td>
                <div class="action-btns">
                  <router-link :to="`/users/${user.id}`" class="btn btn-ghost btn-sm">View</router-link>
                  <button v-if="user.role !== 'admin'" class="btn btn-sm" :class="user.role === 'banned' ? 'btn-success' : 'btn-danger'" @click="user.role === 'banned' ? store.unban(user.id) : store.ban(user.id)">
                    {{ user.role === 'banned' ? 'Unban' : 'Ban' }}
                  </button>
                  <button v-if="user.role !== 'admin'" class="btn btn-danger btn-sm" @click="deleteTarget = user.id">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination :page="store.page" :total-pages="store.totalPages" @page-change="store.setPage" />
    </template>

    <ConfirmModal
      v-if="deleteTarget !== null"
      title="Delete User"
      message="This will permanently delete the user and all their data (history, bookmarks, proposals, votes). This action cannot be undone."
      confirm-label="Delete User"
      :loading="store.loading"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<style scoped>
.users-view {
  max-width: var(--max-content);
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-header h2 { margin-bottom: var(--space-xs); }
.page-desc { color: var(--text-tertiary); font-size: var(--text-sm); }

.results-count {
  margin-left: auto;
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.user-link {
  color: var(--color-accent);
  font-weight: 500;
}

.user-link:hover {
  color: var(--color-accent-hover);
  text-decoration: underline;
}

.action-btns {
  display: flex;
  gap: var(--space-xs);
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
