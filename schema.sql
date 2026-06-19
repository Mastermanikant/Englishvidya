-- ══════════════════════════════════════════
-- EnglishVidya D1 Database Schema
-- ══════════════════════════════════════════

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  username TEXT UNIQUE DEFAULT NULL,
  password_hash TEXT DEFAULT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  avatar_url TEXT DEFAULT '',
  trust_score INTEGER NOT NULL DEFAULT 10,
  is_shadow_banned INTEGER NOT NULL DEFAULT 0,
  social_instagram TEXT DEFAULT '',
  social_facebook TEXT DEFAULT '',
  social_youtube TEXT DEFAULT '',
  social_twitter TEXT DEFAULT '',
  social_linkedin TEXT DEFAULT '',
  social_pinterest TEXT DEFAULT '',
  social_website1 TEXT DEFAULT '',
  social_website2 TEXT DEFAULT '',
  delete_requested_at TEXT DEFAULT NULL,
  daily_sync_count INTEGER NOT NULL DEFAULT 0,
  monthly_sync_count INTEGER NOT NULL DEFAULT 0,
  last_sync_date TEXT DEFAULT '',
  last_sync_month TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. RATINGS TABLE (5-Star System)
CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_slug TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  stars INTEGER NOT NULL CHECK(stars >= 1 AND stars <= 5),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(page_slug, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 3. RATINGS CACHE (Aggregated - for fast reads)
CREATE TABLE IF NOT EXISTS ratings_cache (
  page_slug TEXT PRIMARY KEY,
  total_stars INTEGER NOT NULL DEFAULT 0,
  total_votes INTEGER NOT NULL DEFAULT 0,
  avg_rating REAL NOT NULL DEFAULT 0.0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. UGC MEANINGS (User-submitted rural/local meanings)
CREATE TABLE IF NOT EXISTS ugc_meanings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_slug TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  meaning_text TEXT NOT NULL,
  meaning_type TEXT NOT NULL DEFAULT 'rural',
  region TEXT DEFAULT '',
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_verified',
  action_by_id INTEGER,
  action_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (action_by_id) REFERENCES users(id)
);

-- 5. VOTES (Upvote/Downvote on UGC meanings)
CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  meaning_id INTEGER NOT NULL,
  vote_type TEXT NOT NULL CHECK(vote_type IN ('up', 'down')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, meaning_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (meaning_id) REFERENCES ugc_meanings(id)
);

-- 6. COMMENTS
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_slug TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  comment_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  action_by_id INTEGER,
  action_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (action_by_id) REFERENCES users(id)
);

-- 7. USER NOTES (Personal Diary)
CREATE TABLE IF NOT EXISTS user_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  word_slug TEXT NOT NULL,
  note_content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, word_slug),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 8. USER BOOKMARKS (Cloud Synced Favorites)
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  word_slug TEXT NOT NULL,
  word_text TEXT NOT NULL DEFAULT '',
  meaning_text TEXT NOT NULL DEFAULT '',
  pron_text TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, word_slug),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ══════════════════════════════════════════
-- INDEXES (Fast queries)
-- ══════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_ratings_slug ON ratings(page_slug);
CREATE INDEX IF NOT EXISTS idx_ugc_slug ON ugc_meanings(word_slug);
CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(page_slug);
CREATE INDEX IF NOT EXISTS idx_notes_user ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON user_bookmarks(user_id);
