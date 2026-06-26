<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <div class="m-404">
    <div class="m-404-code" data-text="404">404</div>
    <div class="m-404-badge">
      <span class="pulse-dot"></span>
      {{ t('notFound.accessDenied') }}
    </div>
    <h1>{{ t('notFound.title') }}</h1>
    <p>{{ t('notFound.description') }}</p>
    <div class="m-404-meta">
      <div class="m-meta-row">
        <span class="m-meta-label">{{ t('notFound.errorCode') }}</span>
        <span class="m-meta-value">{{ t('notFound.errValue') }}</span>
      </div>
      <div class="m-meta-row">
        <span class="m-meta-label">{{ t('notFound.terminal') }}</span>
        <span class="m-meta-value">LATOM-7</span>
      </div>
      <div class="m-meta-row">
        <span class="m-meta-label">{{ t('notFound.timestamp') }}</span>
        <span class="m-meta-value">{{ new Date().toISOString() }}</span>
      </div>
    </div>
    <router-link to="/" class="m-404-btn">
      {{ t('notFound.returnBtn') }}
    </router-link>
  </div>
</template>

<style scoped>
.m-404 {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-xl);
  min-height: calc(100vh - 52px - 56px);
}

.m-404-code {
  font-size: clamp(4rem, 20vw, 7rem);
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--color-danger);
  line-height: 1;
  text-shadow: 0 0 20px var(--color-danger-muted);
  animation: glitch 3s infinite;
  margin-bottom: var(--space-lg);
}

@keyframes glitch {
  0%, 90%, 100% { transform: none; opacity: 1; }
  91% { transform: skewX(2deg) translateX(2px); opacity: 0.8; }
  92% { transform: skewX(-2deg) translateX(-2px); opacity: 0.9; }
  93% { transform: none; opacity: 1; }
}

.m-404-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 4px 14px;
  border-radius: var(--radius-full);
  background: var(--color-danger-muted);
  border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-danger);
  letter-spacing: 0.08em;
  margin-bottom: var(--space-lg);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-danger);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.m-404 h1 {
  font-size: var(--text-xl);
  margin-bottom: var(--space-sm);
}

.m-404 p {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-xl);
  max-width: 360px;
}

.m-404-meta {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-xl);
  width: 100%;
  max-width: 320px;
}

.m-meta-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-xs) 0;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.m-meta-label {
  color: var(--text-tertiary);
}

.m-meta-value {
  color: var(--text-secondary);
}

.m-404-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 12px 24px;
  background: var(--color-primary);
  color: var(--text-inverse);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  text-decoration: none;
}
</style>
