<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProposalsStore } from '@/stores/proposals'
import { useAuthStore } from '@/stores/auth'
import Badge from '@/components/common/Badge.vue'

const { t } = useI18n()
const store = useProposalsStore()
const auth = useAuthStore()

const showForm = ref(false)
const formTitle = ref('')
const formContent = ref('')
const formCategory = ref('general')
const voteMessage = ref('')

const categories = ['protocol', 'research', 'containment', 'general'] as const

const categoryVariant: Record<string, string> = {
  protocol: 'keter',
  research: 'thaumiel',
  containment: 'euclid',
  general: 'safe',
}

const dailyUsed = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return store.proposals.filter(
    (p) => p.createdAt.slice(0, 10) === today && p.authorCodename === auth.user?.codename
  ).length
})

function toggleForm() {
  showForm.value = !showForm.value
  if (showForm.value && !formContent.value) {
    formContent.value = t('proposals.template')
  }
}

async function submitProposal() {
  const ok = await store.submitProposal({
    title: formTitle.value.trim(),
    content: formContent.value.trim(),
    category: formCategory.value,
  })
  if (ok) {
    showForm.value = false
    formTitle.value = ''
    formContent.value = ''
    formCategory.value = 'general'
  }
}

async function castVote(proposalId: number, vote: 'for' | 'against' | 'abstain') {
  const ok = await store.vote(proposalId, vote)
  if (ok) {
    voteMessage.value = t('proposals.vote.success')
    setTimeout(() => { voteMessage.value = '' }, 3000)
  }
}

onMounted(() => {
  store.loadProposals()
})
</script>

<template>
  <div class="m-proposals">
    <div class="m-page-header">
      <h1 class="m-page-title">{{ t('proposals.title') }}</h1>
      <p class="m-page-desc">{{ t('proposals.description') }}</p>
      <button class="m-submit-btn" @click="toggleForm">
        {{ showForm ? t('auth.cancel') : t('proposals.submit') }}
      </button>
    </div>

    <!-- Create Form -->
    <div v-if="showForm" class="m-create-form">
      <div class="m-form-group">
        <label class="m-form-label">{{ t('proposals.titleLabel') }}</label>
        <input
          v-model="formTitle"
          class="m-form-input"
          :placeholder="t('proposals.titlePlaceholder')"
          maxlength="200"
        />
      </div>

      <div class="m-form-group">
        <label class="m-form-label">{{ t('proposals.categoryLabel') }}</label>
        <select v-model="formCategory" class="m-form-select">
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ t(`proposals.categories.${cat}`) }}
          </option>
        </select>
      </div>

      <div class="m-form-group">
        <label class="m-form-label">{{ t('proposals.contentLabel') }}</label>
        <textarea
          v-model="formContent"
          class="m-form-textarea"
          :placeholder="t('proposals.contentPlaceholder')"
          rows="10"
          maxlength="10000"
        />
      </div>

      <p class="m-daily-info">{{ t('proposals.dailyLimit', { max: 2, used: dailyUsed }) }}</p>

      <div class="m-form-actions">
        <button
          class="m-submit-btn"
          :disabled="store.creating || formTitle.trim().length < 5 || formContent.trim().length < 20"
          @click="submitProposal"
        >
          {{ store.creating ? '...' : t('proposals.submit') }}
        </button>
      </div>

      <p v-if="store.error" class="m-form-error">{{ store.error }}</p>
    </div>

    <!-- Vote message -->
    <p v-if="voteMessage" class="m-vote-message">{{ voteMessage }}</p>

    <!-- Loading -->
    <div v-if="store.loading && !store.proposals.length" class="m-loading">
      <div v-for="i in 3" :key="i" class="m-skeleton m-skeleton-card" />
    </div>

    <!-- Error -->
    <div v-else-if="store.error && !store.proposals.length" class="m-error">
      <span class="m-error-icon">⚠</span>
      <p>{{ store.error }}</p>
      <button class="m-retry-btn" @click="store.loadProposals()">{{ t('errors.retry') }}</button>
    </div>

    <!-- Empty -->
    <div v-else-if="!store.proposals.length && !store.loading" class="m-empty">
      <span class="m-empty-icon">◇</span>
      <p>{{ t('proposals.empty') }}</p>
    </div>

    <!-- Proposal List -->
    <div v-else class="m-proposal-list">
      <div v-for="p in store.proposals" :key="p.id" class="m-proposal-card">
        <div class="m-proposal-top">
          <Badge :variant="(categoryVariant[p.category] as any) || 'safe'">
            {{ t(`proposals.categories.${p.category}`) || p.category }}
          </Badge>
          <span class="m-proposal-status" :class="p.status">{{ t(`proposals.status.${p.status}`) }}</span>
        </div>

        <h3 class="m-proposal-title">{{ p.title }}</h3>
        <p class="m-proposal-author">{{ t('proposals.by', { author: p.authorCodename }) }}</p>

        <p class="m-proposal-preview">{{ p.content.slice(0, 150) }}{{ p.content.length > 150 ? '...' : '' }}</p>

        <div class="m-proposal-footer">
          <div class="m-vote-counts">
            <span class="m-vc for">▲ {{ p.votesFor }}</span>
            <span class="m-vc against">▼ {{ p.votesAgainst }}</span>
            <span class="m-vc abstain">— {{ p.votesAbstain }}</span>
          </div>

          <div v-if="p.userVote" class="m-voted">{{ t('proposals.vote.alreadyVoted') }}</div>

          <div v-else-if="auth.isAuthenticated && p.status === 'open'" class="m-vote-btns">
            <button class="m-vote-btn for" @click="castVote(p.id, 'for')">▲</button>
            <button class="m-vote-btn against" @click="castVote(p.id, 'against')">▼</button>
            <button class="m-vote-btn abstain" @click="castVote(p.id, 'abstain')">—</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.m-proposals {
  padding: var(--space-md);
}

