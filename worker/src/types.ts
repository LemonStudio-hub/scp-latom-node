export interface Env {
  DB: D1Database
  JWT_SECRET: string
  CORS_ORIGINS: string
  LOG_LEVEL?: string
  SCP_EN_CRAWLER: DurableObjectNamespace
  SCP_CN_CRAWLER: DurableObjectNamespace
}

export interface User {
  id: number
  codename: string
  password: string
  role: string
  clearance: number
  created_at: string
  updated_at: string
}

export interface UserPublic {
  id: number
  codename: string
  role: string
  clearance: number
  created_at?: string
}

export interface JwtPayload {
  sub: number
  codename: string
  role: string
  clearance: number
  exp: number
}

// ─── Crawler Types ───────────────────────────────────────────

export interface CrawlEntry {
  scpNumber: number
  name: string
  objectClass: string
  url: string
  series: number
}

export interface SyncResult {
  added: number
  changed: number
  unchanged: number
}

export interface CrawlState {
  status: 'idle' | 'crawling' | 'error'
  lastCrawl: number
  totalEntries: number
  error?: string
  lastSyncResult?: SyncResult
}

export interface CrawlResult {
  language: 'en' | 'cn'
  state: CrawlState
  entries: CrawlEntry[]
  series: Record<number, CrawlEntry[]>
}

export interface EntryContentResponse {
  success: boolean
  scpNumber: number
  language: string
  status: 'cached' | 'fetched' | 'pending' | 'fetching' | 'error'
  content?: string
  name?: string
  objectClass?: string
  fetchedAt?: string
  message?: string
  error?: string
}

// ─── History Types ─────────────────────────────────────────

export interface HistoryEntry {
  id: number
  user_id: number
  language: string
  scp_number: number
  name: string
  object_class: string
  visited_at: string
}

// ─── Bookmark Types ───────────────────────────────────────

export interface Bookmark {
  id: number
  user_id: number
  scp_number: number
  language: string
  created_at: string
}

export interface BookmarkPublic {
  scpNumber: number
  language: string
  name: string | null
  objectClass: string | null
  createdAt: string
}

// ─── Proposal Types ────────────────────────────────────────

export interface Proposal {
  id: number
  user_id: number
  title: string
  content: string
  category: string
  status: 'open' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface ProposalVote {
  id: number
  proposal_id: number
  user_id: number
  vote: 'for' | 'against' | 'abstain'
  created_at: string
}

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
