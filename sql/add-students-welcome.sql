-- Add welcome email sent flag and timestamp to students (run in Neon SQL Editor).
ALTER TABLE students ADD COLUMN IF NOT EXISTS welcome BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS welcome_sent_at TIMESTAMPTZ;
