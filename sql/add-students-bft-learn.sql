-- BFT Learn account fields on students (linked Neon Auth user).
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS neon_user_id UUID,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
