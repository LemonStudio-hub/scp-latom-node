import { ref, onMounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  sendChatMessageStream,
  fetchConversations,
  fetchConversation,
  deleteConversation,
  type AiMessage,
  type AiConversationMeta,
} from '@/services/ai'

export function useAiChat() {
  const { t } = useI18n()
  const router = useRouter()

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
            const content =
              error === 'ERR-401-CLEARANCE'
                ? `⚠ ${t('errors.ERR-AUTH-EXPIRED')}`
                : `Error: ${error}`
            messages.value[idx] = {
              ...messages.value[idx],
              content,
            }
          }
          isStreaming.value = false
          if (error === 'ERR-401-CLEARANCE') {
            router.push('/login')
          }
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

  watch(messages, () => scrollToBottom(), { deep: true })

  return {
    t,
    conversations,
    currentId,
    messages,
    inputText,
    isStreaming,
    loadingConversations,
    loadingMessages,
    messagesEl,
    loadConversations,
    selectConversation,
    newConversation,
    handleDelete,
    sendMessage,
    handleKeydown,
    scrollToBottom,
  }
}
