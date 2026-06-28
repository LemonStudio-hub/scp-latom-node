<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  sendChatMessageStream,
  fetchConversations,
  fetchConversation,
  deleteConversation,
  type AiMessage,
  type AiConversationMeta,
} from '@/services/ai'
import AiMessageBubble from '@/components/ai/AiMessageBubble.vue'
import { Plus, Trash, ChevronLeft, Send } from 'lucide-vue-next'

const { t } = useI18n()

const conversations = ref<AiConversationMeta[]>([])
const currentId = ref<string | null>(null)
const messages = ref<AiMessage[]>([])
const inputText = ref('')
const isStreaming = ref(false)
const showList = ref(true)
const messagesEl = ref<HTMLElement | null>(null)

onMounted(() => {
  loadConversations()
})

async function loadConversations() {
  const res = await fetchConversations({ limit: 50 })
  if (res.ok) {
    conversations.value = res.data.conversations
  }
}

async function selectConversation(id: string) {
  if (isStreaming.value) return
  currentId.value = id
  messages.value = []
  showList.value = false

  const res = await fetchConversation(id)
  if (res.ok) {
    messages.value = res.data.conversation.messages
  }
  scrollToBottom()
}

function newConversation() {
  if (isStreaming.value) return
  currentId.value = null
  messages.value = []
  showList.value = false
}

function backToList() {
  if (isStreaming.value) return
  showList.value = true
  loadConversations()
}

async function handleDelete(id: string) {
  if (!confirm(t('ai.deleteConfirm'))) return
  const res = await deleteConversation(id)
  if (res.ok) {
    conversations.value = conversations.value.filter((c) => c.id !== id)
    if (currentId.value === id) {
      currentId.value = null
      messages.value = []
      showList.value = true
    }
  }
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isStreaming.value) return

  inputText.value = ''

  const userMsg: AiMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content: text,
    createdAt: new Date().toISOString(),
  }
  messages.value.push(userMsg)
  scrollToBottom()

  const placeholder: AiMessage = {
    id: 'streaming',
    role: 'assistant',
    content: '',
    createdAt: new Date().toISOString(),
  }
  messages.value.push(placeholder)
  isStreaming.value = true

  const isFirst = !currentId.value

  await sendChatMessageStream(
    {
      conversationId: currentId.value ?? undefined,
      message: text,
    },
    {
      onMetadata(data) {
        currentId.value = data.conversationId
      },
      onChunk(delta) {
        const idx = messages.value.findIndex((m) => m.id === 'streaming')
        if (idx >= 0) {
          messages.value[idx] = {
            ...messages.value[idx],
            content: messages.value[idx].content + delta,
          }
        }
        scrollToBottom()
      },
      onDone(message) {
        const idx = messages.value.findIndex((m) => m.id === 'streaming')
        if (idx >= 0) {
          messages.value[idx] = message
        }
        isStreaming.value = false
        if (isFirst && currentId.value) {
          loadConversations()
        }
      },
      onError(error) {
        const idx = messages.value.findIndex((m) => m.id === 'streaming')
        if (idx >= 0) {
          messages.value[idx] = {
            ...messages.value[idx],
            content: `Error: ${error}`,
          }
        }
        isStreaming.value = false
      },
    },
  )
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

watch(messages, () => scrollToBottom(), { deep: true })
</script>

<template>
  <div class="m-chat">
    <!-- Conversation List View -->
    <template v-if="showList">
      <div class="m-chat-header">
        <h3>{{ t('ai.conversations') }}</h3>
      </div>

      <button class="m-new-btn" @click="newConversation">
        <Plus :size="16" />
        {{ t('ai.newConversation') }}
      </button>

      <div class="m-conv-items" v-if="conversations.length > 0">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="m-conv-item"
          @click="selectConversation(conv.id)"
        >
          <div class="m-conv-info">
            <span class="m-conv-title">{{ conv.title }}</span>
            <span class="m-conv-meta">{{ conv.messageCount }} msgs · {{ formatTime(conv.lastMessageAt) }}</span>
          </div>
          <button class="m-conv-delete" @click.stop="handleDelete(conv.id)">
            <Trash :size="14" />
          </button>
        </div>
      </div>

      <div v-else class="m-empty">
        {{ t('ai.noConversations') }}
      </div>
    </template>

    <!-- Chat View -->
    <template v-else>
      <div class="m-chat-header">
        <button class="m-back-btn" @click="backToList">
          <ChevronLeft :size="20" />
        </button>
        <span class="m-chat-title">{{ currentId ? (conversations.find(c => c.id === currentId)?.title ?? t('ai.title')) : t('ai.newConversation') }}</span>
      </div>

      <div class="m-messages" ref="messagesEl">
        <div v-if="messages.length === 0" class="m-empty-chat">
          <p>{{ t('ai.title') }}</p>
        </div>

        <AiMessageBubble
          v-for="msg in messages"
          :key="msg.id"
          :message="msg"
          :streaming="msg.id === 'streaming' && isStreaming"
        />
      </div>

      <div class="m-input-bar">
        <textarea
          v-model="inputText"
          :placeholder="t('ai.placeholder')"
          rows="1"
          :disabled="isStreaming"
          @keydown="handleKeydown"
          @input="(e: any) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px' }"
        />
        <button
          class="m-send-btn"
          :disabled="!inputText.trim() || isStreaming"
          @click="sendMessage"
        >
          <Send :size="18" />
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.m-chat {
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  min-height: 400px;
}

.m-chat-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.m-chat-header h3 {
  font-size: var(--text-base);
  font-weight: 600;
}

.m-chat-title {
  font-size: var(--text-sm);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.m-back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
}

.m-new-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  margin: var(--space-md);
  background: var(--color-primary);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
}

.m-conv-items {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--space-md) var(--space-md);
}

.m-conv-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.m-conv-item:active {
  background: var(--bg-elevated);
}

.m-conv-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.m-conv-title {
  font-size: var(--text-sm);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.m-conv-meta {
  font-size: 11px;
  color: var(--text-tertiary);
}

.m-conv-delete {
  padding: 6px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  cursor: pointer;
  flex-shrink: 0;
}

.m-empty {
  padding: var(--space-xl);
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.m-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  min-height: 200px;
}

.m-empty-chat {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}

.m-input-bar {
  display: flex;
  align-items: flex-end;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

.m-input-bar textarea {
  flex: 1;
  resize: none;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 16px; /* prevent iOS zoom */
  font-family: inherit;
  line-height: 1.5;
  min-height: 40px;
  max-height: 100px;
}

.m-input-bar textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.m-send-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  flex-shrink: 0;
}

.m-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
