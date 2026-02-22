
ALTER TABLE comments
ADD COLUMN audio_url VARCHAR(500),
ADD COLUMN audio_duration INTEGER;

CREATE INDEX IF NOT EXISTS idx_comments_audio ON comments(audio_url) WHERE audio_url IS NOT NULL;

ALTER TABLE comments
DROP CONSTRAINT IF EXISTS check_comment_has_content_or_audio;

ALTER TABLE comments
ADD CONSTRAINT check_comment_has_content_or_audio 
CHECK (
  (content IS NOT NULL AND content <> '') OR 
  (audio_url IS NOT NULL AND audio_url <> '')
);

ALTER TABLE comments
ALTER COLUMN content DROP NOT NULL;
