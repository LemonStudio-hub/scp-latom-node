<script setup lang="ts">
import { computed } from 'vue'
import type { AiMessage } from '@/services/ai'
import { UserRound } from 'lucide-vue-next'

const props = defineProps<{
  message: AiMessage
  streaming?: boolean
}>()

const isUser = computed(() => props.message.role === 'user')
const isAssistant = computed(() => props.message.role === 'assistant')

const formattedContent = computed(() => {
  if (!isAssistant.value) return props.message.content
  return renderSimpleMarkdown(props.message.content)
})

function renderSimpleMarkdown(text: string): string {
  let html = text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // Unordered lists
    .replace(/^[*-] (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n/g, '<br>')

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*?<\/li>(?:<br>)?)+)/g, '<ul>$1</ul>')
  html = html.replace(/<br><\/ul>/g, '</ul>')

  return html
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
</script>

<template>
  <div class="message" :class="{ 'message-user': isUser, 'message-assistant': isAssistant }">
    <div v-if="isAssistant" class="avatar">
      <UserRound :size="18" />
    </div>
    <div class="bubble" :class="{ 'bubble-user': isUser, 'bubble-assistant': isAssistant }">
      <div v-if="isAssistant" class="content markdown" v-html="formattedContent" />
      <div v-else class="content">{{ message.content }}</div>
      <div v-if="streaming && !message.content" class="typing-dots">
        <span /><span /><span />
      </div>
    </div>
    <span v-if="message.createdAt && !streaming" class="time">{{ formatTime(message.createdAt) }}</span>
  </div>
</template>

<style scoped>
.message {
  display: flex;
  gap: var(--space-sm);
  max-width: 80%;
  align-items: flex-end;
}

.message-user {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message-assistant {
  margin-right: auto;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--color-primary-muted);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bubble {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  line-height: 1.6;
  word-break: break-word;
}

.bubble-user {
  background: var(--color-primary);
  color: var(--text-inverse);
  border-bottom-right-radius: var(--radius-xs);
}

.bubble-assistant {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-bottom-left-radius: var(--radius-xs);
}

.content :deep(pre) {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  overflow-x: auto;
  margin: var(--space-xs) 0;
  font-size: var(--text-xs);
}

.content :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.9em;
}

.bubble-user .content :deep(code) {
  background: rgba(255, 255, 255, 0.15);
  padding: 1px 4px;
  border-radius: 3px;
}

.bubble-assistant .content :deep(code) {
  background: var(--bg-surface);
  padding: 1px 4px;
  border-radius: 3px;
}

.content :deep(strong) {
  font-weight: 600;
}

.content :deep(h2),
.content :deep(h3),
.content :deep(h4) {
  margin: var(--space-xs) 0;
  font-weight: 600;
}

.content :deep(ul) {
  margin: var(--space-xs) 0;
  padding-left: var(--space-lg);
}

.content :deep(li) {
  margin: 2px 0;
}

.time {
  font-size: 10px;
  color: var(--text-tertiary);
  white-space: nowrap;
  flex-shrink: 0;
}

.typing-dots {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-tertiary);
  animation: bounce 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: 0s; }
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
</style>
