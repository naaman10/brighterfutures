-- Add 'deleted' status to invoices status constraint (run in Neon SQL Editor).
-- This allows soft-delete: invoices marked as deleted stay in the database for record-keeping
-- but are filtered out from frontend queries.

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'issued', 'paid', 'cancelled', 'overdue', 'deleted'));
