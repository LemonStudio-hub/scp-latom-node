<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted } from 'vue'
import { Building2, CircleDot, Network, RadioTower, ServerCog, Shield, SlidersHorizontal } from 'lucide-vue-next'

const { t } = useI18n()
const visible = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    visible.value = true
  })
})

const classKeys = ['safe', 'euclid', 'keter', 'thaumiel', 'apollyon', 'neutralized'] as const
const classColors: Record<string, string> = {
  safe: 'var(--class-safe)',
  euclid: 'var(--class-euclid)',
  keter: 'var(--class-keter)',
  thaumiel: 'var(--class-thaumiel)',
  apollyon: 'var(--color-danger)',
  neutralized: 'var(--class-neutralized)',
}

const aboutSectionIcons = {
  foundation: Shield,
  latomNode: RadioTower,
  classification: CircleDot,
  spectrum: SlidersHorizontal,
  security: Building2,
  structure: Network,
  system: ServerCog,
}
</script>

<template>
  <div class="m-about" :class="{ visible }">
    <!-- Ambient orbs -->
    <div class="m-orb m-orb-primary"></div>
    <div class="m-orb m-orb-accent"></div>

    <!-- Hero Header -->
    <header class="m-about-hero">
      <span class="m-hero-badge">{{ t('about.hero.badge') }}</span>
      <h1 class="m-hero-title">
        <span class="m-title-main">{{ t('about.title') }}</span>
      </h1>
      <p class="m-hero-desc">{{ t('about.description') }}</p>
    </header>

    <div class="m-about-body">
      <!-- Foundation Section -->
      <section class="m-about-section fade-up-1">
        <div class="m-section-header">
          <div class="m-section-icon"><component :is="aboutSectionIcons.foundation" :size="18" /></div>
          <h2>{{ t('about.foundation.title') }}</h2>
        </div>
        <p>{{ t('about.foundation.p1') }}</p>
        <p>{{ t('about.foundation.p2') }}</p>
        <p class="m-highlight">{{ t('about.foundation.p3') }}</p>
      </section>

      <!-- Latom Node Section -->
      <section class="m-about-section fade-up-2">
        <div class="m-section-header">
          <div class="m-section-icon"><component :is="aboutSectionIcons.latomNode" :size="18" /></div>
          <h2>{{ t('about.latomNode.title') }}</h2>
        </div>
        <p>{{ t('about.latomNode.p1') }}</p>
        <p>{{ t('about.latomNode.p2') }}</p>
        <p class="m-highlight">{{ t('about.latomNode.p3') }}</p>
      </section>

      <!-- Classification Section -->
      <section class="m-about-section fade-up-3">
        <div class="m-section-header">
          <div class="m-section-icon"><component :is="aboutSectionIcons.classification" :size="18" /></div>
          <h2>{{ t('about.classification.title') }}</h2>
        </div>
        <p class="m-section-intro">{{ t('about.classification.desc') }}</p>
        <div class="m-class-list">
          <div
            v-for="cls in classKeys"
            :key="cls"
            class="m-class-card"
            :style="{ '--card-color': classColors[cls] }"
          >
            <div class="m-class-header">
              <span class="m-class-dot" :style="{ background: classColors[cls] }"></span>
              <h3>{{ t(`about.classification.${cls}.name`) }}</h3>
            </div>
            <p>{{ t(`about.classification.${cls}.desc`) }}</p>
            <span class="m-class-level">{{ t(`about.classification.${cls}.level`) }}</span>
          </div>
        </div>
      </section>

      <!-- Containment Spectrum -->
      <section class="m-about-section fade-up-4">
        <div class="m-section-header">
          <div class="m-section-icon"><component :is="aboutSectionIcons.spectrum" :size="18" /></div>
          <h2>{{ t('about.spectrum.title') }}</h2>
        </div>
        <p class="m-section-intro">{{ t('about.spectrum.desc') }}</p>
        <div class="m-spectrum">
          <span class="m-spectrum-label">{{ t('about.spectrum.from') }}</span>
          <div class="m-spectrum-bar">
            <div class="m-spectrum-seg safe"></div>
            <div class="m-spectrum-seg euclid"></div>
            <div class="m-spectrum-seg keter"></div>
            <div class="m-spectrum-seg thaumiel"></div>
            <div class="m-spectrum-seg apollyon"></div>
          </div>
          <span class="m-spectrum-label">{{ t('about.spectrum.to') }}</span>
        </div>
        <div class="m-spectrum-names">
          <span>Safe</span>
          <span>Euclid</span>
          <span>Keter</span>
          <span>Thaumiel</span>
          <span>Apollyon</span>
        </div>
      </section>

      <!-- Security Protocols -->
      <section class="m-about-section fade-up-5">
        <div class="m-section-header">
          <div class="m-section-icon"><component :is="aboutSectionIcons.security" :size="18" /></div>
          <h2>{{ t('about.security.title') }}</h2>
        </div>
        <p class="m-section-intro">{{ t('about.security.desc') }}</p>
        <div class="m-card-list">
          <div class="m-info-card">
            <h4>{{ t('about.security.item1Title') }}</h4>
            <p>{{ t('about.security.item1Desc') }}</p>
          </div>
          <div class="m-info-card">
            <h4>{{ t('about.security.item2Title') }}</h4>
            <p>{{ t('about.security.item2Desc') }}</p>
          </div>
          <div class="m-info-card">
            <h4>{{ t('about.security.item3Title') }}</h4>
            <p>{{ t('about.security.item3Desc') }}</p>
          </div>
        </div>
      </section>

      <!-- Foundation Structure -->
      <section class="m-about-section fade-up-6">
        <div class="m-section-header">
          <div class="m-section-icon"><component :is="aboutSectionIcons.structure" :size="18" /></div>
          <h2>{{ t('about.structure.title') }}</h2>
        </div>
        <p class="m-section-intro">{{ t('about.structure.desc') }}</p>
        <div class="m-card-list">
          <div class="m-structure-card">
            <span class="m-struct-num">01</span>
            <div>
              <h4>{{ t('about.structure.item1Title') }}</h4>
              <p>{{ t('about.structure.item1Desc') }}</p>
            </div>
          </div>
          <div class="m-structure-card">
            <span class="m-struct-num">02</span>
            <div>
              <h4>{{ t('about.structure.item2Title') }}</h4>
              <p>{{ t('about.structure.item2Desc') }}</p>
            </div>
          </div>
          <div class="m-structure-card">
            <span class="m-struct-num">03</span>
            <div>
              <h4>{{ t('about.structure.item3Title') }}</h4>
              <p>{{ t('about.structure.item3Desc') }}</p>
            </div>
          </div>
          <div class="m-structure-card">
            <span class="m-struct-num">04</span>
            <div>
              <h4>{{ t('about.structure.item4Title') }}</h4>
              <p>{{ t('about.structure.item4Desc') }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- System Information -->
      <section class="m-about-section fade-up-7">
        <div class="m-section-header">
          <div class="m-section-icon"><component :is="aboutSectionIcons.system" :size="18" /></div>
          <h2>{{ t('about.system.title') }}</h2>
        </div>
        <div class="m-terminal">
          <div class="m-terminal-header">
            <span class="m-dot red"></span>
            <span class="m-dot yellow"></span>
            <span class="m-dot green"></span>
            <span class="m-terminal-title">LATOM-7</span>
          </div>
          <div class="m-terminal-body">
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
              <span class="m-sys-label">{{ t('about.system.protocol') }}</span>
              <span class="m-sys-value accent">{{ t('about.system.protocolValue') }}</span>
            </div>
            <div class="m-sys-row">
              <span class="m-sys-label">{{ t('about.system.status') }}</span>
              <span class="m-sys-value success">
                <span class="m-status-dot"></span>
                {{ t('about.system.operational') }}
              </span>
            </div>
            <div class="m-sys-row">
              <span class="m-sys-label">{{ t('about.system.uptime') }}</span>
              <span class="m-sys-value">{{ t('about.system.uptimeValue') }}</span>
            </div>
            <div class="m-sys-row">
              <span class="m-sys-label">{{ t('about.system.encryption') }}</span>
              <span class="m-sys-value">{{ t('about.system.encryptionValue') }}</span>
            </div>
            <div class="m-sys-row">
              <span class="m-sys-label">{{ t('about.system.lastSync') }}</span>
              <span class="m-sys-value">{{ new Date().toISOString().split('T')[0] }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="m-about-footer fade-up-8">
        <p>{{ t('about.footer.disclaimer') }}</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.m-about {
  padding: var(--space-md);
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateY(12px);
  transition: all 600ms var(--ease-out-expo);
}

.m-about.visible {
  opacity: 1;
  transform: translateY(0);
}

/* ═══ Orbs ═══ */
.m-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0;
  pointer-events: none;
  z-index: 0;
  transition: opacity 1.5s ease;
}

.m-about.visible .m-orb {
  opacity: 0.08;
}

.m-orb-primary {
  width: 300px;
  height: 300px;
  background: var(--color-primary);
  top: 5%;
  right: -20%;
  animation: m-orb-float 20s ease-in-out infinite;
}

.m-orb-accent {
  width: 250px;
  height: 250px;
  background: var(--color-accent);
  bottom: 30%;
  left: -15%;
  animation: m-orb-float 25s ease-in-out infinite reverse;
}

@keyframes m-orb-float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20px, -30px); }
}

