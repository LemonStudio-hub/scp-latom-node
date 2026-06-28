<script setup lang="ts">
import { ref, computed } from 'vue'
import { documents } from '@/data/documents'
import Badge from '@/components/common/Badge.vue'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'
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
  <div class="documents">
    <div class="page-header">
      <h1>{{ t('documents.title') }}</h1>
      <p class="page-desc">{{ t('documents.description') }}</p>
    </div>

    <div class="type-filters">
      <button class="type-btn" :class="{ active: !typeFilter }" @click="typeFilter = null">
        {{ t('documents.all') }}
      </button>
      <button
        v-for="typ in types"
        :key="typ"
        class="type-btn"
        :class="{ active: typeFilter === typ }"
        @click="typeFilter = typ"
      >
        {{ t(`documents.types.${typ}`) }}
      </button>
    </div>

    <div class="doc-grid">
      <div v-for="doc in filtered" :key="doc.id" class="doc-card" @click="openDoc(doc)">
        <div class="doc-header">
          <Badge :variant="classVariant(doc.classification)">{{ t(`classification.${doc.classification}`) }}</Badge>
          <span class="doc-type">{{ t(`documents.types.${doc.type}`) }}</span>
        </div>
        <h3 class="doc-title">{{ t(`docs.${doc.id}.title`) }}</h3>
        <p class="doc-summary">{{ t(`docs.${doc.id}.summary`) }}</p>
        <div class="doc-footer">
          <span class="doc-date">{{ doc.date }}</span>
          <span class="doc-read">{{ t('documents.read') }}</span>
        </div>
      </div>
    </div>

    <!-- Document Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="activeDoc" class="doc-overlay" @click.self="closeDoc">
          <div class="doc-modal">
            <div class="doc-modal-header">
              <div>
                <Badge :variant="classVariant(activeDoc.classification)">
                  {{ t(`classification.${activeDoc.classification}`) }}
                </Badge>
                <span class="doc-modal-type">{{ t(`documents.types.${activeDoc.type}`) }}</span>
              </div>
              <button class="close-btn" @click="closeDoc">
                <X :size="20" />
              </button>
            </div>
            <h2 class="doc-modal-title">{{ t(`docs.${activeDoc.id}.title`) }}</h2>
            <div class="doc-modal-content" v-html="renderMarkdown(t(`docs.${activeDoc.id}.content`))"></div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.documents {
  max-width: var(--max-content);
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-header h1 {
  margin-bottom: var(--space-sm);
}

.page-desc {
  color: var(--text-secondary);
  font-size: var(--text-lg);
}

.type-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
}

.type-btn {
  padding: 6px 16px;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.type-btn:hover {
  border-color: var(--border-default);
  color: var(--text-primary);
}

.type-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--text-inverse);
}

.doc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-md);
}

.doc-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  flex-direction: column;
}

.doc-card:hover {
  border-color: var(--color-accent);
  box-shadow: 0 0 16px var(--color-accent-muted);
  transform: translateY(-2px);
}

.doc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.doc-type {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.doc-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.doc-summary {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.doc-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-subtle);
}

.doc-date {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
}

.doc-read {
  font-size: var(--text-sm);
  color: var(--color-accent);
  font-weight: 500;
}

/* Modal */
.doc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
}

.doc-modal {
  width: 100%;
  max-width: 720px;
  max-height: 85vh;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  overflow-y: auto;
  padding: var(--space-xl);
}

.doc-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.doc-modal-type {
  margin-left: var(--space-sm);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.close-btn {
  color: var(--text-tertiary);
  padding: var(--space-xs);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.doc-modal-title {
  font-size: var(--text-2xl);
  margin-bottom: var(--space-xl);
}

.doc-modal-content {
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
}

.doc-modal-content :deep(h2) {
  font-size: var(--text-xl);
  margin: var(--space-xl) 0 var(--space-md);
  color: var(--text-primary);
}

.doc-modal-content :deep(h3) {
  font-size: var(--text-lg);
  margin: var(--space-lg) 0 var(--space-sm);
  color: var(--text-primary);
}

.doc-modal-content :deep(h4) {
  font-size: var(--text-base);
  margin: var(--space-md) 0 var(--space-sm);
  color: var(--text-primary);
}

.doc-modal-content :deep(p) {
  margin-bottom: var(--space-md);
}

.doc-modal-content :deep(blockquote) {
  border-left: 3px solid var(--color-primary);
  padding-left: var(--space-md);
  margin: var(--space-md) 0;
  color: var(--text-tertiary);
  font-style: italic;
}

.doc-modal-content :deep(code) {
  background: var(--bg-elevated);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.9em;
  color: var(--color-primary);
}

.doc-modal-content :deep(li) {
  margin-left: var(--space-lg);
  margin-bottom: var(--space-xs);
}

.doc-modal-content :deep(strong) {
  color: var(--text-primary);
  font-weight: 600;
}

.doc-modal-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: var(--space-md) 0;
}

.doc-modal-content :deep(th),
.doc-modal-content :deep(td) {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border-subtle);
  text-align: left;
}

.doc-modal-content :deep(th) {
  background: var(--bg-elevated);
  font-weight: 600;
  color: var(--text-primary);
}

@media (max-width: 640px) {
  .doc-overlay {
    padding: var(--space-sm);
  }

  .doc-modal {
    padding: var(--space-md);
    max-height: 90vh;
    border-radius: var(--radius-md);
  }
}
</style>
