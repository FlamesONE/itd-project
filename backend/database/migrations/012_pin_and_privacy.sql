ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_pinned_per_user 
  ON posts(COALESCE(wall_owner_id, author_id)) 
  WHERE is_pinned = true AND is_deleted = false;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wall_privacy_type') THEN
    CREATE TYPE wall_privacy_type AS ENUM ('public', 'followers', 'private');
  END IF;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS wall_privacy wall_privacy_type DEFAULT 'public';

CREATE INDEX IF NOT EXISTS idx_users_wall_privacy ON users(wall_privacy);
