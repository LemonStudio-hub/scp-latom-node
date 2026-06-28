<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { submitReport, type ReportType, type ReportSubmission } from '@/services/reports'
import { X, CircleCheckBig } from 'lucide-vue-next'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  scpNumber: number
  language: 'en' | 'cn'
  scpId: string
  existingCount?: number
  maxReports?: number
}>()

const emit = defineEmits<{
  close: []
  submitted: []
}>()

const reportType = ref<ReportType>('content_error')
const description = ref('')
const submitting = ref(false)
const error = ref('')
const success = ref(false)

const reportTypes: ReportType[] = ['content_error', 'display_issue', 'special_handling', 'other']

const remainingSlots = computed(() => {
  const max = props.maxReports ?? 3
  const used = props.existingCount ?? 0
  return Math.max(0, max - used)
})

const canSubmit = computed(() => {
  return description.value.trim().length >= 10 && !submitting.value && remainingSlots.value > 0
})

watch(() => props.open, (open) => {
  if (open) {
    reportType.value = 'content_error'
    description.value = ''
    error.value = ''
    success.value = false
  }
})

function close() {
  if (!submitting.value) {
    emit('close')
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return

  submitting.value = true
  error.value = ''

  const data: ReportSubmission = {
    scpNumber: props.scpNumber,
    language: props.language,
    reportType: reportType.value,
    description: description.value.trim(),
  }

  const res = await submitReport(data)

  submitting.value = false

  if (res.ok) {
    success.value = true
    setTimeout(() => {
      emit('submitted')
      emit('close')
    }, 1500)
  } else {
    error.value = res.error
  }
}

function handleOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('report-overlay')) {
    close()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="report-overlay" @click="handleOverlayClick">
        <div class="report-modal" role="dialog" :aria-label="t('entry.report')">
          <!-- Header -->
          <div class="report-header">
            <h3 class="report-title">{{ t('entry.report') }}</h3>
            <span class="report-scp-id">{{ scpId }}</span>
            <button class="report-close" @click="close" :disabled="submitting">
              <X :size="18" />
            </button>
          </div>

          <!-- Success State -->
          <div v-if="success" class="report-success">
            <CircleCheckBig :size="48" />
            <p>{{ t('entry.reportSuccess') }}</p>
          </div>

          <!-- Form -->
          <template v-else>
            <div class="report-body">
              <!-- Remaining slots -->
              <div v-if="remainingSlots < (maxReports ?? 3)" class="report-slots">
                {{ t('entry.reportSlots', { remaining: remainingSlots, max: maxReports ?? 3 }) }}
              </div>

              <!-- Report Type -->
              <div class="report-field">
                <label class="report-label">{{ t('entry.reportType') }}</label>
                <div class="report-type-grid">
                  <button
                    v-for="rt in reportTypes"
                    :key="rt"
                    class="report-type-btn"
                    :class="{ active: reportType === rt }"
                    @click="reportType = rt"
                  >
                    {{ t(`entry.reportTypes.${rt}`) }}
                  </button>
                </div>
              </div>

              <!-- Description -->
              <div class="report-field">
                <label class="report-label" for="report-desc">
                  {{ t('entry.reportDescription') }}
                </label>
                <textarea
                  id="report-desc"
                  v-model="description"
                  class="report-textarea"
                  :placeholder="t('entry.reportPlaceholder')"
                  rows="4"
                  maxlength="2000"
                  :disabled="submitting"
                />
                <span class="report-char-count">{{ description.length }}/2000</span>
              </div>

              <!-- Error -->
              <div v-if="error" class="report-error">
                {{ error }}
              </div>
            </div>

            <!-- Footer -->
            <div class="report-footer">
              <button class="report-cancel" @click="close" :disabled="submitting">
                {{ t('auth.cancel') }}
              </button>
              <button
                class="report-submit"
                :disabled="!canSubmit"
                @click="handleSubmit"
              >
                <span v-if="submitting" class="report-spinner" />
                {{ submitting ? t('entry.reportSubmitting') : t('entry.reportSubmit') }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.report-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  padding: var(--space-md);
}

.report-modal {
  background: var(--bg-elevated, #1a1a1f);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.report-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-subtle);
}

.report-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.report-scp-id {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-accent);
}

.report-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.report-close:hover {
  background: var(--bg-surface);
  color: var(--text-primary);
}

.report-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.report-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.report-slots {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-surface);
  border-radius: var(--radius-sm);
}

.report-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.report-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
}

.report-type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
}

.report-type-btn {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.report-type-btn:hover {
  border-color: var(--color-accent);
  color: var(--text-primary);
}

.report-type-btn.active {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  color: var(--color-accent);
}

.report-textarea {
  width: 100%;
  padding: var(--space-md);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  transition: border-color var(--transition-fast);
}

.report-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
}

.report-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.report-textarea::placeholder {
  color: var(--text-tertiary);
}

.report-char-count {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-align: right;
  font-family: var(--font-mono);
}

.report-error {
  padding: var(--space-md);
  background: color-mix(in srgb, var(--color-danger) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
  border-radius: var(--radius-sm);
  color: var(--color-danger);
  font-size: var(--text-sm);
}

.report-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-3xl) var(--space-lg);
  color: var(--color-accent);
  text-align: center;
}

.report-success p {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.report-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-top: 1px solid var(--border-subtle);
}

.report-cancel {
  padding: var(--space-sm) var(--space-lg);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.report-cancel:hover {
  border-color: var(--text-tertiary);
  color: var(--text-primary);
}

.report-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.report-submit {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: #0a0a0f;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.report-submit:hover:not(:disabled) {
  background: var(--color-accent-hover, #d4af5a);
}

.report-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.report-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .report-modal {
    max-height: 100vh;
    border-radius: var(--radius-md);
  }

  .report-type-grid {
    grid-template-columns: 1fr;
  }
}
</style>
