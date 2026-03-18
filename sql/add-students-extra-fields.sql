-- Add extra fields to students table for view/edit pages.
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS current_school TEXT,
  ADD COLUMN IF NOT EXISTS current_year_group TEXT,
  ADD COLUMN IF NOT EXISTS sen_needs TEXT,
  ADD COLUMN IF NOT EXISTS exam_board TEXT,
  ADD COLUMN IF NOT EXISTS medical_conditions TEXT,
  ADD COLUMN IF NOT EXISTS medication TEXT,
  ADD COLUMN IF NOT EXISTS collector_name TEXT,
  ADD COLUMN IF NOT EXISTS leave_independantly BOOLEAN DEFAULT FALSE;
