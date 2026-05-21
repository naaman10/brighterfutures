-- Active / inactive status for parents and students (defaults to active).
ALTER TABLE parents ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE students ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE parents DROP CONSTRAINT IF EXISTS parents_status_check;
ALTER TABLE parents ADD CONSTRAINT parents_status_check
  CHECK (status IN ('active', 'inactive'));

ALTER TABLE students DROP CONSTRAINT IF EXISTS students_status_check;
ALTER TABLE students ADD CONSTRAINT students_status_check
  CHECK (status IN ('active', 'inactive'));
