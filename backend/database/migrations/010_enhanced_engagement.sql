
CREATE INDEX IF NOT EXISTS idx_follows_for_similarity
    ON follows(following_id, follower_id);

CREATE INDEX IF NOT EXISTS idx_likes_for_similarity
    ON likes(post_id, user_id);

CREATE INDEX IF NOT EXISTS idx_post_hashtags_for_recommendations
    ON post_hashtags(hashtag_id, post_id);

CREATE INDEX IF NOT EXISTS idx_posts_for_content_recommendations
    ON posts(author_id, created_at DESC, engagement_score DESC)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_likes_user_post_recent
    ON likes(user_id, post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hashtags_name_lower
    ON hashtags(LOWER(name));

CREATE OR REPLACE FUNCTION calculate_enhanced_engagement_score(
    likes INTEGER,
    comments INTEGER,
    reposts INTEGER,
    views INTEGER,
    age_hours FLOAT
) RETURNS FLOAT AS $$
DECLARE
    base_score FLOAT;
    freshness FLOAT;
    viral_boost FLOAT;
    quality_score FLOAT;
BEGIN
    base_score := likes + comments * 2 + reposts * 3 + COALESCE(views, 0) * 0.1;

    freshness := 1.0 / POWER(age_hours + 2, 1.2);

    viral_boost := LOG(GREATEST(reposts, 1) + 1) * 0.5;

    quality_score := 1 + LEAST(comments::float / GREATEST(likes, 1), 2) * 0.2;

    RETURN base_score * freshness * (1 + viral_boost) * quality_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION update_enhanced_engagement_scores() RETURNS void AS $$
BEGIN
    UPDATE posts
    SET engagement_score = calculate_enhanced_engagement_score(
        likes_count,
        comments_count,
        reposts_count,
        views_count,
        EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600
    )
    WHERE is_deleted = FALSE
      AND created_at > NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_similar_users_by_follows(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
    user_id UUID,
    common_follows BIGINT,
    total_follows BIGINT,
    similarity_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_follows AS (
        SELECT following_id FROM follows WHERE follower_id = p_user_id
    ),
    similar_users AS (
        SELECT
            f.follower_id AS uid,
            COUNT(*) AS cf,
            (SELECT COUNT(*) FROM follows WHERE follower_id = f.follower_id) AS tf
        FROM follows f
        WHERE f.following_id IN (SELECT following_id FROM user_follows)
          AND f.follower_id != p_user_id
          AND f.follower_id NOT IN (SELECT following_id FROM user_follows)
        GROUP BY f.follower_id
        HAVING COUNT(*) >= 2
    )
    SELECT
        su.uid,
        su.cf,
        su.tf,
        su.cf::float / GREATEST(
            su.tf + (SELECT COUNT(*) FROM user_follows) - su.cf,
            1
        ) AS ss
    FROM similar_users su
    ORDER BY ss DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_popular_posts_among_users(
    p_user_ids UUID[],
    p_exclude_user_id UUID,
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
    post_id UUID,
    author_id UUID,
    content TEXT,
    likes_count INTEGER,
    comments_count INTEGER,
    reposts_count INTEGER,
    views_count INTEGER,
    engagement_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE,
    liked_by_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.author_id,
        p.content,
        p.likes_count,
        p.comments_count,
        p.reposts_count,
        p.views_count,
        p.engagement_score,
        p.created_at,
        COUNT(l.user_id) AS lbc
    FROM posts p
    INNER JOIN likes l ON p.id = l.post_id
    WHERE l.user_id = ANY(p_user_ids)
      AND p.author_id != p_exclude_user_id
      AND p.is_deleted = false
      AND p.created_at > NOW() - INTERVAL '7 days'
    GROUP BY p.id
    ORDER BY lbc DESC, p.engagement_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_update_post_engagement() RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts
    SET engagement_score = calculate_enhanced_engagement_score(
        likes_count,
        comments_count,
        reposts_count,
        views_count,
        EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600
    )
    WHERE id = COALESCE(NEW.post_id, OLD.post_id)
      AND is_deleted = FALSE;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_engagement_on_like ON likes;
CREATE TRIGGER update_engagement_on_like
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_post_engagement();

DROP TRIGGER IF EXISTS update_engagement_on_comment ON comments;
CREATE TRIGGER update_engagement_on_comment
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_post_engagement();

DROP TRIGGER IF EXISTS update_engagement_on_repost ON reposts;
CREATE TRIGGER update_engagement_on_repost
    AFTER INSERT OR DELETE ON reposts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_post_engagement();
