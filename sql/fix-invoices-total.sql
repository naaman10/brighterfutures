-- Fix invoice total showing £0 (run in Neon SQL Editor).
-- The total is a generated column: subtotal * (1 - discount_pct/100) * (1 + tax_pct/100).
-- If discount_pct or tax_pct are NULL, the expression yields NULL (displays as £0).

-- 1. Ensure discount_pct and tax_pct exist with defaults
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_pct NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_pct NUMERIC(5, 2) DEFAULT 0;

-- 2. Fix existing rows: set NULL to 0 so the generated total recomputes
UPDATE invoices
SET discount_pct = COALESCE(discount_pct, 0),
    tax_pct = COALESCE(tax_pct, 0)
WHERE discount_pct IS NULL OR tax_pct IS NULL;
