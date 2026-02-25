-- Timestamp for when the AI summary was last generated (run in Neon SQL Editor).
ALTER TABLE students ADD COLUMN IF NOT EXISTS ai_summary_updated TIMESTAMPTZ;
