ALTER TABLE posts ADD COLUMN IF NOT EXISTS wall_owner_id UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_posts_wall_owner_id ON posts(wall_owner_id) WHERE wall_owner_id IS NOT NULL AND is_deleted = false;
