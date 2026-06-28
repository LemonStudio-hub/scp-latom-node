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
const classGlow: Record<string, string> = {
  safe: 'var(--class-safe-glow, rgba(74, 222, 128, 0.15))',
  euclid: 'var(--class-euclid-glow, rgba(250, 204, 21, 0.15))',
  keter: 'var(--class-keter-glow, rgba(239, 68, 68, 0.15))',
  thaumiel: 'var(--class-thaumiel-glow, rgba(168, 85, 247, 0.15))',
  apollyon: 'var(--class-apollyon-glow, rgba(239, 68, 68, 0.2))',
  neutralized: 'var(--class-neutralized-glow, rgba(107, 114, 128, 0.15))',
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
  <div class="about" :class="{ visible }">
    <!-- Ambient orbs -->
    <div class="orb orb-primary"></div>
    <div class="orb orb-accent"></div>

    <!-- Hero Header -->
    <header class="about-hero">
      <div class="grid-bg"></div>
      <div class="hero-content">
        <span class="hero-badge">{{ t('about.hero.badge') }}</span>
        <h1 class="hero-title">
          <span class="title-main">{{ t('about.title') }}</span>
        </h1>
        <p class="hero-desc">{{ t('about.description') }}</p>
      </div>
    </header>

    <div class="about-body">
      <!-- Foundation Section -->
      <section class="about-section fade-up-1">
        <div class="section-header">
          <div class="section-icon"><component :is="aboutSectionIcons.foundation" :size="22" /></div>
          <h2>{{ t('about.foundation.title') }}</h2>
        </div>
        <div class="section-content">
          <p>{{ t('about.foundation.p1') }}</p>
          <p>{{ t('about.foundation.p2') }}</p>
          <p class="highlight-text">{{ t('about.foundation.p3') }}</p>
        </div>
      </section>

      <!-- Latom Node Section -->
      <section class="about-section fade-up-2">
        <div class="section-header">
          <div class="section-icon"><component :is="aboutSectionIcons.latomNode" :size="22" /></div>
          <h2>{{ t('about.latomNode.title') }}</h2>
        </div>
        <div class="section-content">
          <p>{{ t('about.latomNode.p1') }}</p>
          <p>{{ t('about.latomNode.p2') }}</p>
          <p class="highlight-text">{{ t('about.latomNode.p3') }}</p>
        </div>
      </section>

      <!-- Classification Section -->
      <section class="about-section fade-up-3">
        <div class="section-header">
          <div class="section-icon"><component :is="aboutSectionIcons.classification" :size="22" /></div>
          <h2>{{ t('about.classification.title') }}</h2>
        </div>
        <p class="section-intro">{{ t('about.classification.desc') }}</p>
        <div class="class-grid">
          <div
            v-for="cls in classKeys"
            :key="cls"
            class="class-card"
            :class="cls"
            :style="{
              '--card-color': classColors[cls],
              '--card-glow': classGlow[cls],
            }"
          >
            <div class="class-card-header">
              <span class="class-dot"></span>
              <h3>{{ t(`about.classification.${cls}.name`) }}</h3>
            </div>
            <p>{{ t(`about.classification.${cls}.desc`) }}</p>
            <span class="class-level">{{ t(`about.classification.${cls}.level`) }}</span>
          </div>
        </div>
      </section>

      <!-- Containment Spectrum -->
      <section class="about-section fade-up-4">
        <div class="section-header">
          <div class="section-icon"><component :is="aboutSectionIcons.spectrum" :size="22" /></div>
          <h2>{{ t('about.spectrum.title') }}</h2>
        </div>
        <p class="section-intro">{{ t('about.spectrum.desc') }}</p>
        <div class="spectrum">
          <span class="spectrum-label">{{ t('about.spectrum.from') }}</span>
          <div class="spectrum-bar">
            <div class="spectrum-segment safe" style="flex: 1"></div>
            <div class="spectrum-segment euclid" style="flex: 1.5"></div>
            <div class="spectrum-segment keter" style="flex: 2"></div>
            <div class="spectrum-segment thaumiel" style="flex: 1"></div>
            <div class="spectrum-segment apollyon" style="flex: 2.5"></div>
          </div>
          <span class="spectrum-label">{{ t('about.spectrum.to') }}</span>
        </div>
        <div class="spectrum-markers">
          <span class="marker" style="left: 0%">Safe</span>
          <span class="marker" style="left: 12.5%">Euclid</span>
          <span class="marker" style="left: 31.25%">Keter</span>
          <span class="marker" style="left: 56.25%">Thaumiel</span>
          <span class="marker" style="left: 68.75%">Apollyon</span>
        </div>
      </section>

      <!-- Security Protocols -->
      <section class="about-section fade-up-5">
        <div class="section-header">
          <div class="section-icon"><component :is="aboutSectionIcons.security" :size="22" /></div>
          <h2>{{ t('about.security.title') }}</h2>
        </div>
        <p class="section-intro">{{ t('about.security.desc') }}</p>
        <div class="protocol-grid">
          <div class="protocol-card">
            <h4>{{ t('about.security.item1Title') }}</h4>
            <p>{{ t('about.security.item1Desc') }}</p>
          </div>
          <div class="protocol-card">
            <h4>{{ t('about.security.item2Title') }}</h4>
            <p>{{ t('about.security.item2Desc') }}</p>
          </div>
          <div class="protocol-card">
            <h4>{{ t('about.security.item3Title') }}</h4>
            <p>{{ t('about.security.item3Desc') }}</p>
          </div>
        </div>
      </section>

      <!-- Foundation Structure -->
      <section class="about-section fade-up-6">
        <div class="section-header">
          <div class="section-icon"><component :is="aboutSectionIcons.structure" :size="22" /></div>
          <h2>{{ t('about.structure.title') }}</h2>
        </div>
        <p class="section-intro">{{ t('about.structure.desc') }}</p>
        <div class="structure-grid">
          <div class="structure-card">
            <div class="structure-number">01</div>
            <h4>{{ t('about.structure.item1Title') }}</h4>
            <p>{{ t('about.structure.item1Desc') }}</p>
          </div>
          <div class="structure-card">
            <div class="structure-number">02</div>
            <h4>{{ t('about.structure.item2Title') }}</h4>
            <p>{{ t('about.structure.item2Desc') }}</p>
          </div>
          <div class="structure-card">
            <div class="structure-number">03</div>
            <h4>{{ t('about.structure.item3Title') }}</h4>
            <p>{{ t('about.structure.item3Desc') }}</p>
          </div>
          <div class="structure-card">
            <div class="structure-number">04</div>
            <h4>{{ t('about.structure.item4Title') }}</h4>
            <p>{{ t('about.structure.item4Desc') }}</p>
          </div>
        </div>
      </section>

      <!-- System Information -->
      <section class="about-section fade-up-7">
        <div class="section-header">
          <div class="section-icon"><component :is="aboutSectionIcons.system" :size="22" /></div>
          <h2>{{ t('about.system.title') }}</h2>
        </div>
        <div class="terminal-block">
          <div class="terminal-header">
            <span class="terminal-dot red"></span>
            <span class="terminal-dot yellow"></span>
            <span class="terminal-dot green"></span>
            <span class="terminal-title">LATOM-7 :: SYSTEM STATUS</span>
          </div>
          <div class="terminal-body">
            <div class="sys-row">
              <span class="sys-label">{{ t('about.system.terminal') }}</span>
              <span class="sys-value">LATOM-7</span>
            </div>
            <div class="sys-row">
              <span class="sys-label">{{ t('about.system.version') }}</span>
              <span class="sys-value">7.2.1</span>
            </div>
            <div class="sys-row">
              <span class="sys-label">{{ t('about.system.clearance') }}</span>
              <span class="sys-value accent">{{ t('sidebar.level4') }}</span>
            </div>
            <div class="sys-row">
              <span class="sys-label">{{ t('about.system.protocol') }}</span>
              <span class="sys-value accent">{{ t('about.system.protocolValue') }}</span>
            </div>
            <div class="sys-row">
              <span class="sys-label">{{ t('about.system.status') }}</span>
              <span class="sys-value success">
                <span class="status-dot"></span>
                {{ t('about.system.operational') }}
              </span>
            </div>
            <div class="sys-row">
              <span class="sys-label">{{ t('about.system.uptime') }}</span>
              <span class="sys-value">{{ t('about.system.uptimeValue') }}</span>
            </div>
            <div class="sys-row">
              <span class="sys-label">{{ t('about.system.encryption') }}</span>
              <span class="sys-value">{{ t('about.system.encryptionValue') }}</span>
            </div>
            <div class="sys-row">
              <span class="sys-label">{{ t('about.system.lastSync') }}</span>
              <span class="sys-value">{{ new Date().toISOString().split('T')[0] }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer Disclaimer -->
      <footer class="about-footer fade-up-8">
        <p>{{ t('about.footer.disclaimer') }}</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.about {
  max-width: var(--max-content);
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateY(16px);
  transition: all 800ms var(--ease-out-expo);
}

.about.visible {
  opacity: 1;
  transform: translateY(0);
}

/* ═══ Ambient Orbs ═══ */
.orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0;
  pointer-events: none;
  z-index: 0;
  transition: opacity 1.5s ease;
}

