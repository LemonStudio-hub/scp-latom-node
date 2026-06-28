<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowRight } from 'lucide-vue-next'

const { t } = useI18n()
const visible = ref(false)
onMounted(() => {
  requestAnimationFrame(() => (visible.value = true))
})
</script>

<template>
  <section class="hero" :class="{ visible }">
    <div class="hero-bg">
      <div class="grid-pattern"></div>
      <div class="hero-orb hero-orb-1"></div>
      <div class="hero-orb hero-orb-2"></div>
    </div>
    <div class="hero-content">
      <div class="hero-badge">
        <span class="pulse-dot"></span>
        <span>{{ t('hero.badge') }}</span>
      </div>
      <h1 class="hero-title">
        <span class="title-line">{{ t('hero.titleLine') }}</span>
        <span class="title-accent">{{ t('hero.titleAccent') }}</span>
      </h1>
      <p class="hero-description">{{ t('hero.description') }}</p>
      <div class="hero-actions">
        <router-link to="/catalog" class="btn btn-primary">
          <span>{{ t('hero.browseCatalog') }}</span>
          <ArrowRight :size="16" />
        </router-link>
        <router-link to="/about" class="btn btn-ghost">{{ t('hero.learnMore') }}</router-link>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  padding: var(--pad-page) 0;
  overflow: hidden;
  opacity: 0;
  transform: translateY(24px);
  transition: all 1s var(--ease-out-expo);
}

.hero.visible {
  opacity: 1;
  transform: translateY(0);
}

.hero-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.grid-pattern {
  position: absolute;
  inset: -20%;
  background-image:
    linear-gradient(var(--border-subtle) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.3;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
  animation: grid-float 20s linear infinite;
}

@keyframes grid-float {
  0% { transform: translate(0, 0); }
  50% { transform: translate(-10px, -10px); }
  100% { transform: translate(0, 0); }
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  animation: orb-float 15s ease-in-out infinite;
}

.hero-orb-1 {
  width: 300px;
  height: 300px;
  background: var(--color-primary);
  top: -100px;
  right: -50px;
  animation-delay: 0s;
}

.hero-orb-2 {
  width: 200px;
  height: 200px;
  background: var(--color-accent);
  bottom: -50px;
  left: 10%;
  animation-delay: -7s;
}

@keyframes orb-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20px, -20px) scale(1.1); }
  66% { transform: translate(-10px, 10px) scale(0.95); }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 4px 14px;
  border-radius: var(--radius-full);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  margin-bottom: var(--space-lg);
  letter-spacing: 0.04em;
  animation: fade-up 600ms var(--ease-out-expo) 200ms backwards;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 4px var(--color-success); }
  50% { opacity: 0.6; box-shadow: 0 0 12px var(--color-success); }
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: var(--space-lg);
}

.title-line {
  display: block;
  color: var(--text-primary);
  animation: fade-up 700ms var(--ease-out-expo) 300ms backwards;
}

.title-accent {
  display: block;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: fade-up 700ms var(--ease-out-expo) 450ms backwards;
}

.hero-description {
  max-width: 560px;
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
  margin-bottom: var(--space-xl);
  animation: fade-up 700ms var(--ease-out-expo) 600ms backwards;
}

.hero-actions {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
  animation: fade-up 700ms var(--ease-out-expo) 750ms backwards;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 10px 22px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  text-decoration: none;
  transition: all 400ms var(--ease-out-expo);
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--text-inverse);
}

.btn-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent, rgba(255,255,255,0.2), transparent);
  transform: translateX(-100%);
  transition: transform 600ms ease;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  color: var(--text-inverse);
  box-shadow: 0 6px 24px var(--color-primary-muted);
  transform: translateY(-2px);
}

.btn-primary:hover::before {
  transform: translateX(100%);
}

.btn-primary:hover svg {
  transform: translateX(3px);
}

.btn-primary svg {
  transition: transform var(--transition-fast);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}

.btn-ghost:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-color: var(--border-strong);
  transform: translateY(-2px);
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 1.75rem;
  }

  .hero-description {
    font-size: var(--text-base);
  }
}
</style>
