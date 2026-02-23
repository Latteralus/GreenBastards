# Financial Logic Fix Plan

## Objective
Fix the accounting logic for "Loan Proceeds" to ensure they are treated as positive cash inflows (Credits) rather than expenses (Debits). This involves updating existing data and adjusting the frontend application logic.

## Analysis
The current issue stems from "Loan Proceeds" being recorded as **Debits** (money leaving). This causes:
1.  **Treasury Balance** to decrease instead of increase.
2.  **Loan Liability** to be calculated incorrectly (currently `proceedsCredits - proceedsDebits`).
3.  **Retained Earnings** to be artificially low because the cash asset is understated.

## Plan

### 1. Database Migration (Fix Data)
Create a new migration file `supabase/migrations/20260223123000_fix_loan_proceeds_sign.sql` to:
- Update all existing transactions with category 'Loan Proceeds' from `type = 'Debit'` to `type = 'Credit'`.
- This will immediately fix the historical Treasury Balance.

### 2. Frontend Updates (`src/App.jsx`)

#### A. Update `calcLoanLiability`
The current formula is:
```javascript
return (proceedsCredits - proceedsDebits) - (repaymentDebits - repaymentCredits);
```
- If we flip proceeds to Credits, `proceedsCredits` will be positive.
- We should simplify this to standard accounting logic:
    - **Liability increases** with Loan Proceeds (Credit).
    - **Liability decreases** with Loan Repayments (Debit).
    - We should handle the inverse cases (corrections) gracefully.

**New Logic:**
```javascript
const liability = (proceedsCredits - proceedsDebits) - (repaymentDebits - repaymentCredits);
```
*Wait, if proceeds are Credits (positive), `proceedsCredits` is positive. If we subtract `proceedsDebits` (corrections), that's correct.*
*If repayments are Debits (money out), `repaymentDebits` is positive. If we subtract `repaymentCredits` (corrections), that's correct.*
*So: Liability = (Net Proceeds) - (Net Repayments).*
*The formula `(proceedsCredits - proceedsDebits) - (repaymentDebits - repaymentCredits)` actually works IF proceeds are recorded as Credits. The issue was they were recorded as Debits, making the first term negative.*

**Conclusion:** The formula is actually fine, but the *data* is wrong. However, I will verify the logic ensures it handles the data flip correctly.

#### B. Update Transaction Form (`Transactions` component)
- Automatically set `type` to `Credit` when "Loan Proceeds" is selected.
- Automatically set `type` to `Debit` when "Loan Repayment" is selected.
- This prevents future user error.

#### C. Verify Retained Earnings
- `Retained Earnings = (Total Assets) - (Total Liabilities) - (Capital Contributions)`
- **Assets:** Cash will increase by $20,000 (fixing the -$15,900 to +$4,100).
- **Liabilities:** Loan Liability will be $20,000.
- **Equity:** Should balance.

### 3. Execution Steps
1.  Review and confirm this plan with the user.
2.  Create the SQL migration file.
3.  Apply the SQL migration (simulation/instruction).
4.  Update `src/App.jsx`.
