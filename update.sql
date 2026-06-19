ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE ugc_meanings ADD COLUMN action_by_id INTEGER REFERENCES users(id);
ALTER TABLE ugc_meanings ADD COLUMN action_at TEXT;
ALTER TABLE comments ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE comments ADD COLUMN action_by_id INTEGER REFERENCES users(id);
ALTER TABLE comments ADD COLUMN action_at TEXT;
