<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const codename = ref('')
const password = ref('')

async function handleSubmit() {
  const ok = await auth.login(codename.value, password.value)
  if (ok) router.push('/')
}
</script>

<template>
  <div class="m-auth">
    <div class="m-auth-header">
      <div class="m-auth-icon">◈</div>
      <h1>{{ t('auth.loginTitle') }}</h1>
      <p>{{ t('auth.loginSubtitle') }}</p>
    </div>

    <form class="m-auth-form" @submit.prevent="handleSubmit">
      <div class="m-form-group">
        <label for="m-codename">{{ t('auth.codename') }}</label>
        <input
          id="m-codename"
          v-model="codename"
          type="text"
          :placeholder="t('auth.codenamePlaceholder')"
          autocomplete="username"
          spellcheck="false"
        />
      </div>

      <div class="m-form-group">
        <label for="m-password">{{ t('auth.password') }}</label>
        <input
          id="m-password"
          v-model="password"
          type="password"
          :placeholder="t('auth.passwordPlaceholder')"
          autocomplete="current-password"
        />
      </div>

      <Transition name="fade">
        <div v-if="auth.error" class="m-error">
          <span>⚠</span> {{ auth.error }}
        </div>
      </Transition>

      <button type="submit" class="m-submit" :disabled="auth.loading">
        <span v-if="auth.loading" class="m-spinner"></span>
        <span v-else>{{ t('auth.loginBtn') }}</span>
      </button>
    </form>

    <div class="m-auth-footer">
      <span>{{ t('auth.noAccount') }}</span>
      <router-link to="/register">{{ t('auth.registerLink') }}</router-link>
    </div>
  </div>
</template>

<style scoped>
.m-auth {
  padding: var(--space-xl) var(--space-md);
  min-height: calc(100vh - 52px - 56px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.m-auth-header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.m-auth-icon {
  font-size: var(--text-3xl);
  color: var(--color-primary);
  margin-bottom: var(--space-sm);
}

.m-auth-header h1 {
  font-size: var(--text-2xl);
  margin-bottom: var(--space-xs);
}

.m-auth-header p {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.m-auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.m-form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.m-form-group label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.m-form-group input {
  height: 48px;
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

.m-form-group input::placeholder {
  color: var(--text-tertiary);
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

.m-submit {
  height: 48px;
  background: var(--color-primary);
  color: var(--text-inverse);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-submit:disabled {
  opacity: 0.6;
}

.m-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.m-auth-footer {
  text-align: center;
  margin-top: var(--space-xl);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.m-auth-footer a {
  color: var(--color-accent);
  margin-left: var(--space-xs);
  font-weight: 500;
}
</style>
