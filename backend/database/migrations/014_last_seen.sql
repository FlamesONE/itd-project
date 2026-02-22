ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_users_last_seen_at ON users(last_seen_at);

UPDATE users SET last_seen_at = NOW() WHERE last_seen_at IS NULL;