/* ═══ Hero ═══ */
.m-about-hero {
  position: relative;
  z-index: 1;
  padding: var(--space-lg) 0 var(--space-xl);
  margin-bottom: var(--space-lg);
}

.m-hero-badge {
  display: inline-block;
  padding: var(--space-xs) var(--space-sm);
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-tertiary);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  letter-spacing: 0.08em;
  margin-bottom: var(--space-md);
  animation: fade-up 500ms var(--ease-out-expo) 100ms backwards;
}

.m-hero-title {
  margin-bottom: var(--space-sm);
  animation: fade-up 500ms var(--ease-out-expo) 200ms backwards;
}

.m-title-main {
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--color-primary) 50%, var(--color-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.m-hero-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  animation: fade-up 500ms var(--ease-out-expo) 300ms backwards;
}

/* ═══ Body ═══ */
.m-about-body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.m-about-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.fade-up-1 { animation: fade-up 500ms var(--ease-out-expo) 250ms backwards; }
.fade-up-2 { animation: fade-up 500ms var(--ease-out-expo) 350ms backwards; }
.fade-up-3 { animation: fade-up 500ms var(--ease-out-expo) 450ms backwards; }
.fade-up-4 { animation: fade-up 500ms var(--ease-out-expo) 550ms backwards; }
.fade-up-5 { animation: fade-up 500ms var(--ease-out-expo) 650ms backwards; }
.fade-up-6 { animation: fade-up 500ms var(--ease-out-expo) 750ms backwards; }
.fade-up-7 { animation: fade-up 500ms var(--ease-out-expo) 850ms backwards; }
.fade-up-8 { animation: fade-up 500ms var(--ease-out-expo) 950ms backwards; }

