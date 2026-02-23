-- Fix Loan Proceeds Sign (Debit -> Credit)
-- "Loan Proceeds" should be treated as money IN (Credit), not money OUT (Debit).
-- This migration updates all existing transactions to reflect this.

UPDATE transactions
SET type = 'Credit'
WHERE category = 'Loan Proceeds' AND type = 'Debit';
