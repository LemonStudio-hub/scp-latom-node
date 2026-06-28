<script setup lang="ts">
import { ref, computed } from 'vue'
import { documents } from '@/data/documents'
import Badge from '@/components/common/Badge.vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft } from 'lucide-vue-next'
import type { Document } from '@/types'

const { t } = useI18n()
const activeDoc = ref<Document | null>(null)
const typeFilter = ref<string | null>(null)

const types = ['protocol', 'research', 'incident', 'directive']

const filtered = computed(() => {
  if (!typeFilter.value) return documents
  return documents.filter((d) => d.type === typeFilter.value)
})

const classVariant = (c: string) => {
  const map: Record<string, string> = {
    Unclassified: 'safe',
    Restricted: 'euclid',
    Confidential: 'keter',
    Secret: 'thaumiel',
    'Top Secret': 'apollyon',
  }
  return (map[c] || 'default') as any
}

function openDoc(doc: Document) {
  activeDoc.value = doc
}

function closeDoc() {
  activeDoc.value = null
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.*$)/gm, '<h4>$1</h4>')
    .replace(/^## (.*$)/gm, '<h3>$1</h3>')
    .replace(/^# (.*$)/gm, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>')
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    .replace(/<p><(h[234]|blockquote|li)/g, '<$1')
    .replace(/<\/(h[234]|blockquote|li)><\/p>/g, '</$1>')
}
</script>

<template>
  <div class="m-docs">
    <!-- Filter Pills -->
    <div class="m-filter-scroll">
      <div class="m-filter-pills">
        <button class="m-pill" :class="{ active: !typeFilter }" @click="typeFilter = null">
          {{ t('documents.all') }}
        </button>
        <button
          v-for="typ in types"
          :key="typ"
          class="m-pill"
          :class="{ active: typeFilter === typ }"
          @click="typeFilter = typ"
        >
          {{ t(`documents.types.${typ}`) }}
        </button>
      </div>
    </div>

    <!-- Document Cards -->
    <div class="m-doc-list">
      <div v-for="doc in filtered" :key="doc.id" class="m-doc-card" @click="openDoc(doc)">
        <div class="m-doc-top">
          <Badge :variant="classVariant(doc.classification)">{{ t(`classification.${doc.classification}`) }}</Badge>
          <span class="m-doc-type">{{ t(`documents.types.${doc.type}`) }}</span>
        </div>
        <h3 class="m-doc-title">{{ t(`docs.${doc.id}.title`) }}</h3>
        <p class="m-doc-summary">{{ t(`docs.${doc.id}.summary`) }}</p>
        <div class="m-doc-footer">
          <span class="m-doc-date">{{ doc.date }}</span>
          <span class="m-doc-read">{{ t('documents.read') }}</span>
        </div>
      </div>
    </div>

    <!-- Full-Screen Document Modal -->
    <Teleport to="body">
      <Transition name="slide-up">
        <div v-if="activeDoc" class="m-doc-overlay">
          <div class="m-doc-modal-header">
            <button class="m-doc-close" @click="closeDoc">
              <ChevronLeft :size="20" />
            </button>
            <div class="m-doc-modal-meta">
              <Badge :variant="classVariant(activeDoc.classification)">
                {{ t(`classification.${activeDoc.classification}`) }}
              </Badge>
              <span class="m-doc-modal-type">{{ t(`documents.types.${activeDoc.type}`) }}</span>
            </div>
          </div>
          <div class="m-doc-modal-body">
            <h2 class="m-doc-modal-title">{{ t(`docs.${activeDoc.id}.title`) }}</h2>
            <div class="m-doc-modal-content" v-html="renderMarkdown(t(`docs.${activeDoc.id}.content`))"></div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.m-docs {
  padding: var(--space-md);
}

.m-filter-scroll {
  overflow-x: auto;
  scrollbar-width: none;
  margin-bottom: var(--space-lg);
}

.m-filter-scroll::-webkit-scrollbar {
  display: none;
}

.m-filter-pills {
  display: flex;
  gap: var(--space-sm);
}

.m-pill {
  flex: 0 0 auto;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: 500;
  white-space: nowrap;
}

.m-pill.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--text-inverse);
}

.m-doc-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.m-doc-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
}

.m-doc-card:active {
  border-color: var(--color-accent);
}

.m-doc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.m-doc-type {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.m-doc-title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.m-doc-summary {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: var(--space-md);
}

.m-doc-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border-subtle);
}

.m-doc-date {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
}

.m-doc-read {
  font-size: var(--text-sm);
  color: var(--color-accent);
  font-weight: 500;
}

/* Full-Screen Modal */
.m-doc-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-primary);
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.m-doc-modal-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  flex-shrink: 0;
}

.m-doc-close {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
}

.m-doc-close:active {
  background: var(--bg-hover);
}

.m-doc-modal-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.m-doc-modal-type {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.m-doc-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg) var(--space-md);
}

.m-doc-modal-title {
  font-size: var(--text-xl);
  margin-bottom: var(--space-xl);
  color: var(--text-primary);
}

.m-doc-modal-content {
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
}

.m-doc-modal-content :deep(h2) {
  font-size: var(--text-lg);
  margin: var(--space-xl) 0 var(--space-md);
  color: var(--text-primary);
}

.m-doc-modal-content :deep(h3) {
  font-size: var(--text-base);
  margin: var(--space-lg) 0 var(--space-sm);
  color: var(--text-primary);
}

.m-doc-modal-content :deep(p) {
  margin-bottom: var(--space-md);
}

.m-doc-modal-content :deep(blockquote) {
  border-left: 3px solid var(--color-primary);
  padding-left: var(--space-md);
  margin: var(--space-md) 0;
  color: var(--text-tertiary);
  font-style: italic;
}

.m-doc-modal-content :deep(code) {
  background: var(--bg-elevated);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.9em;
  color: var(--color-primary);
}

.m-doc-modal-content :deep(li) {
  margin-left: var(--space-lg);
  margin-bottom: var(--space-xs);
}

.m-doc-modal-content :deep(strong) {
  color: var(--text-primary);
  font-weight: 600;
}

.slide-up-enter-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-leave-active {
  transition: transform 0.2s ease-in;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