.about.visible .orb {
  opacity: 0.12;
}

.orb-primary {
  width: 500px;
  height: 500px;
  background: var(--color-primary);
  top: 10%;
  right: -15%;
  animation: orb-float 18s ease-in-out infinite;
}

.orb-accent {
  width: 400px;
  height: 400px;
  background: var(--color-accent);
  bottom: 20%;
  left: -10%;
  animation: orb-float 22s ease-in-out infinite reverse;
}

@keyframes orb-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -40px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

/* ═══ Hero Header ═══ */
.about-hero {
  position: relative;
  padding: var(--space-3xl) 0 var(--space-2xl);
  margin-bottom: var(--space-2xl);
}

.grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--border-subtle) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.3;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 30%, black 20%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 30%, black 20%, transparent 70%);
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  letter-spacing: 0.08em;
  margin-bottom: var(--space-lg);
  animation: fade-up 600ms var(--ease-out-expo) 100ms backwards;
}

.hero-title {
  margin-bottom: var(--space-md);
  animation: fade-up 600ms var(--ease-out-expo) 200ms backwards;
}

.title-main {
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--color-primary) 50%, var(--color-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  max-width: 600px;
  line-height: var(--leading-relaxed);
  animation: fade-up 600ms var(--ease-out-expo) 350ms backwards;
}

