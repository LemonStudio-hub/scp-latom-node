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
  <div class="m-proposal-detail">
    <!-- Back button -->
    <button class="m-back-btn" @click="goBack">
      ← {{ t('proposals.back') }}
    </button>

    <!-- Loading -->
    <div v-if="store.loading" class="m-loading">
      <div class="m-skeleton m-skeleton-title" />
      <div class="m-skeleton m-skeleton-meta" />
      <div class="m-skeleton m-skeleton-body" />
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="m-error">
      <span class="m-error-icon">⚠</span>
      <p>{{ store.error }}</p>
      <button class="m-retry-btn" @click="store.loadProposal(proposalId)">
        {{ t('errors.retry') }}
      </button>
    </div>

    <!-- Not found -->
    <div v-else-if="!proposal" class="m-empty">
      <span class="m-empty-icon">◇</span>
      <p>{{ t('proposals.empty') }}</p>
    </div>

    <!-- Proposal detail -->
    <template v-else>
      <div class="m-detail-header">
        <div class="m-detail-meta">
          <Badge :variant="(categoryVariant[proposal.category] as any) || 'safe'">
            {{ t(`proposals.categories.${proposal.category}`) || proposal.category }}
          </Badge>
          <span class="m-detail-status" :class="proposal.status">
            {{ t(`proposals.status.${proposal.status}`) }}
          </span>
        </div>

        <h1 class="m-detail-title">{{ proposal.title }}</h1>
        <p class="m-detail-author">
          {{ t('proposals.by', { author: proposal.authorCodename }) }}
          · {{ new Date(proposal.createdAt).toLocaleDateString() }}
        </p>
      </div>

      <div class="m-detail-content">
        {{ proposal.content }}
      </div>

      <!-- Voting section -->
      <div class="m-detail-voting">
        <div class="m-vote-counts">
          <span class="m-vc for">▲ {{ proposal.votesFor }}</span>
          <span class="m-vc against">▼ {{ proposal.votesAgainst }}</span>
          <span class="m-vc abstain">— {{ proposal.votesAbstain }}</span>
        </div>

        <div v-if="proposal.userVote" class="m-voted-msg">
          {{ t('proposals.vote.alreadyVoted') }}
        </div>

        <div v-else-if="auth.isAuthenticated && proposal.status === 'open'" class="m-vote-actions">
          <button class="m-vote-btn for" @click="castVote('for')">
            ▲ {{ t('proposals.vote.for') }}
          </button>
          <button class="m-vote-btn against" @click="castVote('against')">
            ▼ {{ t('proposals.vote.against') }}
          </button>
          <button class="m-vote-btn abstain" @click="castVote('abstain')">
            — {{ t('proposals.vote.abstain') }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.m-proposal-detail {
  padding: var(--space-md);
}

.m-back-btn {
  display: inline-block;
  padding: var(--space-xs) var(--space-sm);
  margin-bottom: var(--space-lg);
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.m-back-btn:hover {
  border-color: var(--text-tertiary);
  color: var(--text-primary);
}

/* ─── Detail Header ─── */

.m-detail-header {
  margin-bottom: var(--space-lg);
}

.m-detail-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.m-detail-status {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.m-detail-status.open { color: var(--color-accent); }
.m-detail-status.approved { color: var(--color-success); }
.m-detail-status.rejected { color: var(--color-danger); }

.m-detail-title {
  font-size: clamp(1.125rem, 5vw, 1.5rem);
  margin-bottom: var(--space-xs);
  line-height: var(--leading-tight);
}

.m-detail-author {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

/* ─── Content ─── */

.m-detail-content {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  white-space: pre-wrap;
  overflow-wrap: break-word;
  margin-bottom: var(--space-lg);
}

/* ─── Voting ─── */

.m-detail-voting {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.m-vote-counts {
  display: flex;
  gap: var(--space-md);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  margin-bottom: var(--space-md);
}

.m-vc.for { color: var(--color-success); }
.m-vc.against { color: var(--color-danger); }
.m-vc.abstain { color: var(--text-tertiary); }

.m-voted-msg {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.m-vote-actions {
  display: flex;
  gap: var(--space-sm);
}

.m-vote-btn {
  flex: 1;
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  background: transparent;
  cursor: pointer;
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  text-align: center;
  transition: all var(--transition-fast);
}

.m-vote-btn.for { color: var(--color-success); }
.m-vote-btn.for:hover { background: var(--color-success); color: var(--text-inverse); border-color: var(--color-success); }
.m-vote-btn.against { color: var(--color-danger); }
.m-vote-btn.against:hover { background: var(--color-danger); color: var(--text-inverse); border-color: var(--color-danger); }
.m-vote-btn.abstain { color: var(--text-tertiary); }
.m-vote-btn.abstain:hover { background: var(--text-tertiary); color: var(--text-inverse); border-color: var(--text-tertiary); }

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

.m-skeleton-title { height: 32px; width: 80%; }
.m-skeleton-meta { height: 16px; width: 40%; }
.m-skeleton-body { height: 200px; }

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
