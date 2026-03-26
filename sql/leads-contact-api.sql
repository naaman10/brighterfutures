-- Optional columns for POST /api/contact (createLeadFromContact).
-- Run in Neon if inserts fail with "column ... does not exist".

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT;

-- If status has no default, new leads from the API use explicit 'New' in the INSERT.