/* ═══ Sections ═══ */
.about-body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-3xl);
}

.about-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.fade-up-1 { animation: fade-up 600ms var(--ease-out-expo) 300ms backwards; }
.fade-up-2 { animation: fade-up 600ms var(--ease-out-expo) 400ms backwards; }
.fade-up-3 { animation: fade-up 600ms var(--ease-out-expo) 500ms backwards; }
.fade-up-4 { animation: fade-up 600ms var(--ease-out-expo) 600ms backwards; }
.fade-up-5 { animation: fade-up 600ms var(--ease-out-expo) 700ms backwards; }
.fade-up-6 { animation: fade-up 600ms var(--ease-out-expo) 800ms backwards; }
.fade-up-7 { animation: fade-up 600ms var(--ease-out-expo) 900ms backwards; }
.fade-up-8 { animation: fade-up 600ms var(--ease-out-expo) 1000ms backwards; }

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.section-icon {
  color: var(--color-primary);
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-muted);
  border-radius: var(--radius-md);
  border: 1px solid rgba(201, 164, 74, 0.15);
}

.section-header h2 {
  font-size: var(--text-xl);
  font-weight: 700;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-left: 56px;
}

.section-content p {
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

.section-intro {
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  padding-left: 56px;
  font-size: var(--text-sm);
}

.highlight-text {
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-surface);
  border-left: 3px solid var(--color-primary);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  font-style: italic;
}

/* ═══ Classification Cards ═══ */
.class-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-md);
  padding-left: 56px;
}

.class-card {
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  position: relative;
  overflow: hidden;
  transition: all 400ms var(--ease-out-expo);
}

.class-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: var(--card-color);
  border-radius: 3px 0 0 3px;
}

.class-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--card-glow);
  opacity: 0;
  transition: opacity 400ms var(--ease-out-expo);
}

.class-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-default);
  box-shadow: var(--shadow-md), 0 0 0 1px var(--card-glow);
}

.class-card:hover::after {
  opacity: 1;
}

.class-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
  position: relative;
  z-index: 1;
}

.class-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--card-color);
  box-shadow: 0 0 8px var(--card-color);
  animation: indicator-pulse 3s ease-in-out infinite;
}

@keyframes indicator-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.class-card:hover .class-dot {
  transform: scale(1.4);
  animation: none;
}

.class-card-header h3 {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--card-color);
}

