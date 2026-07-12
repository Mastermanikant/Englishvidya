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
  has_accepted_rules INTEGER NOT NULL DEFAULT 0,
  daily_sync_count INTEGER NOT NULL DEFAULT 0,
  monthly_sync_count INTEGER NOT NULL DEFAULT 0,
  last_sync_date TEXT DEFAULT '',
  last_sync_month TEXT DEFAULT '',
  location_address TEXT DEFAULT NULL,
  recovery_email TEXT DEFAULT NULL,
  security_questions TEXT DEFAULT NULL,
  reset_token TEXT UNIQUE DEFAULT NULL,
  reset_token_expires_at TEXT DEFAULT NULL,
  admin_reset_requested_at TEXT DEFAULT NULL,
  reset_attempts INTEGER DEFAULT 0,
  reset_request_timestamps TEXT DEFAULT NULL,
  referral_coins INTEGER NOT NULL DEFAULT 0,
  active_seconds INTEGER NOT NULL DEFAULT 0,
  referred_by_id INTEGER DEFAULT NULL,
  referred_bonus_paid INTEGER NOT NULL DEFAULT 0,
  referrer_bonus_paid INTEGER NOT NULL DEFAULT 0,
  signup_ip TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (referred_by_id) REFERENCES users(id)
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
  reference_links TEXT DEFAULT '[]',
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

-- 9. FORUM TOPICS
CREATE TABLE IF NOT EXISTS forum_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL DEFAULT 'general',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    action_by_id INTEGER,
    action_at TEXT,
    location_address TEXT DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (action_by_id) REFERENCES users(id)
);

-- 10. FORUM REPLIES
CREATE TABLE IF NOT EXISTS forum_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    reply_text TEXT NOT NULL,
    reference_links TEXT DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active',
    action_by_id INTEGER,
    action_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (topic_id) REFERENCES forum_topics(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (action_by_id) REFERENCES users(id)
);

-- 11. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('admin', 'owner')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'resolved', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 12. SUPPORT REPLIES
CREATE TABLE IF NOT EXISTS support_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  reply_text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_replies_ticket ON support_replies(ticket_id);

-- 13. TEST ATTEMPTS
CREATE TABLE IF NOT EXISTS test_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  lesson_slug TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_lesson ON test_attempts(lesson_slug);

-- 14. COIN TRANSACTIONS
CREATE TABLE IF NOT EXISTS coin_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);