-- Google Calendar integration (run in Neon SQL Editor).

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS rescheduled_from_session_id UUID;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS sync_source TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS google_calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL UNIQUE,
  calendar_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS google_calendar_watch_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL UNIQUE,
  resource_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  expiration TIMESTAMPTZ NOT NULL,
  sync_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_google_event_id_idx ON sessions (google_event_id)
  WHERE google_event_id IS NOT NULL;
