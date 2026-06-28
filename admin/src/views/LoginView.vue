<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Shield, TriangleAlert } from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()

const codename = ref('')
const password = ref('')

async function handleLogin() {
  const success = await auth.login(codename.value, password.value)
  if (success) {
    router.push('/')
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-brand">
        <div class="brand-icon"><Shield :size="48" :stroke-width="1.75" /></div>
        <h1 class="login-title">Admin Access Terminal</h1>
        <p class="login-subtitle">Level 5 clearance required</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">CODENAME</label>
          <input
            v-model="codename"
            type="text"
            class="input form-input"
            placeholder="Enter codename"
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label class="form-label">PASSWORD</label>
          <input
            v-model="password"
            type="password"
            class="input form-input"
            placeholder="Enter password"
            autocomplete="current-password"
          />
        </div>

        <div v-if="auth.error" class="login-error">
          <TriangleAlert class="error-icon" :size="18" />
          {{ auth.error }}
        </div>

        <button
          type="submit"
          class="btn btn-primary login-btn"
          :disabled="auth.loading || !codename || !password"
        >
          {{ auth.loading ? 'Authenticating...' : 'Authenticate' }}
        </button>
      </form>

      <div class="login-footer">
        <span class="footer-text">SCP FOUNDATION — INTERNAL USE ONLY</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: var(--space-md);
}

.login-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-lg);
}

.login-brand {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.brand-icon {
  color: var(--color-primary);
  margin-bottom: var(--space-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-title {
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.login-subtitle {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-label {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  letter-spacing: 0.05em;
}

.form-input {
  width: 100%;
}

.login-error {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-danger-muted);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-sm);
  color: var(--color-danger);
  font-size: var(--text-sm);
}

.error-icon {
  flex-shrink: 0;
}

.login-btn {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  margin-top: var(--space-sm);
}

.login-footer {
  margin-top: var(--space-xl);
  text-align: center;
}

.footer-text {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  letter-spacing: 0.05em;
}
</style>