.class-card p {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-sm);
  position: relative;
  z-index: 1;
}

.class-level {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  letter-spacing: 0.02em;
  position: relative;
  z-index: 1;
}

/* ═══ Containment Spectrum ═══ */
.spectrum {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding-left: 56px;
}

.spectrum-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.spectrum-bar {
  flex: 1;
  display: flex;
  height: 12px;
  border-radius: var(--radius-full);
  overflow: hidden;
  gap: 2px;
}

.spectrum-segment {
  border-radius: var(--radius-full);
  transition: flex 600ms var(--ease-out-expo);
}

.spectrum-segment.safe { background: var(--class-safe); }
.spectrum-segment.euclid { background: var(--class-euclid); }
.spectrum-segment.keter { background: var(--class-keter); }
.spectrum-segment.thaumiel { background: var(--class-thaumiel); }
.spectrum-segment.apollyon { background: var(--color-danger); }

.spectrum-markers {
  position: relative;
  height: 24px;
  margin-left: 56px;
  margin-right: 0;
}

.spectrum-markers .marker {
  position: absolute;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-tertiary);
  transform: translateX(-50%);
  letter-spacing: 0.02em;
}

/* ═══ Protocol Cards ═══ */
.protocol-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-md);
  padding-left: 56px;
}

.protocol-card {
  padding: var(--space-lg);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  transition: all 400ms var(--ease-out-expo);
}

.protocol-card:hover {
  border-color: var(--border-default);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.protocol-card h4 {
  font-size: var(--text-base);
  font-weight: 600;
  margin-bottom: var(--space-sm);
  color: var(--text-primary);
}

.protocol-card p {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
  margin: 0;
}

/* ═══ Structure Cards ═══ */
.structure-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
  padding-left: 56px;
}

.structure-card {
  padding: var(--space-lg);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  position: relative;
  transition: all 400ms var(--ease-out-expo);
}

.structure-card:hover {
  border-color: var(--border-default);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.structure-number {
  font-family: var(--font-mono);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--color-primary-muted);
  line-height: 1;
  margin-bottom: var(--space-sm);
  color: rgba(201, 164, 74, 0.15);
}

.structure-card h4 {
  font-size: var(--text-base);
  font-weight: 600;
  margin-bottom: var(--space-sm);
  color: var(--text-primary);
}

.structure-card p {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
  margin: 0;
}

/* ═══ Terminal Block ═══ */
.terminal-block {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-left: 56px;
}

.terminal-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-subtle);
}

.terminal-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.terminal-dot.red { background: #ef4444; }
.terminal-dot.yellow { background: #facc15; }
.terminal-dot.green { background: #4ade80; }

.terminal-title {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-left: var(--space-sm);
  letter-spacing: 0.05em;
}

.terminal-body {
  padding: var(--space-sm) 0;
}

.sys-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xs) var(--space-lg);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  transition: background var(--transition-fast);
}

.sys-row:hover {
  background: var(--bg-hover);
}

.sys-label {
  color: var(--text-tertiary);
}

.sys-value {
  color: var(--text-secondary);
}

.sys-value.accent {
  color: var(--color-primary);
}

.sys-value.success {
  color: var(--color-success);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 8px var(--color-success);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 8px var(--color-success); }
  50% { opacity: 0.6; box-shadow: 0 0 16px var(--color-success); }
}

/* ═══ Footer ═══ */
.about-footer {
  padding: var(--space-xl) 0;
  border-top: 1px solid var(--border-subtle);
  margin-top: var(--space-lg);
}

.about-footer p {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

/* ═══ Responsive ═══ */
@media (max-width: 640px) {
  .section-content,
  .section-intro,
  .class-grid,
  .protocol-grid,
  .structure-grid,
  .terminal-block,
  .spectrum,
  .spectrum-markers {
    padding-left: 0;
    margin-left: 0;
  }

  .class-grid {
    grid-template-columns: 1fr;
  }

  .structure-grid {
    grid-template-columns: 1fr;
  }

  .protocol-grid {
    grid-template-columns: 1fr;
  }

  .hero-title {
    font-size: var(--text-3xl);
  }

  .hero-desc {
    font-size: var(--text-base);
  }

  .spectrum {
    flex-direction: column;
    align-items: stretch;
  }

  .spectrum-label {
    text-align: center;
  }

  .orb {
    display: none;
  }
}
</style>
