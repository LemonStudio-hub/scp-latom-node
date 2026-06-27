import { apiGet, apiPost } from './api'
import type { ApiResult } from './response'

export interface ProposalPublic {
  id: number
  title: string
  content: string
  category: string
  status: string
  authorCodename: string
  votesFor: number
  votesAgainst: number
  votesAbstain: number
  userVote: 'for' | 'against' | 'abstain' | null
  createdAt: string
  updatedAt: string
}

export interface ProposalsListResponse {
  proposals: ProposalPublic[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProposalResponse {
  proposal: ProposalPublic
}

export interface VoteResponse {
  votesFor: number
  votesAgainst: number
  votesAbstain: number
  userVote: string
}

export function fetchProposals(
  page = 1,
  limit = 20,
  status?: string,
  category?: string
): Promise<ApiResult<ProposalsListResponse>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) params.set('status', status)
  if (category) params.set('category', category)
  return apiGet<ProposalsListResponse>(`/proposals?${params}`)
}

export function fetchProposal(
  id: number
): Promise<ApiResult<ProposalResponse>> {
  return apiGet<ProposalResponse>(`/proposals/${id}`)
}

export function createProposal(
  data: { title: string; content: string; category: string }
): Promise<ApiResult<{ proposal: ProposalPublic }>> {
  return apiPost<{ proposal: ProposalPublic }>('/proposals', data)
}

export function voteProposal(
  id: number,
  vote: 'for' | 'against' | 'abstain'
): Promise<ApiResult<VoteResponse>> {
  return apiPost<VoteResponse>(`/proposals/${id}/vote`, { vote })
}
