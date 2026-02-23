# Financial Logic Fix Plan

## Goal
Fix the accounting logic for "Loan Proceeds" and "Loan Repayments" to ensure they are treated correctly in liability calculations and improve the UX to prevent user error during transaction entry.

## Analysis
The current implementation in `src/App.jsx` has the following issues:

1.  **`calcLoanLiability` Logic Flaw**:
    *   The function sums all transactions with category "Loan Proceeds" regardless of whether they are Credits (inflow) or Debits (outflow/correction).
    *   It does the same for "Loan Repayments".
    *   **Consequence**: If a user enters a correction (Debit to Loan Proceeds), it incorrectly increases the liability instead of decreasing it.

2.  **Transaction Form UX**:
    *   The form defaults to "Debit".
    *   When selecting "Loan Proceeds" (which is money entering the business, i.e., Credit), the user has to manually switch the type. If they forget, it records a Debit, which reduces cash (wrong) and increases liability (double wrong due to point #1).

3.  **`calcSummary` (Revenue/Expenses)**:
    *   "Loan Proceeds" are correctly excluded from Operating Revenue.
    *   "Loan Repayments" are correctly excluded from Operating Expenses.
    *   Treasury Balance is calculated as `Total Credits - Total Debits`, which is correct for actual cash on hand.

## Proposed Changes

### 1. Update `calcLoanLiability` in `src/App.jsx`

Change the calculation to respect transaction types:

```javascript
function calcLoanLiability(transactions) {
  const approved = transactions.filter(t => t.status === "Approved");
  
  const proceedsCredits = approved
    .filter(t => t.category === "Loan Proceeds" && t.type === "Credit")
    .reduce((s, t) => s + t.amount, 0);
    
  const proceedsDebits = approved
    .filter(t => t.category === "Loan Proceeds" && t.type === "Debit")
    .reduce((s, t) => s + t.amount, 0);

  const repaymentDebits = approved
    .filter(t => t.category === "Loan Repayment" && t.type === "Debit")
    .reduce((s, t) => s + t.amount, 0);
    
  const repaymentCredits = approved
    .filter(t => t.category === "Loan Repayment" && t.type === "Credit")
    .reduce((s, t) => s + t.amount, 0);

  // Liability = (Net Proceeds) - (Net Repayments)
  // Net Proceeds = Credits (Inflow) - Debits (Corrections)
  // Net Repayments = Debits (Outflow) - Credits (Corrections)
  return (proceedsCredits - proceedsDebits) - (repaymentDebits - repaymentCredits);
}
```

### 2. Enhance Transaction Form UX in `src/App.jsx`

Add an effect to automatically switch the transaction type based on the selected category.

```javascript
// Inside Transactions component
useEffect(() => {
  if (form.category === "Loan Proceeds" || form.category === "Capital Contribution") {
    setForm(f => ({ ...f, type: "Credit" }));
  } else if (form.category === "Loan Repayment" || form.category === "Savings") {
    // Savings is tricky: Debit = Deposit to Savings (Cash Out of Treasury), Credit = Withdrawal from Savings (Cash In to Treasury)
    // Usually "Savings" category means a transfer. 
    // If I am recording a "Savings" transaction in the Treasury Ledger:
    // Debit = Money leaving Treasury -> Savings Account (Asset Transfer)
    // Credit = Money entering Treasury <- Savings Account
    
    // Let's stick to the clear ones first.
    setForm(f => ({ ...f, type: "Debit" }));
  }
}, [form.category]);
```

*Self-Correction on Savings*: The `calcSavingsBalance` function treats Debit as Deposit (Leaving Treasury) and Credit as Withdrawal (Entering Treasury). So defaulting "Savings" to Debit (Deposit) is a safe default for "putting money away".

### 3. Verify `Reports` Component

Ensure the Balance Sheet matches the new logic.
*   **Liabilities**: Uses `calcLoanLiability`. If we fix that function, the Balance Sheet updates automatically.
*   **Equity**: Calculated as `Assets - Liabilities`. Fixing `calcLoanLiability` will strictly correct Equity.

## Implementation Steps

1.  **Modify `src/App.jsx`**:
    *   Replace `calcLoanLiability` with the robust version.
    *   Add the `useEffect` hook in the `Transactions` component to auto-set `type`.

2.  **Test**:
    *   Verify "Loan Proceeds" increases liability.
    *   Verify "Loan Repayment" decreases liability.
    *   Verify "Loan Proceeds" (Debit correction) decreases liability.
