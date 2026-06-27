import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import {
  fetchProposals,
  fetchProposal,
  createProposal,
  voteProposal,
  type ProposalPublic,
} from '@/services/proposals'

export const useProposalsStore = defineStore('proposals', () => {
  const auth = useAuthStore()

  const proposals = ref<ProposalPublic[]>([])
  const currentProposal = ref<ProposalPublic | null>(null)
  const loading = ref(false)
  const error = ref('')
  const creating = ref(false)
  const total = ref(0)
  const page = ref(1)
  const totalPages = ref(0)

  async function loadProposals(p = 1, status?: string, category?: string) {
    loading.value = true
    error.value = ''
    const res = await fetchProposals(p, 20, status, category, auth.token || undefined)
    loading.value = false

    if (res.ok) {
      proposals.value = res.data.proposals
      total.value = res.data.total
      page.value = res.data.page
      totalPages.value = res.data.totalPages
    } else {
      error.value = res.error
    }
  }

  async function loadProposal(id: number) {
    loading.value = true
    error.value = ''
    const res = await fetchProposal(id, auth.token || undefined)
    loading.value = false

    if (res.ok) {
      currentProposal.value = res.data.proposal
    } else {
      error.value = res.error
    }
  }

  async function submitProposal(data: { title: string; content: string; category: string }): Promise<boolean> {
    if (!auth.token) return false
    creating.value = true
    error.value = ''
    const res = await createProposal(data, auth.token)
    creating.value = false

    if (res.ok) {
      proposals.value.unshift(res.data.proposal)
      return true
    }
    error.value = res.error
    return false
  }

  async function vote(proposalId: number, voteType: 'for' | 'against' | 'abstain'): Promise<boolean> {
    if (!auth.token) return false
    error.value = ''
    const res = await voteProposal(proposalId, voteType, auth.token)

    if (res.ok) {
      // Update in list
      const idx = proposals.value.findIndex((p) => p.id === proposalId)
      if (idx !== -1) {
        proposals.value[idx].votesFor = res.data.votesFor
        proposals.value[idx].votesAgainst = res.data.votesAgainst
        proposals.value[idx].votesAbstain = res.data.votesAbstain
        proposals.value[idx].userVote = res.data.userVote as ProposalPublic['userVote']
      }
      // Update current
      if (currentProposal.value?.id === proposalId) {
        currentProposal.value.votesFor = res.data.votesFor
        currentProposal.value.votesAgainst = res.data.votesAgainst
        currentProposal.value.votesAbstain = res.data.votesAbstain
        currentProposal.value.userVote = res.data.userVote as ProposalPublic['userVote']
      }
      return true
    }
    error.value = res.error
    return false
  }

  return {
    proposals,
    currentProposal,
    loading,
    error,
    creating,
    total,
    page,
    totalPages,
    loadProposals,
    loadProposal,
    submitProposal,
    vote,
  }
})
