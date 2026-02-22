
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '😀';

CREATE INDEX IF NOT EXISTS idx_users_emoji ON users(emoji);

ALTER TABLE hashtags
    ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS daily_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS weekly_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_hashtags_daily ON hashtags(daily_count DESC) WHERE daily_count > 0;
CREATE INDEX IF NOT EXISTS idx_hashtags_weekly ON hashtags(weekly_count DESC) WHERE weekly_count > 0;

CREATE OR REPLACE FUNCTION extract_hashtags(content TEXT)
RETURNS TEXT[] AS $$
DECLARE
    hashtags TEXT[];
BEGIN
    SELECT ARRAY(
        SELECT DISTINCT lower(match[1])
        FROM regexp_matches(content, '#([a-zA-Zа-яА-ЯёЁ0-9_]+)', 'g') AS match
    ) INTO hashtags;

    RETURN hashtags;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION process_post_hashtags()
RETURNS TRIGGER AS $$
DECLARE
    tag TEXT;
    tag_id UUID;
    extracted_tags TEXT[];
BEGIN
    extracted_tags := extract_hashtags(NEW.content);

    FOREACH tag IN ARRAY extracted_tags
    LOOP
        INSERT INTO hashtags (id, name, posts_count, daily_count, weekly_count, created_at, last_used_at)
        VALUES (gen_random_uuid(), tag, 1, 1, 1, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET
            posts_count = hashtags.posts_count + 1,
            daily_count = hashtags.daily_count + 1,
            weekly_count = hashtags.weekly_count + 1,
            last_used_at = NOW()
        RETURNING id INTO tag_id;

        INSERT INTO post_hashtags (post_id, hashtag_id)
        VALUES (NEW.id, tag_id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_post_hashtags()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE hashtags h
    SET posts_count = GREATEST(0, h.posts_count - 1)
    FROM post_hashtags ph
    WHERE ph.post_id = OLD.id AND ph.hashtag_id = h.id;

    DELETE FROM post_hashtags WHERE post_id = OLD.id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_post_hashtags_insert ON posts;
CREATE TRIGGER tr_post_hashtags_insert
    AFTER INSERT ON posts
    FOR EACH ROW
    WHEN (NEW.is_deleted = false)
    EXECUTE FUNCTION process_post_hashtags();

DROP TRIGGER IF EXISTS tr_post_hashtags_delete ON posts;
CREATE TRIGGER tr_post_hashtags_delete
    BEFORE DELETE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION remove_post_hashtags();

DROP TRIGGER IF EXISTS tr_post_hashtags_soft_delete ON posts;
CREATE TRIGGER tr_post_hashtags_soft_delete
    AFTER UPDATE OF is_deleted ON posts
    FOR EACH ROW
    WHEN (OLD.is_deleted = false AND NEW.is_deleted = true)
    EXECUTE FUNCTION remove_post_hashtags();

CREATE OR REPLACE FUNCTION reset_daily_hashtag_counts()
RETURNS void AS $$
BEGIN
    UPDATE hashtags SET daily_count = 0 WHERE daily_count > 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reset_weekly_hashtag_counts()
RETURNS void AS $$
BEGIN
    UPDATE hashtags SET weekly_count = 0 WHERE weekly_count > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN users.emoji IS 'User clan emoji. Popular clans: 🔥 (Fire), ❄️ (Ice), 🌙 (Moon), ☀️ (Sun), 🌊 (Wave), 🌸 (Sakura), 💀 (Skull), 👑 (Crown), 🎮 (Gamer), 🎵 (Music)';
