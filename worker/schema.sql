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