.m-section-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}

.m-section-icon {
  color: var(--color-primary);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-muted);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(201, 164, 74, 0.15);
  flex-shrink: 0;
}

.m-section-header h2 {
  font-size: var(--text-lg);
  font-weight: 700;
}

.m-about-section p {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

.m-section-intro {
  font-size: var(--text-xs) !important;
  color: var(--text-tertiary) !important;
}

.m-highlight {
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-surface);
  border-left: 3px solid var(--color-primary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  font-style: italic;
  font-size: var(--text-xs) !important;
}

/* ═══ Classification ═══ */
.m-class-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
}

.m-class-card {
  padding: var(--space-md);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--card-color);
}

.m-class-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}

.m-class-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 6px currentColor;
  animation: indicator-pulse 3s ease-in-out infinite;
}

@keyframes indicator-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.m-class-header h3 {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--card-color);
}

.m-class-card p {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-xs);
}

.m-class-level {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-tertiary);
  letter-spacing: 0.02em;
}

/* ═══ Spectrum ═══ */
.m-spectrum {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
}

.m-spectrum-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.m-spectrum-bar {
  flex: 1;
  display: flex;
  height: 8px;
  border-radius: var(--radius-full);
  overflow: hidden;
  gap: 2px;
}

.m-spectrum-seg {
  border-radius: var(--radius-full);
}

.m-spectrum-seg.safe { background: var(--class-safe); flex: 1; }
.m-spectrum-seg.euclid { background: var(--class-euclid); flex: 1.5; }
.m-spectrum-seg.keter { background: var(--class-keter); flex: 2; }
.m-spectrum-seg.thaumiel { background: var(--class-thaumiel); flex: 1; }
.m-spectrum-seg.apollyon { background: var(--color-danger); flex: 2.5; }

.m-spectrum-names {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text-tertiary);
  padding: 0 var(--space-xs);
  letter-spacing: 0.02em;
}

/* ═══ Info Cards ═══ */
.m-card-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
}

.m-info-card {
  padding: var(--space-md);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.m-info-card h4 {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.m-info-card p {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
  margin: 0;
}

/* ═══ Structure Cards ═══ */
.m-structure-card {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.m-struct-num {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: rgba(201, 164, 74, 0.15);
  line-height: 1;
  flex-shrink: 0;
}

.m-structure-card h4 {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.m-structure-card p {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
  margin: 0;
}

/* ═══ Terminal ═══ */
.m-terminal {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-top: var(--space-xs);
}

.m-terminal-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--space-xs) var(--space-md);
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-subtle);
}

.m-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.m-dot.red { background: #ef4444; }
.m-dot.yellow { background: #facc15; }
.m-dot.green { background: #4ade80; }

.m-terminal-title {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-tertiary);
  margin-left: var(--space-xs);
  letter-spacing: 0.05em;
}

.m-terminal-body {
  padding: var(--space-xs) 0;
}

.m-sys-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xs) var(--space-md);
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
  display: flex;
  align-items: center;
  gap: 6px;
}

.m-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
  animation: m-pulse 2s ease-in-out infinite;
}

@keyframes m-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* ═══ Footer ═══ */
.m-about-footer {
  padding: var(--space-lg) 0 var(--space-md);
  border-top: 1px solid var(--border-subtle);
  margin-top: var(--space-sm);
}

.m-about-footer p {
  font-size: 10px;
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
  text-align: center;
}
</style>
