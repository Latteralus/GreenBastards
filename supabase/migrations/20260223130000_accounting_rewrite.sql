-- ============================================================================
-- Accounting Logic Rewrite Migration
-- Date: 2026-02-23
-- Purpose: Enforce GAAP-aligned category classifications
--   1. Investment → Equity (was Revenue)
--   2. Equipment → Asset (was Expense)
--   3. Delete obsolete ingredient categories (Hops, Malt, Barley, Yeast)
--   4. Add COGS category for accrual-based cost recognition
-- ============================================================================

-- 1. Reclassify Investment from Revenue to Equity
UPDATE categories SET type = 'Equity' WHERE name = 'Investment';

-- 2. Reclassify Equipment from Expense to Asset (no depreciation)
UPDATE categories SET type = 'Asset' WHERE name = 'Equipment';

-- 3. Delete obsolete ingredient categories
--    These do not exist in the brewery's operations and should be removed.
--    Any historical transactions referencing them will retain their category text
--    but the category will no longer appear in the dropdown.
DELETE FROM categories WHERE name IN ('Hops', 'Malt', 'Barley', 'Yeast');

-- 4. Add COGS category for accrual-based cost recognition
--    COGS is only recorded when a sale occurs, not when raw materials are purchased.
INSERT INTO categories (name, type) VALUES ('COGS', 'Expense')
ON CONFLICT (name) DO NOTHING;
