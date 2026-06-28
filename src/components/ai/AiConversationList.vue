<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AiConversationMeta } from '@/services/ai'
import { Plus, Trash2 } from 'lucide-vue-next'

const { t } = useI18n()

defineProps<{
  conversations: AiConversationMeta[]
  activeId: string | null
  loading?: boolean
}>()

const emit = defineEmits<{
  new: []
  select: [id: string]
  delete: [id: string]
}>()

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}
</script>

<template>
  <div class="conv-list">
    <button class="new-btn" @click="emit('new')">
      <Plus :size="16" />
      {{ t('ai.newConversation') }}
    </button>

    <div class="items" v-if="conversations.length > 0">
      <button
        v-for="conv in conversations"
        :key="conv.id"
        class="conv-item"
        :class="{ active: conv.id === activeId }"
        @click="emit('select', conv.id)"
      >
        <div class="conv-info">
          <span class="conv-title">{{ conv.title }}</span>
          <span class="conv-meta">
            {{ conv.messageCount }} msgs · {{ formatTime(conv.lastMessageAt) }}
          </span>
        </div>
        <button
          class="delete-btn"
          :title="t('ai.deleteConfirm')"
          @click.stop="emit('delete', conv.id)"
        >
          <Trash2 :size="14" />
        </button>
      </button>
    </div>

    <div v-else-if="!loading" class="empty">
      {{ t('ai.noConversations') }}
    </div>
  </div>
</template>

<style scoped>
.conv-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.new-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-sm);
  background: var(--color-primary);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.new-btn:hover {
  background: var(--color-primary-hover);
}

.items {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.conv-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  text-align: left;
  cursor: pointer;
  transition: background var(--transition-fast);
  width: 100%;
}

.conv-item:hover {
  background: var(--bg-elevated);
}

.conv-item.active {
  background: var(--color-primary-muted);
}

.conv-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.conv-title {
  font-size: var(--text-sm);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-meta {
  font-size: 11px;
  color: var(--text-tertiary);
}

.delete-btn {
  padding: 4px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  cursor: pointer;
  opacity: 0;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.conv-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--color-danger);
  background: var(--color-danger-muted);
}

.empty {
  padding: var(--space-xl) var(--space-md);
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}
</style>
