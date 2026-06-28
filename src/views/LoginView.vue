<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { Shield, TriangleAlert } from 'lucide-vue-next'

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
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-icon"><Shield :size="40" :stroke-width="1.75" /></div>
        <h1>{{ t('auth.loginTitle') }}</h1>
        <p class="auth-subtitle">{{ t('auth.loginSubtitle') }}</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="codename">{{ t('auth.codename') }}</label>
          <div class="input-wrapper">
            <input
              id="codename"
              v-model="codename"
              type="text"
              :placeholder="t('auth.codenamePlaceholder')"
              autocomplete="username"
              spellcheck="false"
            />
            <div class="input-focus-line"></div>
          </div>
        </div>

        <div class="form-group">
          <label for="password">{{ t('auth.password') }}</label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="password"
              type="password"
              :placeholder="t('auth.passwordPlaceholder')"
              autocomplete="current-password"
            />
            <div class="input-focus-line"></div>
          </div>
        </div>

        <Transition name="slide-fade">
          <div v-if="auth.error" class="error-msg">
            <TriangleAlert class="error-icon" :size="18" />
            {{ auth.error }}
          </div>
        </Transition>

        <button type="submit" class="auth-submit" :disabled="auth.loading">
          <span v-if="auth.loading" class="spinner"></span>
          <span v-else>{{ t('auth.loginBtn') }}</span>
        </button>
      </form>

      <div class="auth-footer">
        <span>{{ t('auth.noAccount') }}</span>
        <router-link to="/register">{{ t('auth.registerLink') }}</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  animation: fade-up 600ms var(--ease-out-expo) backwards;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  animation: scale-in 500ms var(--ease-out-expo) 100ms backwards;
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
}

.auth-header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.auth-icon {
  color: var(--color-primary);
  margin-bottom: var(--space-sm);
  animation: float 3s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.auth-header h1 {
  font-size: var(--text-2xl);
  margin-bottom: var(--space-xs);
}

.auth-subtitle {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-group label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  letter-spacing: 0.03em;
}

.input-wrapper {
  position: relative;
}

.form-group input {
  width: 100%;
  padding: 10px var(--space-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: all var(--transition-fast);
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-muted);
}

.input-focus-line {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--color-primary);
  transition: all 300ms var(--ease-out-expo);
  transform: translateX(-50%);
  border-radius: 1px;
}

.form-group input:focus ~ .input-focus-line {
  width: 100%;
}

.form-group input::placeholder {
  color: var(--text-tertiary);
}

.error-msg {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-danger-muted);
  border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-danger);
}

.error-icon {
  flex-shrink: 0;
}

.slide-fade-enter-active {
  transition: all 300ms var(--ease-out-expo);
}

.slide-fade-leave-active {
  transition: all 200ms ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.auth-submit {
  padding: 10px var(--space-lg);
  background: var(--color-primary);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 400ms var(--ease-out-expo);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  position: relative;
  overflow: hidden;
}

.auth-submit::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent, rgba(255,255,255,0.2), transparent);
  transform: translateX(-100%);
  transition: transform 600ms ease;
}

.auth-submit:hover:not(:disabled) {
  background: var(--color-primary-hover);
  box-shadow: 0 6px 24px var(--color-primary-muted);
  transform: translateY(-1px);
}

.auth-submit:hover:not(:disabled)::before {
  transform: translateX(100%);
}

.auth-submit:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.auth-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
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

.auth-footer {
  text-align: center;
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-subtle);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.auth-footer a {
  color: var(--color-accent);
  margin-left: var(--space-xs);
  font-weight: 500;
  transition: color var(--transition-fast);
}

.auth-footer a:hover {
  color: var(--color-accent-hover);
}

@media (max-width: 480px) {
  .auth-card {
    padding: var(--space-lg);
    border-radius: var(--radius-md);
  }
}
</style>
