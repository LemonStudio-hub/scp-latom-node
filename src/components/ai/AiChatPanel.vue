<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  sendChatMessage,
  sendChatMessageStream,
  fetchConversations,
  fetchConversation,
  deleteConversation,
  regenerateMessage,
  type AiMessage,
  type AiConversationMeta,
} from '@/services/ai'
import AiMessageBubble from './AiMessageBubble.vue'
import AiConversationList from './AiConversationList.vue'
import { UserRound, RotateCw, Send } from 'lucide-vue-next'

const { t } = useI18n()

const conversations = ref<AiConversationMeta[]>([])
const currentId = ref<string | null>(null)
const messages = ref<AiMessage[]>([])
const inputText = ref('')
const isStreaming = ref(false)
const loadingConversations = ref(false)
const loadingMessages = ref(false)
const messagesEl = ref<HTMLElement | null>(null)

onMounted(() => {
  loadConversations()
})

async function loadConversations() {
  loadingConversations.value = true
  const res = await fetchConversations({ limit: 50 })
  if (res.ok) {
    conversations.value = res.data.conversations
  }
  loadingConversations.value = false
}

async function selectConversation(id: string) {
  if (isStreaming.value) return
  currentId.value = id
  messages.value = []
  loadingMessages.value = true

  const res = await fetchConversation(id)
  if (res.ok) {
    messages.value = res.data.conversation.messages
  }
  loadingMessages.value = false
  scrollToBottom()
}

function newConversation() {
  if (isStreaming.value) return
  currentId.value = null
  messages.value = []
}

async function handleDelete(id: string) {
  if (!confirm(t('ai.deleteConfirm'))) return
  const res = await deleteConversation(id)
  if (res.ok) {
    conversations.value = conversations.value.filter((c) => c.id !== id)
    if (currentId.value === id) {
      currentId.value = null
      messages.value = []
    }
  }
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isStreaming.value) return

  inputText.value = ''

  // Add user message optimistically
  const userMsg: AiMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content: text,
    createdAt: new Date().toISOString(),
  }
  messages.value.push(userMsg)
  scrollToBottom()

  // Add placeholder for streaming
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

async function handleRegenerate() {
  if (!currentId.value || isStreaming.value) return

  // Remove last assistant message
  const lastAssistant = [...messages.value].reverse().find((m) => m.role === 'assistant')
  if (!lastAssistant) return

  const idx = messages.value.indexOf(lastAssistant)
  messages.value[idx] = { ...messages.value[idx], id: 'streaming', content: '' }
  isStreaming.value = true

  const res = await regenerateMessage(currentId.value)
  if (res.ok) {
    messages.value[idx] = res.data.message
  } else {
    messages.value[idx] = {
      ...messages.value[idx],
      content: `Error: ${res.error}`,
    }
  }
  isStreaming.value = false
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

watch(messages, () => scrollToBottom(), { deep: true })
</script>

<template>
  <div class="chat-panel">
    <!-- Sidebar -->
    <aside class="sidebar">
      <AiConversationList
        :conversations="conversations"
        :active-id="currentId"
        :loading="loadingConversations"
        @new="newConversation"
        @select="selectConversation"
        @delete="handleDelete"
      />
    </aside>

    <!-- Chat Area -->
    <main class="chat-area">
      <!-- Messages -->
      <div class="messages" ref="messagesEl">
        <div v-if="loadingMessages" class="loading">
          <div class="spinner" />
        </div>

        <div v-else-if="messages.length === 0" class="empty-state">
          <UserRound :size="48" :stroke-width="1.5" opacity="0.3" />
          <p>{{ t('ai.title') }}</p>
        </div>

        <template v-else>
          <AiMessageBubble
            v-for="msg in messages"
            :key="msg.id"
            :message="msg"
            :streaming="msg.id === 'streaming' && isStreaming"
          />
        </template>
      </div>

      <!-- Input -->
      <div class="input-bar">
        <button
          v-if="currentId && messages.some((m) => m.role === 'assistant' && m.id !== 'streaming')"
          class="regen-btn"
          :title="t('ai.regenerate')"
          :disabled="isStreaming"
          @click="handleRegenerate"
        >
          <RotateCw :size="16" />
        </button>
        <textarea
          v-model="inputText"
          :placeholder="t('ai.placeholder')"
          rows="1"
          :disabled="isStreaming"
          @keydown="handleKeydown"
          @input="(e: any) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }"
        />
        <button
          class="send-btn"
          :disabled="!inputText.trim() || isStreaming"
          @click="sendMessage"
        >
          <Send :size="18" />
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.chat-panel {
  display: flex;
  height: 600px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.sidebar {
  width: 280px;
  border-right: 1px solid var(--border-subtle);
  padding: var(--space-md);
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  color: var(--text-tertiary);
}

.empty-state p {
  font-size: var(--text-lg);
  font-weight: 500;
}

.loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-subtle);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.input-bar {
  display: flex;
  align-items: flex-end;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

.input-bar textarea {
  flex: 1;
  resize: none;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: inherit;
  line-height: 1.5;
  min-height: 40px;
  max-height: 120px;
  transition: border-color var(--transition-fast);
}

.input-bar textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.send-btn,
.regen-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.send-btn {
  background: var(--color-primary);
  color: var(--text-inverse);
}

.send-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.regen-btn {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

.regen-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.regen-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .chat-panel {
    flex-direction: column;
    height: auto;
    min-height: 500px;
  }

  .sidebar {
    width: 100%;
    height: auto;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
  }

  .messages {
    min-height: 300px;
  }
}
</style>
