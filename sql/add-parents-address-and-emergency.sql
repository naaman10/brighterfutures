-- Add relationship, secondary contact, address and emergency contact columns to parents (run in Neon SQL Editor).
ALTER TABLE parents ADD COLUMN IF NOT EXISTS relationship TEXT;
ALTER TABLE parents ADD COLUMN IF NOT EXISTS secondary_contact_number TEXT;
ALTER TABLE parents ADD COLUMN IF NOT EXISTS address_line_1 TEXT;
ALTER TABLE parents ADD COLUMN IF NOT EXISTS address_line_2 TEXT;
ALTER TABLE parents ADD COLUMN IF NOT EXISTS town TEXT;
ALTER TABLE parents ADD COLUMN IF NOT EXISTS post_code TEXT;
ALTER TABLE parents ADD COLUMN IF NOT EXISTS emergency_first_name TEXT;
ALTER TABLE parents ADD COLUMN IF NOT EXISTS emergency_last_name TEXT;
ALTER TABLE parents ADD COLUMN IF NOT EXISTS emergency_relation TEXT;
ALTER TABLE parents ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
