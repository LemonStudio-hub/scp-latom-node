<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import Badge from '@/components/common/Badge.vue'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const editingCodename = ref(false)
const changingPassword = ref(false)
const newCodename = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const confirmNew = ref('')
const localError = ref('')
const successMsg = ref('')

onMounted(() => {
  if (!auth.isAuthenticated) {
    router.push('/login')
  }
})

function startEditCodename() {
  newCodename.value = auth.user?.codename || ''
  editingCodename.value = true
  localError.value = ''
  auth.error = ''
  successMsg.value = ''
}

async function saveCodename() {
  localError.value = ''
  auth.error = ''
  successMsg.value = ''
  if (!newCodename.value.trim()) return
  const ok = await auth.updateProfile({ codename: newCodename.value.trim() })
  if (ok) {
    editingCodename.value = false
    successMsg.value = t('auth.codenameUpdated')
  }
}

async function savePassword() {
  localError.value = ''
  auth.error = ''
  successMsg.value = ''
  if (newPassword.value.length < 8) {
    localError.value = t('auth.errors.passwordLength')
    return
  }
  if (newPassword.value !== confirmNew.value) {
    localError.value = t('auth.errors.passwordMismatch')
    return
  }
  const ok = await auth.updateProfile({ password: currentPassword.value, newPassword: newPassword.value })
  if (ok) {
    changingPassword.value = false
    currentPassword.value = ''
    newPassword.value = ''
    confirmNew.value = ''
    successMsg.value = t('auth.passwordUpdated')
  }
}

function handleLogout() {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <div class="m-profile" v-if="auth.user">
    <!-- User Card -->
    <div class="m-user-card">
      <div class="m-user-avatar">{{ auth.user.codename.charAt(0).toUpperCase() }}</div>
      <div class="m-user-info">
        <h2>{{ auth.user.codename }}</h2>
        <Badge variant="info">{{ auth.user.role }}</Badge>
      </div>
    </div>

    <!-- Info -->
    <div class="m-info-card">
      <div class="m-info-row">
        <span class="m-info-label">{{ t('auth.clearance') }}</span>
        <span class="m-info-value clearance">{{ auth.user.clearance }}</span>
      </div>
      <div class="m-info-row">
        <span class="m-info-label">{{ t('auth.role') }}</span>
        <span class="m-info-value">{{ auth.user.role }}</span>
      </div>
      <div class="m-info-row" v-if="auth.user.created_at">
        <span class="m-info-label">{{ t('auth.joinedAt') }}</span>
        <span class="m-info-value">{{ auth.user.created_at }}</span>
      </div>
    </div>

    <!-- Edit Codename -->
    <div class="m-edit-card">
      <div class="m-edit-header">
        <h3>{{ t('auth.editCodename') }}</h3>
        <button v-if="!editingCodename" class="m-edit-btn" @click="startEditCodename">
          {{ t('auth.edit') }}
        </button>
      </div>
      <div v-if="editingCodename" class="m-edit-form">
        <input v-model="newCodename" type="text" spellcheck="false" />
        <div class="m-edit-actions">
          <button class="m-save-btn" @click="saveCodename" :disabled="auth.loading">{{ t('auth.save') }}</button>
          <button class="m-cancel-btn" @click="editingCodename = false">{{ t('auth.cancel') }}</button>
        </div>
      </div>
      <div v-else class="m-current-value">
        <span class="mono">{{ auth.user.codename }}</span>
      </div>
    </div>

    <!-- Change Password -->
    <div class="m-edit-card">
      <div class="m-edit-header">
        <h3>{{ t('auth.changePassword') }}</h3>
        <button v-if="!changingPassword" class="m-edit-btn" @click="changingPassword = true; localError = ''; auth.error = ''; successMsg = ''">
          {{ t('auth.edit') }}
        </button>
      </div>
      <div v-if="changingPassword" class="m-edit-form">
        <div class="m-form-group">
          <label>{{ t('auth.currentPassword') }}</label>
          <input v-model="currentPassword" type="password" autocomplete="current-password" />
        </div>
        <div class="m-form-group">
          <label>{{ t('auth.newPassword') }}</label>
          <input v-model="newPassword" type="password" autocomplete="new-password" />
        </div>
        <div class="m-form-group">
          <label>{{ t('auth.confirmPassword') }}</label>
          <input v-model="confirmNew" type="password" autocomplete="new-password" />
        </div>
        <div class="m-edit-actions">
          <button class="m-save-btn" @click="savePassword" :disabled="auth.loading">{{ t('auth.save') }}</button>
          <button class="m-cancel-btn" @click="changingPassword = false; localError = ''">{{ t('auth.cancel') }}</button>
        </div>
      </div>
      <div v-else class="m-current-value">
        <span class="mono">••••••••</span>
      </div>
    </div>

    <!-- Status Messages -->
    <Transition name="fade">
      <div v-if="localError || auth.error" class="m-error">
        <span>⚠</span> {{ localError || auth.error }}
      </div>
    </Transition>
    <Transition name="fade">
      <div v-if="successMsg" class="m-success">
        <span>✓</span> {{ successMsg }}
      </div>
    </Transition>

    <!-- Logout -->
    <button class="m-logout" @click="handleLogout">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      {{ t('auth.logout') }}
    </button>
  </div>
</template>

<style scoped>
.m-profile {
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.m-user-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.m-user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary-muted);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xl);
  font-weight: 700;
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.m-user-info h2 {
  font-size: var(--text-lg);
  margin-bottom: 2px;
}

.m-info-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.m-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  font-size: var(--text-sm);
}

.m-info-row:not(:last-child) {
  border-bottom: 1px solid var(--border-subtle);
}

.m-info-label {
  color: var(--text-tertiary);
}

.m-info-value {
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.m-info-value.clearance {
  color: var(--color-primary);
  font-weight: 600;
}

.m-edit-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.m-edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.m-edit-header h3 {
  font-size: var(--text-base);
}

.m-edit-btn {
  padding: 4px 14px;
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-xs);
}

.m-edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.m-edit-form input {
  height: 44px;
  padding: 0 var(--space-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 16px;
}

.m-edit-form input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.m-form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.m-form-group label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.m-form-group input {
  height: 44px;
  padding: 0 var(--space-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 16px;
}

.m-form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.m-edit-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
}

.m-save-btn {
  flex: 1;
  height: 44px;
  background: var(--color-primary);
  color: var(--text-inverse);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
}

.m-save-btn:disabled {
  opacity: 0.6;
}

.m-cancel-btn {
  flex: 1;
  height: 44px;
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.m-current-value {
  padding: var(--space-sm) 0;
}

.mono {
  font-family: var(--font-mono);
  color: var(--text-secondary);
}

.m-error {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-danger-muted);
  border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-danger);
}

.m-success {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-success-muted);
  border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-success);
}

.m-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  width: 100%;
  height: 48px;
  background: transparent;
  color: var(--color-danger);
  border: 1px solid var(--color-danger-muted);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
}
</style>
