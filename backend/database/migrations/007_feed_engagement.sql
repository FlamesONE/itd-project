
ALTER TABLE posts ADD COLUMN IF NOT EXISTS engagement_score FLOAT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_posts_engagement ON posts(engagement_score DESC, created_at DESC)
    WHERE is_deleted = FALSE;

-- ponytail: частичный индекс с NOW() Postgres не принимает (предикат обязан быть IMMUTABLE);
-- idx_posts_engagement выше покрывает тот же порядок сортировки.

CREATE TABLE IF NOT EXISTS feed_cache (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    score FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_cache_user ON feed_cache(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_feed_cache_post ON feed_cache(post_id);

CREATE OR REPLACE FUNCTION calculate_engagement_score(
    likes INTEGER,
    comments INTEGER,
    reposts INTEGER,
    age_hours FLOAT
) RETURNS FLOAT AS $$
BEGIN
    RETURN (likes + comments * 2 + reposts * 3) / POWER(age_hours + 2, 1.5);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION update_engagement_scores() RETURNS void AS $$
BEGIN
    UPDATE posts
    SET engagement_score = calculate_engagement_score(
        likes_count,
        comments_count,
        reposts_count,
        EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600
    )
    WHERE is_deleted = FALSE
      AND created_at > NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
