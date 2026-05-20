-- Track sessions with Google Meet added (for dashboard calendar icon).
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS google_meet_added BOOLEAN NOT NULL DEFAULT FALSE;
