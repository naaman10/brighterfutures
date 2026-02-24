-- Add session summary (markdown) to sessions (run in Neon SQL Editor).
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS summary_markdown TEXT;
