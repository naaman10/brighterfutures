-- Add AI summary to students (run in Neon SQL Editor).
ALTER TABLE students ADD COLUMN IF NOT EXISTS ai_summary TEXT;
