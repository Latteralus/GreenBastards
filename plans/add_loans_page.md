# Plan: Add Loans Page

## Objective
Add a new "Loans" page to the sidebar to visualize and manage company debt.

## Features
1.  **Sidebar Navigation**: Add "Loans" item.
2.  **Debt Visualization**: A graph showing total debt over time.
3.  **Loan List**: Cards for each loan showing:
    -   Name & Lender
    -   Interest Rate
    -   Original Principal ("Started With")
    -   Remaining Balance ("How much is left")
    -   Progress Bar (Repayment %)

## Implementation Details

### 1. `Loans` Component (New)
Create a new function component `Loans({ transactions, loans })`.

#### A. Data Processing
-   **Loan Details**:
    -   Iterate through `loans` prop.
    -   For each loan, calculate `remainingBalance`:
        -   Filter `transactions` where `loan_id === loan.id`.
        -   `Balance` = `(Proceeds Credits - Proceeds Debits) - (Repayment Debits - Repayment Credits)`.
        -   *Note*: Ensure we handle the sign correctly based on the recent "Financial Logic Fix" where Proceeds are Credits.
    -   `originalAmount`: Use `loan.principal_amount` directly from the `loans` table.
    -   `progress`: `(originalAmount - remainingBalance) / originalAmount`.

-   **Chart Data (`buildDebtChartData`)**:
    -   Filter `transactions` for categories `Loan Proceeds` and `Loan Repayment`.
    -   Sort by `date`.
    -   Iterate to build a time series:
        -   Start `currentDebt = 0`.
        -   If `Loan Proceeds` (Credit): `currentDebt += amount`.
        -   If `Loan Repayment` (Debit): `currentDebt -= amount`.
        -   Push `{ date, debt: currentDebt }`.
    -   Handle edge cases (no data).

#### B. UI Layout
-   **Header**: Title "Loans & Debt Service".
-   **Chart Section**: `AreaChart` (Recharts) showing Total Debt. Use a reddish/orange color scheme (e.g., `#e05050` or `#e09030`) to differentiate from the gold/green of assets.
-   **Loan Cards Grid**:
    -   Card style similar to `StatCard` or `Inventory` items.
    -   Display fields clearly.
    -   Visual progress bar: `<div style={{ width: '100%', height: 4, background: '...' }}><div style={{ width: '${progress}%', ... }} /></div>`

### 2. Update `App.jsx`
-   **Sidebar**: Add `{ id: "loans", label: "Loans", icon: "💰" }` to `navItems`.
-   **Main Render**: Add `active === "loans"` case.
    -   `<Loans transactions={transactions} loans={loans} />`

## logic Verification
-   **Proceeds**: Treated as Liability Increase (Credit).
-   **Repayments**: Treated as Liability Decrease (Debit).
-   **Interest**: Currently display the *rate* only. If "Interest Expense" transactions exist, they are Expenses, not directly adding to the Loan Principal unless capitalized. We will assume standard amortization where repayments cover interest + principal, but for *simple* tracking, we just deduct repayments from the principal balance for now.

## Dependencies
-   `recharts` (already installed and used in `App.jsx`).
-   `lucide-react` (not used, using unicode icons).

## Files to Modify
-   `src/App.jsx`
