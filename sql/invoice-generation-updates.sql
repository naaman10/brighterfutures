-- Invoice generation and regeneration updates (run in Neon SQL Editor).
-- 1. Add discount_amount for fixed-amount discounts (e.g. amount already paid, first lesson free).
-- 2. Ensure total reflects discount_amount (drop and recreate generated column if present).
-- 3. Ensure status constraint allows: draft, issued, paid, cancelled, overdue.

-- Add discount_amount (default 0)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0;

-- Fix existing rows so discount_amount is not NULL
UPDATE invoices SET discount_amount = COALESCE(discount_amount, 0) WHERE discount_amount IS NULL;

-- Recreate total as generated column including discount_amount.
-- If total already exists (generated or not), drop it then add with new formula.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'total'
  ) THEN
    ALTER TABLE invoices DROP COLUMN total;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'total'
  ) THEN
    ALTER TABLE invoices ADD COLUMN total NUMERIC(12, 2) GENERATED ALWAYS AS (
      (subtotal - COALESCE(discount_amount, 0)) * (1 - COALESCE(discount_pct, 0) / 100) * (1 + COALESCE(tax_pct, 0) / 100)
    ) STORED;
  END IF;
END $$;

-- Ensure status constraint allows draft, issued, paid, cancelled, overdue
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'issued', 'paid', 'cancelled', 'overdue'));
