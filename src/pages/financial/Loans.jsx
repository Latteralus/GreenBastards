import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { fmt } from "../../helpers.js";
import CustomTooltip from "../../components/shared/CustomTooltip.jsx";

export default function Loans({ transactions, loans }) {
  // 1. Calculate Loan Details
  const loanDetails = loans.map(loan => {
    // Get all approved transactions for this loan
    const related = transactions.filter(t => t.status === "Approved" && t.loan_id === loan.id);
    
    // Calculate Net Proceeds (Liability Increases)
    const proceedsCredits = related
      .filter(t => t.category === "Loan Proceeds" && t.type === "Credit")
      .reduce((s, t) => s + t.amount, 0);
      
    const proceedsDebits = related
      .filter(t => t.category === "Loan Proceeds" && t.type === "Debit")
      .reduce((s, t) => s + t.amount, 0);
      
    const netProceeds = proceedsCredits - proceedsDebits;

    // Calculate Net Repayments (Liability Decreases)
    const repaymentDebits = related
      .filter(t => t.category === "Loan Repayment" && t.type === "Debit")
      .reduce((s, t) => s + t.amount, 0);
      
    const repaymentCredits = related
      .filter(t => t.category === "Loan Repayment" && t.type === "Credit")
      .reduce((s, t) => s + t.amount, 0);
      
    const netRepayments = repaymentDebits - repaymentCredits;

    const principal = parseFloat(loan.principal_amount) || 0;
    const rate = parseFloat(loan.interest_rate) || 0;
    const totalOwed = principal * (1 + rate / 100); // Principal + Interest from day one
    const remaining = totalOwed - netRepayments;
    
    // Progress: How much of the TOTAL OWED (principal + interest) is paid off?
    const progress = totalOwed > 0 ? Math.max(0, Math.min(100, ((totalOwed - remaining) / totalOwed) * 100)) : 0;

    return { ...loan, remaining, totalOwed, original: principal, progress };
  });

  // 2. Build Chart Data (Total Debt Over Time)
  // Build a lookup of loan interest multipliers by loan_id
  const loanMultiplier = {};
  loans.forEach(loan => {
    const rate = parseFloat(loan.interest_rate) || 0;
    loanMultiplier[loan.id] = 1 + rate / 100;
  });

  const buildDebtChart = () => {
    const approved = transactions.filter(t => t.status === "Approved").sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    const byDate = {};
    
    approved.forEach(t => {
      let change = 0;
      if (t.category === "Loan Proceeds") {
        // When a loan is taken, debt = principal × (1 + rate/100)
        const mult = (t.loan_id && loanMultiplier[t.loan_id]) ? loanMultiplier[t.loan_id] : 1;
        change = t.type === "Credit" ? t.amount * mult : -t.amount * mult;
      } else if (t.category === "Loan Repayment") {
        change = t.type === "Debit" ? -t.amount : t.amount;
      }
      
      if (change !== 0) {
        running += change;
        byDate[t.date] = running;
      }
    });
    
    const data = Object.entries(byDate).map(([date, balance]) => ({
      date: date.slice(5),
      balance: parseFloat(Math.max(0, balance).toFixed(2)) // Debt shouldn't be negative
    }));

    if (data.length === 0) {
      return [{ date: "Start", balance: 0 }, { date: "Now", balance: 0 }];
    }
    
    if (data.length === 1) {
      // Add a start point for better visual
      const firstDateKey = Object.keys(byDate)[0];
      const prevDate = new Date(firstDateKey);
      prevDate.setDate(prevDate.getDate() - 1);
      data.unshift({ date: prevDate.toISOString().slice(5, 10), balance: 0 });
    }
    
    return data;
  };

  const chartData = buildDebtChart();
  const totalDebt = loanDetails.reduce((s, l) => s + l.remaining, 0);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#e8e0d0", fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>Loans & Debt Service</div>
        <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 4 }}>Manage outstanding liabilities and repayment schedules</div>
      </div>

      <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "24px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
           <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Total Debt Liability</div>
           <div style={{ color: "#e05050", fontSize: 18, fontWeight: "bold" }}>{fmt(totalDebt)}</div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e05050" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#e05050" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,20,0.06)" />
            <XAxis dataKey="date" stroke="#3a3a3a" tick={{ fill: "#5a6a5a", fontSize: 11 }} />
            <YAxis stroke="#3a3a3a" tick={{ fill: "#5a6a5a", fontSize: 11 }} tickFormatter={v => "$" + (v / 1000).toFixed(1) + "k"} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="balance" stroke="#e05050" strokeWidth={2} fill="url(#debtGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {loanDetails.map(loan => (
          <div key={loan.id} style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ color: "#c8a820", fontSize: 14, fontWeight: "bold" }}>{loan.name}</div>
              <div style={{ color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>{loan.status}</div>
            </div>
            <div style={{ color: "#8a9a8a", fontSize: 12, marginBottom: 16 }}>Lender: {loan.lender} · {loan.interest_rate}% MPR</div>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
               <div style={{ color: "#5a6a5a", fontSize: 11 }}>Principal</div>
               <div style={{ color: "#e8e0d0", fontSize: 12 }}>{fmt(loan.original)}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
               <div style={{ color: "#5a6a5a", fontSize: 11 }}>Total Owed (incl. interest)</div>
               <div style={{ color: "#c8a820", fontSize: 12 }}>{fmt(loan.totalOwed)}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
               <div style={{ color: "#5a6a5a", fontSize: 11 }}>Remaining</div>
               <div style={{ color: "#e05050", fontSize: 13, fontWeight: "bold" }}>{fmt(loan.remaining)}</div>
            </div>

            <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${loan.progress}%`, height: "100%", background: "#50c860", borderRadius: 3 }} />
            </div>
            <div style={{ textAlign: "right", color: "#50c860", fontSize: 10, marginTop: 4 }}>{loan.progress.toFixed(0)}% Paid Off</div>
          </div>
        ))}
        
        {loans.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40, color: "#5a6a5a", border: "1px dashed rgba(180,140,20,0.2)", borderRadius: 4 }}>
            No active loans found.
          </div>
        )}
      </div>
    </div>
  );
}
