import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { getLoggerFromContext } from '../utils/logger'
import type { Env, Proposal, ProposalPublic, ProposalVote } from '../types'

const proposals = new Hono<{ Bindings: Env }>()

const MAX_PROPOSALS_PER_DAY = 2
const VALID_CATEGORIES = ['protocol', 'research', 'containment', 'general'] as const
const VALID_VOTES = ['for', 'against', 'abstain'] as const

// ─── Helpers ────────────────────────────────────────────────

function toPublic(
  proposal: Proposal & { author_codename: string },
  votes: { vfor: number; against: number; abstain: number },
  userVote: string | null
): ProposalPublic {
  return {
    id: proposal.id,
    title: proposal.title,
    content: proposal.content,
    category: proposal.category,
    status: proposal.status,
    authorCodename: proposal.author_codename,
    votesFor: votes.vfor,
    votesAgainst: votes.against,
    votesAbstain: votes.abstain,
    userVote: userVote as ProposalPublic['userVote'],
    createdAt: proposal.created_at,
    updatedAt: proposal.updated_at,
  }
}

// ─── GET /api/proposals ────────────────────────────────────
// List proposals (public, with optional auth for userVote)

proposals.get('/', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1', 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') ?? '20', 10) || 20))
  const offset = (page - 1) * limit
  const statusFilter = c.req.query('status') || 'open'
  const categoryFilter = c.req.query('category')

  // Get current user ID from token (optional)
  let currentUserId: number | null = null
  const header = c.req.header('Authorization')
  if (header?.startsWith('Bearer ')) {
    try {
      const { verifyToken } = await import('../utils/jwt')
      const payload = await verifyToken(header.slice(7), c.env.JWT_SECRET)
      if (payload) currentUserId = payload.sub
    } catch {
      // ignore — unauthenticated
    }
  }

  // Build query
  let where = 'WHERE p.status = ?'
  const params: unknown[] = [statusFilter]

  if (categoryFilter && VALID_CATEGORIES.includes(categoryFilter as typeof VALID_CATEGORIES[number])) {
    where += ' AND p.category = ?'
    params.push(categoryFilter)
  }

  // Count total
  const countRow = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM proposals p ${where}`
  ).bind(...params).first<{ total: number }>()
  const total = countRow?.total ?? 0

  // Fetch proposals with author codename
  const rows = await c.env.DB.prepare(
    `SELECT p.*, u.codename as author_codename
     FROM proposals p
     JOIN users u ON p.user_id = u.id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all<Proposal & { author_codename: string }>()

  // Fetch vote counts and user votes for this page
  const proposalIds = rows.results.map((r) => r.id)
  const resultProposals: ProposalPublic[] = []

  for (const proposal of rows.results) {
    // Vote counts
    const voteCounts = await c.env.DB.prepare(
      `SELECT
        SUM(CASE WHEN vote = 'for' THEN 1 ELSE 0 END) as vfor,
        SUM(CASE WHEN vote = 'against' THEN 1 ELSE 0 END) as against,
        SUM(CASE WHEN vote = 'abstain' THEN 1 ELSE 0 END) as abstain
       FROM proposal_votes WHERE proposal_id = ?`
    ).bind(proposal.id).first<{ vfor: number; against: number; abstain: number }>()

    // User's vote (if authenticated)
    let userVote: string | null = null
    if (currentUserId) {
      const voteRow = await c.env.DB.prepare(
        'SELECT vote FROM proposal_votes WHERE proposal_id = ? AND user_id = ?'
      ).bind(proposal.id, currentUserId).first<{ vote: string }>()
      userVote = voteRow?.vote ?? null
    }

    resultProposals.push(toPublic(
      proposal,
      { vfor: voteCounts?.vfor ?? 0, against: voteCounts?.against ?? 0, abstain: voteCounts?.abstain ?? 0 },
      userVote
    ))
  }

  return c.json({
    success: true,
    proposals: resultProposals,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
})

// ─── GET /api/proposals/:id ────────────────────────────────
// Get single proposal with vote breakdown

proposals.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id') ?? '', 10)
  if (isNaN(id)) return c.json({ success: false, error: 'Invalid proposal ID' }, 400)

  // Get current user ID (optional)
  let currentUserId: number | null = null
  const header = c.req.header('Authorization')
  if (header?.startsWith('Bearer ')) {
    try {
      const { verifyToken } = await import('../utils/jwt')
      const payload = await verifyToken(header.slice(7), c.env.JWT_SECRET)
      if (payload) currentUserId = payload.sub
    } catch {
      // ignore
    }
  }

  const proposal = await c.env.DB.prepare(
    `SELECT p.*, u.codename as author_codename
     FROM proposals p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = ?`
  ).bind(id).first<Proposal & { author_codename: string }>()

  if (!proposal) return c.json({ success: false, error: 'Proposal not found' }, 404)

  const voteCounts = await c.env.DB.prepare(
    `SELECT
      SUM(CASE WHEN vote = 'for' THEN 1 ELSE 0 END) as vfor,
      SUM(CASE WHEN vote = 'against' THEN 1 ELSE 0 END) as against,
      SUM(CASE WHEN vote = 'abstain' THEN 1 ELSE 0 END) as abstain
     FROM proposal_votes WHERE proposal_id = ?`
  ).bind(id).first<{ vfor: number; against: number; abstain: number }>()

  let userVote: string | null = null
  if (currentUserId) {
    const voteRow = await c.env.DB.prepare(
      'SELECT vote FROM proposal_votes WHERE proposal_id = ? AND user_id = ?'
    ).bind(id, currentUserId).first<{ vote: string }>()
    userVote = voteRow?.vote ?? null
  }

  return c.json({
    success: true,
    proposal: toPublic(
      proposal,
      { vfor: voteCounts?.vfor ?? 0, against: voteCounts?.against ?? 0, abstain: voteCounts?.abstain ?? 0 },
      userVote
    ),
  })
})

