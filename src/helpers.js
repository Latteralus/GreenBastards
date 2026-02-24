// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function buildChartData(transactions) {
  const approved = transactions.filter(t => t.status === "Approved").sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  const byDate = {};
  approved.forEach(t => {
    running += t.type === "Credit" ? t.amount : -t.amount;
    byDate[t.date] = running;
  });
  
  const data = Object.entries(byDate).map(([date, balance]) => ({
    date: date.slice(5),
    balance: parseFloat(balance.toFixed(2))
  }));

  if (data.length === 0) {
    return [
      { date: "Start", balance: 0 },
      { date: "Now", balance: 0 }
    ];
  }

  if (data.length === 1) {
    const firstDateKey = Object.keys(byDate)[0];
    const prevDate = new Date(firstDateKey);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().slice(5, 10);
    
    data.unshift({ date: prevDateStr, balance: 0 });
  }

  return data;
}

export function calcSummary(transactions, categories) {
  const approved = transactions.filter(t => t.status === "Approved");

  // Build category-type lookup from DB: { "Sales Revenue": "Revenue", ... }
  const catType = {};
  (categories || []).forEach(c => { catType[c.name] = c.type; });

  // Treasury Balance — ALL approved transactions affect cash
  const totalCredits = approved.filter(t => t.type === "Credit").reduce((s, t) => s + t.amount, 0);
  const totalDebits = approved.filter(t => t.type === "Debit").reduce((s, t) => s + t.amount, 0);
  const balance = totalCredits - totalDebits;

  // Operating Revenue — Only Credits from type='Revenue' categories
  // Excludes: Investment (Equity), Capital Contribution (Equity), Loan Proceeds (Liability), Savings (Asset)
  const revenue = approved
    .filter(t => t.type === "Credit" && catType[t.category] === "Revenue")
    .reduce((s, t) => s + t.amount, 0);

  // Operating Expenses — Only Debits from type='Expense' categories
  // Excludes: Equipment (Asset), Savings (Asset), Loan Repayment (Liability)
  // NOTE: COGS is type='Expense' and IS included here (recorded only when a sale occurs)
  const expenses = approved
    .filter(t => t.type === "Debit" && catType[t.category] === "Expense")
    .reduce((s, t) => s + t.amount, 0);

  const pending = transactions.filter(t => t.status === "Pending").length;

  return { revenue, expenses, balance, pending };
}

export function calcSavingsBalance(transactions) {
  const approved = transactions.filter(t => t.status === "Approved" && t.category === "Savings");
  const deposited = approved.filter(t => t.type === "Debit").reduce((s, t) => s + t.amount, 0); // Money LEAVING Treasury -> Savings
  const withdrawn = approved.filter(t => t.type === "Credit").reduce((s, t) => s + t.amount, 0); // Money ENTERING Treasury <- Savings
  return deposited - withdrawn;
}

export function calcLoanLiability(transactions, loans = []) {
  const approved = transactions.filter(t => t.status === "Approved");

  // Total owed = each loan's principal × (1 + interest_rate / 100)
  // This means a $10,000 loan at 10% creates $11,000 in debt from day one
  const totalOwed = loans.reduce((sum, loan) => {
    const principal = parseFloat(loan.principal_amount) || 0;
    const rate = parseFloat(loan.interest_rate) || 0;
    return sum + principal * (1 + rate / 100);
  }, 0);

  // Subtract net repayments (Debit repayments reduce liability, Credit corrections add back)
  const repaymentDebits = approved
    .filter(t => t.category === "Loan Repayment" && t.type === "Debit")
    .reduce((s, t) => s + t.amount, 0);
    
  const repaymentCredits = approved
    .filter(t => t.category === "Loan Repayment" && t.type === "Credit")
    .reduce((s, t) => s + t.amount, 0);

  const netRepayments = repaymentDebits - repaymentCredits;

  // Liability = Total Owed (principal + interest) - Net Repayments
  return totalOwed - netRepayments;
}

export function fmt(n) {
  return "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
