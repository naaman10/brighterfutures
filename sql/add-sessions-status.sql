-- Add status to sessions: planned, in_progress, completed, rescheduled, planned_reschedule (run in Neon SQL Editor).
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'planned';

-- Optional: constrain to allowed values (uncomment if your Postgres supports it)
-- ALTER TABLE sessions ADD CONSTRAINT sessions_status_check
--   CHECK (status IN ('planned', 'in_progress', 'completed', 'rescheduled', 'planned_reschedule'));
