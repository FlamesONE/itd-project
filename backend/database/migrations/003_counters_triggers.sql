
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
        UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_follows_counts ON follows;
CREATE TRIGGER tr_follows_counts
    AFTER INSERT OR DELETE ON follows
    FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_likes_count ON likes;
CREATE TRIGGER tr_likes_count
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE OR REPLACE FUNCTION update_user_posts_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET posts_count = posts_count + 1 WHERE id = NEW.author_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = OLD.author_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
            UPDATE users SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = NEW.author_id;
        ELSIF NEW.is_deleted = FALSE AND OLD.is_deleted = TRUE THEN
            UPDATE users SET posts_count = posts_count + 1 WHERE id = NEW.author_id;
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_posts_count ON posts;
CREATE TRIGGER tr_posts_count
    AFTER INSERT OR DELETE OR UPDATE OF is_deleted ON posts
    FOR EACH ROW EXECUTE FUNCTION update_user_posts_count();

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
            UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = NEW.post_id;
        ELSIF NEW.is_deleted = FALSE AND OLD.is_deleted = TRUE THEN
            UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_comments_count ON comments;
CREATE TRIGGER tr_comments_count
    AFTER INSERT OR DELETE OR UPDATE OF is_deleted ON comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

CREATE OR REPLACE FUNCTION update_post_reposts_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET reposts_count = reposts_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET reposts_count = GREATEST(reposts_count - 1, 0) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_reposts_count ON reposts;
CREATE TRIGGER tr_reposts_count
    AFTER INSERT OR DELETE ON reposts
    FOR EACH ROW EXECUTE FUNCTION update_post_reposts_count();

CREATE OR REPLACE FUNCTION recalculate_engagement_score(p_post_id UUID)
RETURNS void AS $$
DECLARE
    v_age_hours FLOAT;
    v_engagement FLOAT;
    v_time_decay FLOAT;
BEGIN
    SELECT
        EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600,
        (likes_count + comments_count * 2 + reposts_count * 3)::FLOAT
    INTO v_age_hours, v_engagement
    FROM posts
    WHERE id = p_post_id;

    v_time_decay := POWER(v_age_hours + 2, 1.5);

    UPDATE posts
    SET engagement_score = v_engagement / v_time_decay
    WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_engagement_scores()
RETURNS void AS $$
BEGIN
    UPDATE posts
    SET engagement_score = (
        (likes_count + comments_count * 2 + reposts_count * 3)::FLOAT
    ) / POWER(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 + 2, 1.5)
    WHERE is_deleted = FALSE
      AND created_at > NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
