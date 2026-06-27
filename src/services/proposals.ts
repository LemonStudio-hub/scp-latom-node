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
  category?: string,
  token?: string
): Promise<ApiResult<ProposalsListResponse>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) params.set('status', status)
  if (category) params.set('category', category)
  return apiGet<ProposalsListResponse>(`/api/proposals?${params}`, token)
}

export function fetchProposal(
  id: number,
  token?: string
): Promise<ApiResult<ProposalResponse>> {
  return apiGet<ProposalResponse>(`/api/proposals/${id}`, token)
}

export function createProposal(
  data: { title: string; content: string; category: string },
  token: string
): Promise<ApiResult<{ proposal: ProposalPublic }>> {
  return apiPost<{ proposal: ProposalPublic }>('/api/proposals', data, token)
}

export function voteProposal(
  id: number,
  vote: 'for' | 'against' | 'abstain',
  token: string
): Promise<ApiResult<VoteResponse>> {
  return apiPost<VoteResponse>(`/api/proposals/${id}/vote`, { vote }, token)
}