.m-page-header {
  margin-bottom: var(--space-lg);
}

.m-page-title {
  font-size: clamp(1.25rem, 5vw, 1.75rem);
  margin-bottom: var(--space-xs);
}

.m-page-desc {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
}

.m-submit-btn {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  border: none;
  color: var(--text-inverse);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  width: 100%;
}

.m-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ─── Form ─── */

.m-create-form {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.m-form-group { margin-bottom: var(--space-md); }

.m-form-label {
  display: block;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.m-form-input,
.m-form-select,
.m-form-textarea {
  width: 100%;
  padding: var(--space-sm);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--text-sm);
  box-sizing: border-box;
}

.m-form-input:focus,
.m-form-select:focus,
.m-form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.m-form-textarea {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  resize: vertical;
}

.m-daily-info {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  margin-bottom: var(--space-md);
}

.m-form-actions { margin-top: var(--space-md); }

.m-form-error {
  margin-top: var(--space-md);
  color: var(--color-danger);
  font-size: var(--text-xs);
}

/* ─── Vote Message ─── */

.m-vote-message {
  background: var(--bg-surface);
  border: 1px solid var(--color-success, var(--border-subtle));
  border-radius: var(--radius-sm);
  padding: var(--space-sm);
  margin-bottom: var(--space-md);
  font-size: var(--text-xs);
  color: var(--color-success, var(--text-secondary));
  text-align: center;
}

/* ─── Cards ─── */

.m-proposal-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.m-proposal-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.m-proposal-top {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.m-proposal-status {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  text-transform: uppercase;
}

.m-proposal-status.open { color: var(--color-accent); }
.m-proposal-status.approved { color: var(--color-success); }
.m-proposal-status.rejected { color: var(--color-danger); }

.m-proposal-title {
  font-size: var(--text-base);
  margin-bottom: var(--space-xs);
}

.m-proposal-author {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  margin-bottom: var(--space-sm);
}

.m-proposal-preview {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-md);
  white-space: pre-wrap;
}

.m-proposal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border-subtle);
}

.m-vote-counts {
  display: flex;
  gap: var(--space-sm);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
}

.m-vc.for { color: var(--color-success); }
.m-vc.against { color: var(--color-danger); }
.m-vc.abstain { color: var(--text-tertiary); }

.m-voted {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.m-vote-btns {
  display: flex;
  gap: var(--space-xs);
}

.m-vote-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  background: transparent;
  cursor: pointer;
  font-size: var(--text-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.m-vote-btn.for { color: var(--color-success); }
.m-vote-btn.for:hover { background: var(--color-success); color: var(--text-inverse); }
.m-vote-btn.against { color: var(--color-danger); }
.m-vote-btn.against:hover { background: var(--color-danger); color: var(--text-inverse); }
.m-vote-btn.abstain { color: var(--text-tertiary); }
.m-vote-btn.abstain:hover { background: var(--text-tertiary); color: var(--text-inverse); }

/* ─── States ─── */

.m-loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.m-skeleton {
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}

.m-skeleton-card { height: 140px; }

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.m-error, .m-empty {
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
}

.m-error-icon, .m-empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: var(--space-md);
}

.m-error-icon { color: var(--color-danger); }
.m-empty-icon { color: var(--text-tertiary); }

.m-retry-btn {
  margin-top: var(--space-md);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  border: none;
  color: var(--text-inverse);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}
</style>