// ─── POST /api/proposals ───────────────────────────────────
// Create proposal (auth required, max 2 per day)

proposals.post('/', authMiddleware, async (c) => {
  const logger = getLoggerFromContext(c).child({ category: 'system' })
  const payload = c.get('user')
  const body = await c.req.json<{ title?: string; content?: string; category?: string }>()

  const title = body.title?.trim()
  const content = body.content?.trim()
  const category = body.category?.trim() || 'general'

  if (!title || title.length < 5 || title.length > 200) {
    return c.json({ success: false, error: 'Title must be 5-200 characters' }, 400)
  }
  if (!content || content.length < 20 || content.length > 10000) {
    return c.json({ success: false, error: 'Content must be 20-10000 characters' }, 400)
  }
  if (!VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    return c.json({ success: false, error: `Invalid category. Use: ${VALID_CATEGORIES.join(', ')}` }, 400)
  }

  // Check daily limit
  const todayCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM proposals WHERE user_id = ? AND created_at >= date('now')"
  ).bind(payload.sub).first<{ count: number }>()

  if ((todayCount?.count ?? 0) >= MAX_PROPOSALS_PER_DAY) {
    logger.warn('Proposal creation blocked: daily limit reached', { userId: payload.sub })
    return c.json({ success: false, error: `Daily limit reached (${MAX_PROPOSALS_PER_DAY} proposals per day)` }, 429)
  }

  const result = await c.env.DB.prepare(
    'INSERT INTO proposals (user_id, title, content, category) VALUES (?, ?, ?, ?) RETURNING *'
  ).bind(payload.sub, title, content, category).first<Proposal>()

  if (!result) {
    logger.error('Proposal creation failed: DB insert returned no result', { userId: payload.sub })
    return c.json({ success: false, error: 'Failed to create proposal' }, 500)
  }

  logger.info('Proposal created', { proposalId: result.id, userId: payload.sub, category })
  return c.json({
    success: true,
    proposal: {
      id: result.id,
      title: result.title,
      content: result.content,
      category: result.category,
      status: result.status,
      authorCodename: payload.codename,
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
      userVote: null,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    },
  }, 201)
})

// ─── POST /api/proposals/:id/vote ──────────────────────────
// Vote on proposal (auth required, one vote per proposal, immutable)

proposals.post('/:id/vote', authMiddleware, async (c) => {
  const logger = getLoggerFromContext(c).child({ category: 'system' })
  const payload = c.get('user')
  const id = parseInt(c.req.param('id') ?? '', 10)
  if (isNaN(id)) return c.json({ success: false, error: 'Invalid proposal ID' }, 400)

  const body = await c.req.json<{ vote?: string }>()
  const vote = body.vote?.trim()

  if (!vote || !VALID_VOTES.includes(vote as typeof VALID_VOTES[number])) {
    return c.json({ success: false, error: `Invalid vote. Use: ${VALID_VOTES.join(', ')}` }, 400)
  }

  // Check proposal exists and is open
  const proposal = await c.env.DB.prepare(
    'SELECT id, status FROM proposals WHERE id = ?'
  ).bind(id).first<Proposal>()

  if (!proposal) return c.json({ success: false, error: 'Proposal not found' }, 404)
  if (proposal.status !== 'open') return c.json({ success: false, error: 'Voting is closed for this proposal' }, 400)

  // Check if user already voted
  const existingVote = await c.env.DB.prepare(
    'SELECT id, vote FROM proposal_votes WHERE proposal_id = ? AND user_id = ?'
  ).bind(id, payload.sub).first<ProposalVote>()

  if (existingVote) {
    logger.warn('Duplicate vote attempt', { proposalId: id, userId: payload.sub })
    return c.json({ success: false, error: 'You have already voted on this proposal. Votes cannot be changed.' }, 409)
  }

  // Insert vote
  await c.env.DB.prepare(
    'INSERT INTO proposal_votes (proposal_id, user_id, vote) VALUES (?, ?, ?)'
  ).bind(id, payload.sub, vote).run()

  logger.info('Vote recorded', { proposalId: id, userId: payload.sub, vote })

  // Get updated vote counts
  const voteCounts = await c.env.DB.prepare(
    `SELECT
      SUM(CASE WHEN vote = 'for' THEN 1 ELSE 0 END) as vfor,
      SUM(CASE WHEN vote = 'against' THEN 1 ELSE 0 END) as against,
      SUM(CASE WHEN vote = 'abstain' THEN 1 ELSE 0 END) as abstain
     FROM proposal_votes WHERE proposal_id = ?`
  ).bind(id).first<{ vfor: number; against: number; abstain: number }>()

  return c.json({
    success: true,
    message: 'Vote recorded',
    votesFor: voteCounts?.vfor ?? 0,
    votesAgainst: voteCounts?.against ?? 0,
    votesAbstain: voteCounts?.abstain ?? 0,
    userVote: vote,
  })
})

export default proposals
