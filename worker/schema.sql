CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  codename   TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'personnel',
  clearance  INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_codename ON users(codename);

-- ─── SCP Index Entries ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS scp_entries (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  scp_number   INTEGER NOT NULL,
  language     TEXT NOT NULL CHECK (language IN ('en', 'cn')),
  name         TEXT NOT NULL DEFAULT '',
  object_class TEXT NOT NULL DEFAULT 'Unknown',
  url          TEXT NOT NULL DEFAULT '',
  series            INTEGER NOT NULL DEFAULT 1,
  content           TEXT,
  content_fetched_at TEXT,
  content_error     TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(scp_number, language)
);

CREATE INDEX IF NOT EXISTS idx_scp_entries_lang ON scp_entries(language);
CREATE INDEX IF NOT EXISTS idx_scp_entries_number ON scp_entries(scp_number);
CREATE INDEX IF NOT EXISTS idx_scp_entries_class ON scp_entries(object_class);
CREATE INDEX IF NOT EXISTS idx_scp_entries_series ON scp_entries(series);

-- ─── Crawl State ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crawl_state (
  language     TEXT PRIMARY KEY CHECK (language IN ('en', 'cn')),
  status       TEXT NOT NULL DEFAULT 'idle',
  last_crawl   INTEGER NOT NULL DEFAULT 0,
  total_entries INTEGER NOT NULL DEFAULT 0,
  next_series  INTEGER NOT NULL DEFAULT 0,
  error        TEXT,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Browsing History ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS browsing_history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL,
  language     TEXT NOT NULL CHECK (language IN ('en', 'cn')),
  scp_number   INTEGER NOT NULL,
  name         TEXT NOT NULL DEFAULT '',
  object_class TEXT NOT NULL DEFAULT 'Unknown',
  visited_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, language, scp_number)
);

CREATE INDEX IF NOT EXISTS idx_history_user ON browsing_history(user_id, visited_at);

-- ─── Bookmarks ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bookmarks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  scp_number  INTEGER NOT NULL,
  language    TEXT NOT NULL CHECK (language IN ('en', 'cn')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, scp_number, language)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);

-- ─── Proposals ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS proposals (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'general',
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_proposals_user ON proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created ON proposals(created_at);

-- ─── Proposal Votes ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS proposal_votes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id INTEGER NOT NULL,
  user_id     INTEGER NOT NULL,
  vote        TEXT NOT NULL CHECK (vote IN ('for', 'against', 'abstain')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(proposal_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_proposal_votes_proposal ON proposal_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_user ON proposal_votes(user_id);
