-- Soft-delete for recurrence series (run in Neon SQL Editor).
-- Deleted recurrences stay in the database but are excluded from the dashboard UI.

ALTER TABLE session_recurrences
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE session_recurrences DROP CONSTRAINT IF EXISTS session_recurrences_status_check;
ALTER TABLE session_recurrences ADD CONSTRAINT session_recurrences_status_check
  CHECK (status IN ('active', 'deleted'));
