<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const classKeys = ['safe', 'euclid', 'keter', 'thaumiel', 'apollyon', 'neutralized'] as const
const classColors: Record<string, string> = {
  safe: 'var(--class-safe)',
  euclid: 'var(--class-euclid)',
  keter: 'var(--class-keter)',
  thaumiel: 'var(--class-thaumiel)',
  apollyon: 'var(--text-primary)',
  neutralized: 'var(--class-neutralized)',
}
</script>

<template>
  <div class="m-about">
    <div class="m-about-header">
      <h1>{{ t('about.title') }}</h1>
      <p>{{ t('about.description') }}</p>
    </div>

    <div class="m-about-sections">
      <!-- Foundation -->
      <section class="m-about-section">
        <div class="m-about-icon">◈</div>
        <h2>{{ t('about.foundation.title') }}</h2>
        <p>{{ t('about.foundation.p1') }}</p>
        <p>{{ t('about.foundation.p2') }}</p>
      </section>

      <!-- Latom Node -->
      <section class="m-about-section">
        <div class="m-about-icon">◫</div>
        <h2>{{ t('about.latomNode.title') }}</h2>
        <p>{{ t('about.latomNode.p1') }}</p>
        <p>{{ t('about.latomNode.p2') }}</p>
      </section>

      <!-- Classification -->
      <section class="m-about-section">
        <div class="m-about-icon">◎</div>
        <h2>{{ t('about.classification.title') }}</h2>
        <div class="m-class-list">
          <div v-for="cls in classKeys" :key="cls" class="m-class-card" :class="cls">
            <h3 :style="{ color: classColors[cls] }">{{ t(`about.classification.${cls}.name`) }}</h3>
            <p>{{ t(`about.classification.${cls}.desc`) }}</p>
          </div>
        </div>
      </section>

      <!-- System Info -->
      <section class="m-about-section">
        <div class="m-about-icon">▣</div>
        <h2>{{ t('about.system.title') }}</h2>
        <div class="m-sys-info">
          <div class="m-sys-row">
            <span class="m-sys-label">{{ t('about.system.terminal') }}</span>
            <span class="m-sys-value">LATOM-7</span>
          </div>
          <div class="m-sys-row">
            <span class="m-sys-label">{{ t('about.system.version') }}</span>
            <span class="m-sys-value">7.2.1</span>
          </div>
          <div class="m-sys-row">
            <span class="m-sys-label">{{ t('about.system.clearance') }}</span>
            <span class="m-sys-value accent">{{ t('sidebar.level4') }}</span>
          </div>
          <div class="m-sys-row">
            <span class="m-sys-label">{{ t('about.system.status') }}</span>
            <span class="m-sys-value success">{{ t('about.system.operational') }}</span>
          </div>
          <div class="m-sys-row">
            <span class="m-sys-label">{{ t('about.system.lastSync') }}</span>
            <span class="m-sys-value">{{ new Date().toISOString().split('T')[0] }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.m-about {
  padding: var(--space-md);
}

.m-about-header {
  margin-bottom: var(--space-xl);
}

.m-about-header h1 {
  font-size: var(--text-2xl);
  margin-bottom: var(--space-sm);
}

.m-about-header p {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.m-about-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.m-about-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.m-about-icon {
  font-size: var(--text-xl);
  color: var(--color-primary);
}

.m-about-section h2 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.m-about-section p {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

.m-class-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.m-class-card {
  padding: var(--space-md);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
}

.m-class-card h3 {
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.m-class-card p {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
  margin: 0;
}

.m-sys-info {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-top: var(--space-sm);
}

.m-sys-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.m-sys-row:not(:last-child) {
  border-bottom: 1px solid var(--border-subtle);
}

.m-sys-label {
  color: var(--text-tertiary);
}

.m-sys-value {
  color: var(--text-secondary);
}

.m-sys-value.accent {
  color: var(--color-primary);
}

.m-sys-value.success {
  color: var(--color-success);
}
</style>
