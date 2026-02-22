
UPDATE posts SET views_count = 0 WHERE views_count IS NULL;
UPDATE posts SET likes_count = 0 WHERE likes_count IS NULL;
UPDATE posts SET comments_count = 0 WHERE comments_count IS NULL;
UPDATE posts SET reposts_count = 0 WHERE reposts_count IS NULL;
UPDATE posts SET engagement_score = 0 WHERE engagement_score IS NULL;

UPDATE users SET followers_count = 0 WHERE followers_count IS NULL;
UPDATE users SET following_count = 0 WHERE following_count IS NULL;
UPDATE users SET posts_count = 0 WHERE posts_count IS NULL;

UPDATE comments SET likes_count = 0 WHERE likes_count IS NULL;

ALTER TABLE posts
    ALTER COLUMN views_count SET NOT NULL,
    ALTER COLUMN likes_count SET NOT NULL,
    ALTER COLUMN comments_count SET NOT NULL,
    ALTER COLUMN reposts_count SET NOT NULL,
    ALTER COLUMN engagement_score SET NOT NULL;

ALTER TABLE users
    ALTER COLUMN followers_count SET NOT NULL,
    ALTER COLUMN following_count SET NOT NULL,
    ALTER COLUMN posts_count SET NOT NULL;

ALTER TABLE comments
    ALTER COLUMN likes_count SET NOT NULL;
