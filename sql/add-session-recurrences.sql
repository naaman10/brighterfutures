-- Recurrence parent for a series of sessions (run in Neon SQL Editor).
-- Each session row stays the occurrence (status, feedback, calendar event).
-- The parent stores the rule so the series can be changed in one place.

CREATE TABLE IF NOT EXISTS session_recurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  subject TEXT NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('weekly', 'biweekly', 'every_3_weeks', 'monthly')),
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  month_weekday_occurrence SMALLINT CHECK (month_weekday_occurrence BETWEEN 1 AND 5),
  session_time TIME NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recurrence_id UUID REFERENCES session_recurrences(id);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recurrence_detached BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS sessions_recurrence_id_idx ON sessions (recurrence_id)
  WHERE recurrence_id IS NOT NULL;
