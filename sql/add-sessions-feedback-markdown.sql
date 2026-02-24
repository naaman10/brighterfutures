-- Add feedback (rich text / markdown) to sessions (run in Neon SQL Editor).
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS feedback_markdown TEXT;
