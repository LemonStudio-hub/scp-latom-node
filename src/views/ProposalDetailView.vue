<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProposalsStore } from '@/stores/proposals'
import { useAuthStore } from '@/stores/auth'
import Badge from '@/components/common/Badge.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useProposalsStore()
const auth = useAuthStore()

const proposalId = computed(() => parseInt(route.params.id as string, 10))
const proposal = computed(() => store.currentProposal)

const categoryVariant: Record<string, string> = {
  protocol: 'keter',
  research: 'thaumiel',
  containment: 'euclid',
  general: 'safe',
}

function goBack() {
  router.push('/proposals')
}

async function castVote(vote: 'for' | 'against' | 'abstain') {
  await store.vote(proposalId.value, vote)
}

onMounted(() => {
  store.loadProposal(proposalId.value)
})
</script>

<template>
  <div class="proposal-detail-view">
    <button class="back-btn" @click="goBack">
      ← {{ t('proposals.back') }}
    </button>

    <!-- Loading -->
    <div v-if="store.loading" class="loading-state">
      <div class="skeleton skeleton-title" />
      <div class="skeleton skeleton-meta" />
      <div class="skeleton skeleton-body" />
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="error-state">
      <span class="error-icon">⚠</span>
      <p>{{ store.error }}</p>
      <button class="retry-btn" @click="store.loadProposal(proposalId)">
        {{ t('errors.retry') }}
      </button>
    </div>

    <!-- Not found -->
    <div v-else-if="!proposal" class="empty-state">
      <span class="empty-icon">◇</span>
      <p>{{ t('proposals.empty') }}</p>
    </div>

    <!-- Proposal detail -->
    <template v-else>
      <div class="detail-header">
        <div class="detail-meta">
          <Badge :variant="(categoryVariant[proposal.category] as any) || 'safe'">
            {{ t(`proposals.categories.${proposal.category}`) || proposal.category }}
          </Badge>
          <span class="detail-status" :class="proposal.status">
            {{ t(`proposals.status.${proposal.status}`) }}
          </span>
        </div>

        <h1 class="detail-title">{{ proposal.title }}</h1>
        <p class="detail-author">
          {{ t('proposals.by', { author: proposal.authorCodename }) }}
          · {{ new Date(proposal.createdAt).toLocaleDateString() }}
        </p>
      </div>

      <div class="detail-content">
        {{ proposal.content }}
      </div>

      <!-- Voting section -->
      <div class="detail-voting">
        <div class="vote-counts">
          <span class="vote-count for">▲ {{ proposal.votesFor }}</span>
          <span class="vote-count against">▼ {{ proposal.votesAgainst }}</span>
          <span class="vote-count abstain">— {{ proposal.votesAbstain }}</span>
        </div>

        <div v-if="proposal.userVote" class="voted-msg">
          {{ t('proposals.vote.alreadyVoted') }}
        </div>

        <div v-else-if="auth.isAuthenticated && proposal.status === 'open'" class="vote-actions">
          <button class="vote-btn for" @click="castVote('for')">
            ▲ {{ t('proposals.vote.for') }}
          </button>
          <button class="vote-btn against" @click="castVote('against')">
            ▼ {{ t('proposals.vote.against') }}
          </button>
          <button class="vote-btn abstain" @click="castVote('abstain')">
            — {{ t('proposals.vote.abstain') }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.proposal-detail-view {
  max-width: var(--max-content);
  margin: 0 auto;
}

.back-btn {
  display: inline-block;
  padding: var(--space-xs) var(--space-md);
  margin-bottom: var(--space-xl);
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.back-btn:hover {
  border-color: var(--text-tertiary);
  color: var(--text-primary);
}

/* ─── Detail Header ─── */

.detail-header {
  margin-bottom: var(--space-xl);
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.detail-status {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-status.open { color: var(--color-accent); }
.detail-status.approved { color: var(--color-success); }
.detail-status.rejected { color: var(--color-danger); }

.detail-title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  margin-bottom: var(--space-xs);
  line-height: var(--leading-tight);
}

.detail-author {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

/* ─── Content ─── */

.detail-content {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-xl);
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  white-space: pre-wrap;
  overflow-wrap: break-word;
  margin-bottom: var(--space-xl);
}

/* ─── Voting ─── */

.detail-voting {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.vote-counts {
  display: flex;
  gap: var(--space-lg);
  font-size: var(--text-base);
  font-family: var(--font-mono);
}

.vote-count.for { color: var(--color-success); }
.vote-count.against { color: var(--color-danger); }
.vote-count.abstain { color: var(--text-tertiary); }

.voted-msg {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.vote-actions {
  display: flex;
  gap: var(--space-sm);
}

.vote-btn {
  padding: var(--space-xs) var(--space-lg);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  background: transparent;
  cursor: pointer;
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  transition: all var(--transition-fast);
}

.vote-btn.for { color: var(--color-success); }
.vote-btn.for:hover { background: var(--color-success); color: var(--text-inverse); border-color: var(--color-success); }
.vote-btn.against { color: var(--color-danger); }
.vote-btn.against:hover { background: var(--color-danger); color: var(--text-inverse); border-color: var(--color-danger); }
.vote-btn.abstain { color: var(--text-tertiary); }
.vote-btn.abstain:hover { background: var(--text-tertiary); color: var(--text-inverse); border-color: var(--text-tertiary); }

/* ─── States ─── */

.loading-state {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.skeleton {
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-title { height: 40px; width: 70%; }
.skeleton-meta { height: 20px; width: 30%; }
.skeleton-body { height: 300px; }

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.error-state, .empty-state {
  text-align: center;
  padding: var(--space-3xl) 0;
}

.error-icon, .empty-icon {
  font-size: 3rem;
  color: var(--text-tertiary);
  display: block;
  margin-bottom: var(--space-md);
}

.error-icon { color: var(--color-danger); }

.retry-btn {
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
