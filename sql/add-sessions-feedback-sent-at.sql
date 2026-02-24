-- Add feedback_sent_at timestamp to sessions (run in Neon SQL Editor).
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS feedback_sent_at TIMESTAMPTZ;
