-- Remove unused session summary text (run in Neon SQL Editor).
ALTER TABLE sessions DROP COLUMN IF EXISTS summary_markdown;
