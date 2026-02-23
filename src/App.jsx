import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "./supabaseClient";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function buildChartData(transactions) {
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

function calcSummary(transactions, categories) {
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

function calcSavingsBalance(transactions) {
  const approved = transactions.filter(t => t.status === "Approved" && t.category === "Savings");
  const deposited = approved.filter(t => t.type === "Debit").reduce((s, t) => s + t.amount, 0); // Money LEAVING Treasury -> Savings
  const withdrawn = approved.filter(t => t.type === "Credit").reduce((s, t) => s + t.amount, 0); // Money ENTERING Treasury <- Savings
  return deposited - withdrawn;
}

function calcLoanLiability(transactions) {
  const approved = transactions.filter(t => t.status === "Approved");
  
  // Liability Increases with Proceeds (Credit)
  // Liability Decreases with Repayments (Debit)
  
  const proceedsCredits = approved
    .filter(t => t.category === "Loan Proceeds" && t.type === "Credit")
    .reduce((s, t) => s + t.amount, 0);
    
  const proceedsDebits = approved
    .filter(t => t.category === "Loan Proceeds" && t.type === "Debit")
    .reduce((s, t) => s + t.amount, 0); // Should be zero if data is clean, but handles corrections

  const repaymentDebits = approved
    .filter(t => t.category === "Loan Repayment" && t.type === "Debit")
    .reduce((s, t) => s + t.amount, 0);
    
  const repaymentCredits = approved
    .filter(t => t.category === "Loan Repayment" && t.type === "Credit")
    .reduce((s, t) => s + t.amount, 0); // Should be zero if clean

  // Liability = (Proceeds IN - Proceeds Correction) - (Repayments OUT - Repayments Correction)
  return (proceedsCredits - proceedsDebits) - (repaymentDebits - repaymentCredits);
}

function fmt(n) {
  return "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "rgba(10,7,20,0.95)", border: "1px solid rgba(180,140,20,0.3)", borderRadius: 3, padding: "8px 14px" }}>
        <div style={{ color: "#c8a820", fontSize: 13 }}>{fmt(payload[0].value)}</div>
        <div style={{ color: "#5a6a5a", fontSize: 11 }}>{payload[0].payload.date}</div>
      </div>
    );
  }
  return null;
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function LoginScreen({ onLogin, accounts }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      const user = accounts.find(u => u.username === username && u.password === password);
      if (user) { 
        const userData = { ...user, role: user.position, displayName: user.username };
        localStorage.setItem("user", JSON.stringify(userData));
        onLogin(userData); 
      } else { 
        setError("Invalid credentials. Check username and password."); 
        setLoading(false); 
      }
    }, 500);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0d0a1a 0%, #1a1130 50%, #0d1a0f 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(180,140,20,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(30,100,40,0.08) 0%, transparent 50%)" }} />
      <div style={{ position: "relative", width: 420, background: "rgba(15,10,30,0.95)", border: "1px solid rgba(180,140,20,0.3)", borderRadius: 4, padding: "48px 40px", boxShadow: "0 0 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(180,140,20,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 42, marginBottom: 8 }}>🍺</div>
          <div style={{ color: "#c8a820", fontSize: 22, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase" }}>Green Bastards</div>
          <div style={{ color: "#5a6a5a", fontSize: 12, letterSpacing: 4, textTransform: "uppercase", marginTop: 4 }}>Brewery · Financial Portal</div>
        </div>

        <form onSubmit={handle}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Username</label>
            <input value={username} onChange={e => { setUsername(e.target.value); setError(""); }}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,140,20,0.2)", borderRadius: 3, padding: "10px 14px", color: "#e8e0d0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              placeholder="Enter username" />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Password</label>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,140,20,0.2)", borderRadius: 3, padding: "10px 14px", color: "#e8e0d0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              placeholder="Enter password" />
          </div>
          {error && <div style={{ color: "#e05050", fontSize: 13, marginBottom: 16, textAlign: "center" }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: "100%", background: loading ? "rgba(180,140,20,0.3)" : "linear-gradient(135deg, #c8a820, #a08010)", border: "none", borderRadius: 3, padding: "12px", color: "#0d0a1a", fontSize: 13, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase", cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}>
            {loading ? "Authenticating..." : "Access Portal"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Sidebar({ active, setActive, user, onLogout, pendingCount }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "◈" },
    { id: "transactions", label: "Transactions", icon: "⟳" },
    { id: "inventory", label: "Inventory", icon: "▦" },
    { id: "loans", label: "Loans", icon: "❖" },
    { id: "audit", label: "Audit Center", icon: "◎", cfOnly: true },
    { id: "reports", label: "Reports", icon: "▤" },
    { id: "settings", label: "Settings", icon: "⚙" },
  ];

  return (
    <div style={{ width: 220, minHeight: "100vh", background: "rgba(8,5,18,0.98)", borderRight: "1px solid rgba(180,140,20,0.15)", display: "flex", flexDirection: "column", position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100 }}>
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(180,140,20,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 28 }}>🍺</div>
          <div>
            <div style={{ color: "#c8a820", fontSize: 13, fontWeight: "bold", letterSpacing: 1 }}>Green Bastards</div>
            <div style={{ color: "#3a4a3a", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>Brewery</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "16px 0" }}>
        {navItems.map(item => {
          if (item.cfOnly && user.role !== "CFO") return null;
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", background: isActive ? "rgba(180,140,20,0.12)" : "transparent", border: "none", borderLeft: isActive ? "2px solid #c8a820" : "2px solid transparent", color: isActive ? "#c8a820" : "#5a6a5a", cursor: "pointer", fontSize: 13, textAlign: "left", transition: "all 0.15s", fontFamily: "Georgia, serif" }}>
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
              {item.label}
              {item.id === "audit" && pendingCount > 0 && <span style={{ marginLeft: "auto", background: "#c8a820", color: "#0d0a1a", fontSize: 10, fontWeight: "bold", borderRadius: 10, padding: "1px 6px" }}>{pendingCount}</span>}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(180,140,20,0.1)" }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: "#e8e0d0", fontSize: 13 }}>{user.displayName}</div>
          <div style={{ color: user.role === "CFO" ? "#c8a820" : "#50c860", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>⬡ {user.role}</div>
        </div>
        <button onClick={onLogout}
          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, padding: "7px", color: "#5a6a5a", fontSize: 11, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", fontFamily: "Georgia, serif" }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "rgba(15,10,30,0.8)", border: `1px solid ${accent}22`, borderRadius: 4, padding: "20px 24px", flex: 1 }}>
      <div style={{ color: "#5a6a5a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ color: accent, fontSize: 26, fontWeight: "bold", letterSpacing: 1 }}>{value}</div>
      {sub && <div style={{ color: "#5a6a5a", fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Dashboard({ transactions, categories }) {
  const chartData = buildChartData(transactions);
  const { revenue, expenses, balance, pending } = calcSummary(transactions, categories);
  const savings = calcSavingsBalance(transactions);
  const loanLiability = calcLoanLiability(transactions);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#e8e0d0", fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>Financial Overview</div>
        <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 4 }}>February 2026 · DemocracyCraft Fiscal Period</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        <StatCard label="Treasury Balance" value={fmt(balance)} sub="Approved transactions" accent="#c8a820" />
        <StatCard label="Operating Revenue" value={fmt(revenue)} sub="Excl. financing" accent="#50c860" />
        <StatCard label="Operating Expenses" value={fmt(expenses)} sub="Excl. transfers" accent="#e05050" />
        <StatCard label="Pending Audit" value={pending} sub="Items in queue" accent="#e09030" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <StatCard label="Savings Balance" value={fmt(savings)} sub="Cash Reserve" accent="#3498db" />
        <StatCard label="Total Loan Liability" value={fmt(loanLiability)} sub="Outstanding Principal" accent="#9b59b6" />
      </div>

      <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "24px", marginBottom: 24 }}>
        <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Treasury Over Time · Fragment History</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c8a820" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#c8a820" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,20,0.06)" />
            <XAxis dataKey="date" stroke="#3a3a3a" tick={{ fill: "#5a6a5a", fontSize: 11 }} />
            <YAxis stroke="#3a3a3a" tick={{ fill: "#5a6a5a", fontSize: 11 }} tickFormatter={v => "$" + (v / 1000).toFixed(1) + "k"} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="balance" stroke="#c8a820" strokeWidth={2} fill="url(#balGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "24px" }}>
        <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Recent Approved Transactions</div>
        {transactions.filter(t => t.status === "Approved").slice(-5).reverse().map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 3, background: t.type === "Credit" ? "rgba(40,120,50,0.2)" : "rgba(180,50,50,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: t.type === "Credit" ? "#50c860" : "#e05050", fontSize: 14 }}>
                {t.type === "Credit" ? "↑" : "↓"}
              </div>
              <div>
                <div style={{ color: "#e8e0d0", fontSize: 13 }}>{t.category}</div>
                <div style={{ color: "#5a6a5a", fontSize: 11 }}>{t.memo}</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: t.type === "Credit" ? "#50c860" : "#e05050", fontSize: 14, fontWeight: "bold" }}>
                {t.type === "Credit" ? "+" : "-"}{fmt(t.amount)}
              </div>
              <div style={{ color: "#3a4a3a", fontSize: 11 }}>{t.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Transactions({ transactions, onTransactionUpdate, user, categories, loans }) {
  const categoryNames = categories.map(c => c.name);
  const [form, setForm] = useState({ 
    date: new Date().toISOString().slice(0, 10), 
    type: "Debit", 
    category: categoryNames[0] || "", 
    amount: "", 
    memo: "", 
    loan_id: "",
    newLoanName: "",
    newLoanLender: "",
    newLoanRate: ""
  });
  const [filter, setFilter] = useState("All");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Update form category default when categories load
  useEffect(() => {
    if (categories.length > 0) {
      setForm(f => {
        if (!f.category) {
          return { ...f, category: categories[0].name };
        }
        return f;
      });
    }
  }, [categories]);

  // Auto-switch transaction type based on category
  // Investment & Capital Contribution are Equity (money IN, not Revenue)
  useEffect(() => {
    if (["Loan Proceeds", "Capital Contribution", "Investment"].includes(form.category)) {
      setForm(f => ({ ...f, type: "Credit" }));
    } else if (["Loan Repayment", "Savings"].includes(form.category)) {
      setForm(f => ({ ...f, type: "Debit" }));
    }
  }, [form.category]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(parseFloat(form.amount))) return;
    setLoading(true);

    let finalLoanId = form.loan_id;

    // Handle New Loan Creation
    if (form.category === "Loan Proceeds" && form.loan_id === "new") {
      if (!form.newLoanName || !form.newLoanLender) {
        alert("Please enter Loan Name and Lender.");
        setLoading(false);
        return;
      }

      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .insert([{
          name: form.newLoanName,
          lender: form.newLoanLender,
          interest_rate: parseFloat(form.newLoanRate) || 0,
          principal_amount: parseFloat(form.amount) || 0 // Set principal to the initial loan amount
        }])
        .select()
        .single();

      if (loanError) {
        console.error('Error creating loan:', loanError);
        alert('Failed to create new loan');
        setLoading(false);
        return;
      }

      finalLoanId = loanData.id;
    }

    const newT = {
      date: form.date,
      type: form.type,
      category: form.category,
      amount: parseFloat(form.amount),
      memo: form.memo,
      submitted_by: user.displayName,
      status: user.role === "CFO" ? "Approved" : "Pending",
      approved_by: user.role === "CFO" ? user.displayName : null,
      loan_id: (form.category === "Loan Proceeds" || form.category === "Loan Repayment") ? finalLoanId : null
    };

    const { error } = await supabase.from('transactions').insert([newT]);

    if (error) {
      console.error('Error inserting transaction:', error);
      alert('Failed to submit transaction');
    } else {
      onTransactionUpdate(); // Refresh parent data
      setForm({ 
        date: new Date().toISOString().slice(0, 10), 
        type: "Debit", 
        category: categoryNames[0] || "", 
        amount: "", 
        memo: "", 
        loan_id: "",
        newLoanName: "",
        newLoanLender: "",
        newLoanRate: ""
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }
    setLoading(false);
  };

  const filtered = filter === "All" ? transactions : transactions.filter(t => t.status === filter);
  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,140,20,0.2)", borderRadius: 3, padding: "9px 12px", color: "#e8e0d0", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif" };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#e8e0d0", fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>Transaction Log</div>
        <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 4 }}>Submit and review all company transactions</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
        <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "24px" }}>
          <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Submit Voucher</div>
          <form onSubmit={submit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ ...inputStyle }}>
                <option value="Debit">Debit (Expense / Withdrawal)</option>
                <option value="Credit">Credit (Revenue / Deposit)</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle }}>
                {categoryNames.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            {(form.category === "Loan Proceeds" || form.category === "Loan Repayment") && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Select Loan</label>
                <select value={form.loan_id} onChange={e => setForm(f => ({ ...f, loan_id: e.target.value }))} style={{ ...inputStyle }}>
                  <option value="">-- Select a Loan --</option>
                  {form.category === "Loan Proceeds" && <option value="new">+ Create New Loan</option>}
                  {loans.map(l => <option key={l.id} value={l.id}>{l.name} ({l.lender})</option>)}
                </select>
              </div>
            )}

            {form.category === "Loan Proceeds" && form.loan_id === "new" && (
              <div style={{ marginBottom: 14, padding: "10px", background: "rgba(180,140,20,0.1)", borderRadius: 3, border: "1px dashed rgba(180,140,20,0.3)" }}>
                <div style={{ color: "#c8a820", fontSize: 11, fontWeight: "bold", marginBottom: 8, textTransform: "uppercase" }}>New Loan Details</div>
                <div style={{ display: "grid", gap: 10 }}>
                  <input placeholder="Loan Name (e.g. Startup Loan)" value={form.newLoanName} onChange={e => setForm(f => ({ ...f, newLoanName: e.target.value }))} style={inputStyle} />
                  <input placeholder="Lender (e.g. Bank of DC)" value={form.newLoanLender} onChange={e => setForm(f => ({ ...f, newLoanLender: e.target.value }))} style={inputStyle} />
                  <input type="number" step="0.01" placeholder="MPR (%)" value={form.newLoanRate} onChange={e => setForm(f => ({ ...f, newLoanRate: e.target.value }))} style={inputStyle} />
                </div>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Amount ($)</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} placeholder="0.00" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Memo</label>
              <input value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} style={inputStyle} placeholder="Example: Bought 10 Wheat from ExampleMart." />
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", background: loading ? "rgba(180,140,20,0.3)" : "linear-gradient(135deg, #c8a820, #a08010)", border: "none", borderRadius: 3, padding: "11px", color: "#0d0a1a", fontSize: 12, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase", cursor: loading ? "default" : "pointer", fontFamily: "Georgia, serif" }}>
              {loading ? "Submitting..." : submitted ? "✓ Submitted!" : "Submit Voucher"}
            </button>
            {user.role === "Executive" && <div style={{ color: "#5a6a5a", fontSize: 11, textAlign: "center", marginTop: 10 }}>Submissions go to CFO Audit Queue</div>}
          </form>
        </div>

        <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Ledger</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["All", "Approved", "Pending"].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ background: filter === f ? "rgba(180,140,20,0.15)" : "transparent", border: `1px solid ${filter === f ? "rgba(180,140,20,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 3, padding: "5px 12px", color: filter === f ? "#c8a820" : "#5a6a5a", fontSize: 11, cursor: "pointer", fontFamily: "Georgia, serif" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ maxHeight: 480, overflowY: "auto" }}>
            {filtered.slice().reverse().map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                  <div style={{ color: t.type === "Credit" ? "#50c860" : "#e05050", fontSize: 16, width: 20 }}>{t.type === "Credit" ? "↑" : "↓"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#e8e0d0", fontSize: 13 }}>{t.category}</span>
                      <span style={{ background: t.status === "Approved" ? "rgba(40,120,50,0.2)" : "rgba(200,100,20,0.2)", color: t.status === "Approved" ? "#50c860" : "#e09030", fontSize: 10, padding: "1px 6px", borderRadius: 2, letterSpacing: 1 }}>{t.status.toUpperCase()}</span>
                    </div>
                    <div style={{ color: "#5a6a5a", fontSize: 11 }}>{t.memo} · {t.submittedBy} · {t.date}</div>
                  </div>
                </div>
                <div style={{ color: t.type === "Credit" ? "#50c860" : "#e05050", fontSize: 14, fontWeight: "bold", minWidth: 90, textAlign: "right" }}>
                  {t.type === "Credit" ? "+" : "-"}{fmt(t.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AuditCenter({ transactions, onTransactionUpdate, user, categories }) {
  const pending = transactions.filter(t => t.status === "Pending");

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from('transactions')
      .update({ status: status, approved_by: user.displayName })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } else {
      onTransactionUpdate();
    }
  };

  const { balance } = calcSummary(transactions, categories); // This is Treasury Balance
  const pendingTotal = pending.reduce((s, t) => s + (t.type === "Credit" ? t.amount : -t.amount), 0);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#e8e0d0", fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>Audit Center</div>
        <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 4 }}>CFO-only · Review and verify pending vouchers against /db transactions</div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, background: "rgba(200,100,20,0.08)", border: "1px solid rgba(200,100,20,0.2)", borderRadius: 4, padding: "16px 20px" }}>
          <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Pending Items</div>
          <div style={{ color: "#e09030", fontSize: 28, fontWeight: "bold" }}>{pending.length}</div>
        </div>
        <div style={{ flex: 1, background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "16px 20px" }}>
          <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Pending Net Impact</div>
          <div style={{ color: pendingTotal >= 0 ? "#50c860" : "#e05050", fontSize: 28, fontWeight: "bold" }}>{pendingTotal >= 0 ? "+" : ""}{fmt(pendingTotal)}</div>
        </div>
        <div style={{ flex: 1, background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "16px 20px" }}>
          <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Current Balance</div>
          <div style={{ color: "#c8a820", fontSize: 28, fontWeight: "bold" }}>{fmt(balance)}</div>
        </div>
        <div style={{ flex: 1, background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "16px 20px" }}>
          <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Balance if All Approved</div>
          <div style={{ color: "#a0c8a0", fontSize: 28, fontWeight: "bold" }}>{fmt(balance + pendingTotal)}</div>
        </div>
      </div>

      {pending.length === 0 ? (
        <div style={{ background: "rgba(40,120,50,0.08)", border: "1px solid rgba(40,120,50,0.2)", borderRadius: 4, padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
          <div style={{ color: "#50c860", fontSize: 16 }}>Audit Queue Clear</div>
          <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 6 }}>All transactions have been reviewed.</div>
        </div>
      ) : (
        <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "24px" }}>
          <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Pending Verification — Cross-check against /db transactions</div>
          {pending.map(t => (
            <div key={t.id} style={{ background: "rgba(200,100,20,0.06)", border: "1px solid rgba(200,100,20,0.15)", borderRadius: 3, padding: "16px 20px", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                    <span style={{ color: t.type === "Credit" ? "#50c860" : "#e05050", fontSize: 18 }}>{t.type === "Credit" ? "↑" : "↓"}</span>
                    <span style={{ color: "#e8e0d0", fontSize: 15, fontWeight: "bold" }}>{t.category}</span>
                    <span style={{ color: t.type === "Credit" ? "#50c860" : "#e05050", fontSize: 16, fontWeight: "bold" }}>{t.type === "Credit" ? "+" : "-"}{fmt(t.amount)}</span>
                  </div>
                  <div style={{ color: "#8a9a8a", fontSize: 13, marginBottom: 4 }}>{t.memo}</div>
                  <div style={{ color: "#3a4a3a", fontSize: 11 }}>Submitted by {t.submittedBy} · {t.date}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => updateStatus(t.id, "Approved")}
                    style={{ background: "rgba(40,120,50,0.2)", border: "1px solid rgba(40,120,50,0.4)", borderRadius: 3, padding: "8px 20px", color: "#50c860", fontSize: 12, cursor: "pointer", fontWeight: "bold", letterSpacing: 1, fontFamily: "Georgia, serif" }}>
                    ✓ APPROVE
                  </button>
                  <button onClick={() => updateStatus(t.id, "Rejected")}
                    style={{ background: "rgba(180,50,50,0.2)", border: "1px solid rgba(180,50,50,0.4)", borderRadius: 3, padding: "8px 20px", color: "#e05050", fontSize: 12, cursor: "pointer", fontWeight: "bold", letterSpacing: 1, fontFamily: "Georgia, serif" }}>
                    ✗ REJECT
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Loans({ transactions, loans }) {
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

    const remaining = netProceeds - netRepayments;
    const original = parseFloat(loan.principal_amount);
    
    // Progress: How much of the PRINCIPAL is paid off?
    // If remaining is higher than original (accrued interest not tracked separately?), cap at 0%
    // If remaining is 0, 100%
    const progress = original > 0 ? Math.max(0, Math.min(100, ((original - remaining) / original) * 100)) : 0;

    return { ...loan, remaining, original, progress };
  });

  // 2. Build Chart Data (Total Debt Over Time)
  const buildDebtChart = () => {
    const approved = transactions.filter(t => t.status === "Approved").sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    const byDate = {};
    
    approved.forEach(t => {
      let change = 0;
      if (t.category === "Loan Proceeds") {
        change = t.type === "Credit" ? t.amount : -t.amount;
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
               <div style={{ color: "#5a6a5a", fontSize: 11 }}>Original</div>
               <div style={{ color: "#e8e0d0", fontSize: 12 }}>{fmt(loan.original)}</div>
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

function Reports({ transactions, inventory, categories }) {
  const { revenue, expenses } = calcSummary(transactions, categories);
  const netIncome = revenue - expenses;
  const savingsBalance = calcSavingsBalance(transactions);
  const loanLiability = calcLoanLiability(transactions);

  // Calculate inventory value from inventory table (authoritative for on-hand stock)
  const inventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * (parseFloat(item.est_value) || 0)), 0);

  // Aggregate approved transactions by category
  const approved = transactions.filter(t => t.status === "Approved");
  const byCategory = {};
  approved.forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = { credits: 0, debits: 0 };
    if (t.type === "Credit") byCategory[t.category].credits += t.amount;
    else byCategory[t.category].debits += t.amount;
  });

  // Equipment is an Asset — NO depreciation applied (per policy)
  const equipmentValue = byCategory["Equipment"]?.debits || 0;

  // Founder Capital = Capital Contribution + Investment (both are Equity, not Revenue)
  const founderCapital = (byCategory["Capital Contribution"]?.credits || 0) + (byCategory["Investment"]?.credits || 0);

  // COGS — Only from explicit "COGS" category (accrual basis: recorded when sale occurs, NOT on purchase)
  const cogs = byCategory["COGS"]?.debits || 0;
  const grossProfit = revenue - cogs;

  // Operating Expenses (type='Expense' excluding COGS)
  const opexPayroll = byCategory["Payroll"]?.debits || 0;
  const opexRent = byCategory["Rent"]?.debits || 0;
  const opexUtilities = byCategory["Utilities"]?.debits || 0;
  const opexTax = byCategory["Tax"]?.debits || 0;
  const opexMisc = byCategory["Miscellaneous"]?.debits || 0;
  const totalOpex = opexPayroll + opexRent + opexUtilities + opexTax + opexMisc;
  
  // Treasury Balance (Actual Cash — all approved credits minus all approved debits)
  const treasuryBalance = approved.filter(t => t.type === "Credit").reduce((s, t) => s + t.amount, 0)
    - approved.filter(t => t.type === "Debit").reduce((s, t) => s + t.amount, 0);

  // ─── Balance Sheet Integrity Check ──────────────────────────────────────
  const totalAssets = treasuryBalance + savingsBalance + inventoryValue + equipmentValue;
  const totalLiabilities = loanLiability;
  // Retained Earnings derived from Income Statement (NOT a plug)
  const retainedEarnings = netIncome;
  const totalEquity = founderCapital + retainedEarnings;
  const isBalanced = Math.abs(totalAssets - totalLiabilities - totalEquity) < 0.01;

  const [active, setActive] = useState("income");

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#e8e0d0", fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>Reports</div>
        <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 4 }}>DemocracyCraft Accounting Reform Act — Required Financial Statements</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {[
          { id: "income", label: "Income Statement" },
          { id: "balance", label: "Balance Sheet" },
          { id: "equity", label: "Owner's Equity" },
          { id: "mda", label: "MD&A" },
        ].map(r => (
          <button key={r.id} onClick={() => setActive(r.id)}
            style={{ background: active === r.id ? "rgba(180,140,20,0.15)" : "rgba(15,10,30,0.8)", border: `1px solid ${active === r.id ? "rgba(180,140,20,0.4)" : "rgba(180,140,20,0.1)"}`, borderRadius: 3, padding: "10px 20px", color: active === r.id ? "#c8a820" : "#5a6a5a", fontSize: 13, cursor: "pointer", fontFamily: "Georgia, serif" }}>
            {r.label}
          </button>
        ))}
      </div>

      <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "32px" }}>
        {active === "income" && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ textAlign: "center", marginBottom: 32, borderBottom: "1px solid rgba(180,140,20,0.2)", paddingBottom: 20 }}>
              <div style={{ color: "#c8a820", fontSize: 18, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase" }}>Green Bastards Brewery</div>
              <div style={{ color: "#8a9a8a", fontSize: 13, marginTop: 4 }}>Income Statement · February 2026</div>
            </div>
            <SectionHeader label="REVENUE" />
            <Row label="Sales Revenue" val={byCategory["Sales Revenue"]?.credits || 0} color="#50c860" />
            <Row label="Contract Revenue" val={byCategory["Contract Revenue"]?.credits || 0} color="#50c860" />
            <Row label="Miscellaneous Income" val={byCategory["Miscellaneous"]?.credits || 0} color="#50c860" />
            <TotalRow label="TOTAL REVENUE" val={revenue} color="#50c860" />
            <div style={{ height: 16 }} />
            <SectionHeader label="COST OF GOODS SOLD" />
            <Row label="COGS" val={-cogs} color="#e05050" sub="Accrual basis — recorded when sale occurs" />
            <TotalRow label="GROSS PROFIT" val={grossProfit} color={grossProfit >= 0 ? "#50c860" : "#e05050"} />
            <div style={{ height: 16 }} />
            <SectionHeader label="OPERATING EXPENSES" />
            <Row label="Payroll" val={-opexPayroll} color="#e05050" />
            <Row label="Rent" val={-opexRent} color="#e05050" />
            <Row label="Utilities" val={-opexUtilities} color="#e05050" />
            <Row label="Tax" val={-opexTax} color="#e05050" />
            <Row label="Miscellaneous Expenses" val={-opexMisc} color="#e05050" />
            <TotalRow label="TOTAL OPERATING EXPENSES" val={totalOpex} color="#e05050" />
            <div style={{ height: 8 }} />
            <TotalRow label="NET INCOME" val={netIncome} color={netIncome >= 0 ? "#c8a820" : "#e05050"} large />
            <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(180,140,20,0.06)", border: "1px dashed rgba(180,140,20,0.2)", borderRadius: 3 }}>
              <div style={{ color: "#5a6a5a", fontSize: 11 }}>
                Note: Investment and Capital Contributions are classified as Owner's Equity, not Revenue.
                Raw material purchases are recorded as Inventory Assets. Equipment is capitalized with no depreciation.
                COGS is recognized only when a sale occurs (accrual basis).
              </div>
            </div>
          </div>
        )}

        {active === "balance" && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ textAlign: "center", marginBottom: 32, borderBottom: "1px solid rgba(180,140,20,0.2)", paddingBottom: 20 }}>
              <div style={{ color: "#c8a820", fontSize: 18, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase" }}>Green Bastards Brewery</div>
              <div style={{ color: "#8a9a8a", fontSize: 13, marginTop: 4 }}>Balance Sheet · February 2026</div>
            </div>
            <SectionHeader label="ASSETS" />
            <Row label="Cash (Treasury)" val={treasuryBalance} color="#50c860" />
            <Row label="Savings Account" val={savingsBalance} color="#3498db" />
            <Row label="Inventory (est. market value)" val={inventoryValue} color="#50c860" sub="Raw materials & finished goods on hand" />
            <Row label="Equipment & Fixtures" val={equipmentValue} color="#50c860" sub="No depreciation applied (per policy)" />
            <TotalRow label="TOTAL ASSETS" val={totalAssets} color="#50c860" />
            <div style={{ height: 20 }} />
            <SectionHeader label="LIABILITIES" />
            <Row label="Loans Payable" val={loanLiability} color="#e05050" sub="Outstanding principal" />
            <TotalRow label="TOTAL LIABILITIES" val={totalLiabilities} color="#e05050" />
            <div style={{ height: 20 }} />
            <SectionHeader label="OWNER'S EQUITY" />
            <Row label="Founder Capital" val={founderCapital} color="#c8a820" sub="Capital Contribution + Investment" />
            <Row label="Retained Earnings" val={retainedEarnings} color="#c8a820" sub="Derived from Net Income" />
            <TotalRow label="TOTAL EQUITY" val={totalEquity} color="#c8a820" />
            <div style={{ height: 16 }} />
            <TotalRow label="LIABILITIES + EQUITY" val={totalLiabilities + totalEquity} color="#c8a820" large />

            {/* Balance Sheet Integrity Check */}
            <div style={{ marginTop: 16, padding: "12px 16px", background: isBalanced ? "rgba(40,120,50,0.08)" : "rgba(180,50,50,0.12)", border: `1px solid ${isBalanced ? "rgba(40,120,50,0.3)" : "rgba(180,50,50,0.4)"}`, borderRadius: 4, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{isBalanced ? "✓" : "✗"}</span>
              <div>
                <div style={{ color: isBalanced ? "#50c860" : "#e05050", fontSize: 13, fontWeight: "bold" }}>
                  {isBalanced ? "Balance Sheet Integrity: VERIFIED" : "Balance Sheet Integrity: OUT OF BALANCE"}
                </div>
                <div style={{ color: "#5a6a5a", fontSize: 11 }}>
                  Assets ({fmt(totalAssets)}) {isBalanced ? "=" : "≠"} Liabilities ({fmt(totalLiabilities)}) + Equity ({fmt(totalEquity)})
                </div>
              </div>
            </div>
          </div>
        )}

        {active === "equity" && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ textAlign: "center", marginBottom: 32, borderBottom: "1px solid rgba(180,140,20,0.2)", paddingBottom: 20 }}>
              <div style={{ color: "#c8a820", fontSize: 18, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase" }}>Green Bastards Brewery</div>
              <div style={{ color: "#8a9a8a", fontSize: 13, marginTop: 4 }}>Statement of Owner's Equity · February 2026</div>
            </div>
            <Row label="Beginning Equity" val={0} color="#c8a820" />
            <Row label="Capital Contributions" val={founderCapital} color="#50c860" sub="Capital Contribution + Investment" />
            <Row label="Net Income This Period" val={netIncome} color={netIncome >= 0 ? "#50c860" : "#e05050"} />
            <Row label="Owner Withdrawals" val={0} color="#e05050" />
            <TotalRow label="ENDING OWNER'S EQUITY" val={founderCapital + netIncome} color="#c8a820" large />
          </div>
        )}

        {active === "mda" && (
          <div style={{ maxWidth: 680 }}>
            <div style={{ textAlign: "center", marginBottom: 32, borderBottom: "1px solid rgba(180,140,20,0.2)", paddingBottom: 20 }}>
              <div style={{ color: "#c8a820", fontSize: 18, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase" }}>Green Bastards Brewery</div>
              <div style={{ color: "#8a9a8a", fontSize: 13, marginTop: 4 }}>Management Discussion & Analysis · February 2026</div>
            </div>
            <MDASection title="Business Overview">
              Green Bastards Brewery is a startup brewing company operating within the DemocracyCraft jurisdiction, licensed under the Department of Commerce. The company produces and distributes brewed beverages via chest shop retail and government supply contracts. This report covers our first full operating month.
            </MDASection>
            <MDASection title="Capital Structure">
              The company was funded through {fmt(founderCapital)} in founder capital contributions and investment. These inflows are classified as Owner's Equity on the Balance Sheet — they are not earned revenue and do not appear on the Income Statement. Outstanding loan liabilities total {fmt(loanLiability)}, with repayment tracked on a per-loan basis.
            </MDASection>
            <MDASection title="Revenue Performance">
              Total operating revenue for February 2026 reached {fmt(revenue)}, composed of chest shop sales ({fmt(byCategory["Sales Revenue"]?.credits || 0)}) and contract revenue ({fmt(byCategory["Contract Revenue"]?.credits || 0)}). Revenue is recognized only from earned income — sales of goods and services.
            </MDASection>
            <MDASection title="Cost Management & Inventory Policy">
              The company follows accrual-based inventory accounting. Purchases of raw materials are capitalized as Inventory Assets on the Balance Sheet and are not expensed until a sale occurs. Cost of Goods Sold (COGS) for this period was {fmt(cogs)}. Current inventory on hand is valued at {fmt(inventoryValue)}. Equipment totaling {fmt(equipmentValue)} has been capitalized with no depreciation applied per company policy.
            </MDASection>
            <MDASection title="Expense Analysis">
              Total operating expenses reached {fmt(totalOpex)}. Payroll ({fmt(opexPayroll)}) was the largest component, followed by rent ({fmt(opexRent)}), utilities ({fmt(opexUtilities)}), and taxes ({fmt(opexTax)}). Net Income for the period was {fmt(netIncome)}.
            </MDASection>
            <MDASection title="Balance Sheet Health">
              Total assets stand at {fmt(totalAssets)}, comprising cash ({fmt(treasuryBalance)}), savings ({fmt(savingsBalance)}), inventory ({fmt(inventoryValue)}), and equipment ({fmt(equipmentValue)}). The Balance Sheet equation (Assets = Liabilities + Equity) {isBalanced ? "is verified and in balance" : "shows a discrepancy requiring investigation"}.
            </MDASection>
            <MDASection title="Compliance & Tax">
              Weekly wealth taxes totaling {fmt(opexTax)} were remitted to the government per the DemocracyCraft Taxation Act. The company remains in good standing. All transactions have been reviewed and certified by the licensed IC Accountant.
            </MDASection>
            <MDASection title="Outlook">
              With foundational chest shop infrastructure in place and an initial contract secured, the company is positioned to pursue consistent retail revenue in March. Management is evaluating a bot-integrated API dashboard to automate transaction imports from the /db plugin.
            </MDASection>
            <div style={{ marginTop: 32, borderTop: "1px solid rgba(180,140,20,0.1)", paddingTop: 20 }}>
              <div style={{ color: "#5a6a5a", fontSize: 11, letterSpacing: 1 }}>Certified by latteralus — Licensed IC Accountant · February 2026</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, val, color, sub }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
      <div>
        <div style={{ color: "#8a9a8a", fontSize: 13 }}>{label}</div>
        {sub && <div style={{ color: "#3a4a3a", fontSize: 11 }}>{sub}</div>}
      </div>
      <div style={{ color: color || "#e8e0d0", fontSize: 13, fontWeight: "bold" }}>{val >= 0 ? fmt(val) : "-" + fmt(Math.abs(val))}</div>
    </div>
  );
}

function TotalRow({ label, val, color, large }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid rgba(180,140,20,0.2)", borderBottom: "1px solid rgba(180,140,20,0.2)", marginTop: 4 }}>
      <div style={{ color: "#e8e0d0", fontSize: large ? 15 : 13, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: color || "#c8a820", fontSize: large ? 18 : 14, fontWeight: "bold" }}>{val >= 0 ? fmt(val) : "-" + fmt(Math.abs(val))}</div>
    </div>
  );
}

function SectionHeader({ label }) {
  return <div style={{ color: "#c8a820", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10, marginTop: 4 }}>{label}</div>;
}

function MDASection({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ color: "#c8a820", fontSize: 13, fontWeight: "bold", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>{title}</div>
      <div style={{ color: "#8a9a8a", fontSize: 13, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}


function Inventory({ inventory, onInventoryUpdate }) {
  const [newItem, setNewItem] = useState({ name: "", quantity: "", value: "", category: "Input" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.name) return;
    setLoading(true);
    const { error } = await supabase.from('inventory').insert([{
      item_name: newItem.name,
      quantity: parseInt(newItem.quantity) || 0,
      est_value: parseFloat(newItem.value) || 0,
      category: newItem.category
    }]);
    if (error) {
      console.error(error);
      alert("Error adding item");
    } else {
      onInventoryUpdate();
      setNewItem({ name: "", quantity: "", value: "", category: "Input" });
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setLoading(true);
    const { error } = await supabase.from('inventory').update({
      item_name: editForm.name,
      quantity: parseInt(editForm.quantity) || 0,
      est_value: parseFloat(editForm.value) || 0,
      category: editForm.category,
      last_updated: new Date()
    }).eq('id', editingId);
    
    if (error) {
      console.error(error);
      alert("Error updating item");
    } else {
      onInventoryUpdate();
      setEditingId(null);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    setLoading(true);
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) {
      console.error(error);
      alert("Error deleting item");
    } else {
      onInventoryUpdate();
    }
    setLoading(false);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ name: item.item_name, quantity: item.quantity, value: item.est_value, category: item.category || "Input" });
  };

  const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * item.est_value), 0);
  const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,140,20,0.2)", borderRadius: 3, padding: "8px 12px", color: "#e8e0d0", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif" };

  const inputs = inventory.filter(i => i.category === 'Input' || !i.category).sort((a,b) => a.item_name.localeCompare(b.item_name));
  const outputs = inventory.filter(i => i.category === 'Output').sort((a,b) => a.item_name.localeCompare(b.item_name));
  const equipment = inventory.filter(i => i.category === 'Equipment').sort((a,b) => a.item_name.localeCompare(b.item_name));

  const renderTable = (items, title) => {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, paddingBottom: 4, borderBottom: "1px solid rgba(180,140,20,0.2)" }}>{title}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr 1fr 2fr 2fr 1fr", gap: 10, padding: "0 10px 10px", color: "#5a6a5a", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
            <div>Item Name</div>
            <div>Category</div>
            <div style={{ textAlign: "right" }}>Qty</div>
            <div style={{ textAlign: "right" }}>Unit Value</div>
            <div style={{ textAlign: "right" }}>Total</div>
            <div style={{ textAlign: "center" }}>Action</div>
          </div>

          {items.map(item => {
            const isEditing = editingId === item.id;
            const itemTotal = item.quantity * item.est_value;
            
            if (isEditing) {
              return (
                <div key={item.id} style={{ display: "grid", gridTemplateColumns: "3fr 2fr 1fr 2fr 2fr 1fr", gap: 10, alignItems: "center", background: "rgba(180,140,20,0.05)", padding: "10px", borderRadius: 3, marginBottom: 4 }}>
                  <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ ...inputStyle, width: "100%" }} />
                  <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} style={{ ...inputStyle, width: "100%" }}>
                    <option value="Input">Input</option>
                    <option value="Output">Output</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                  <input type="number" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: e.target.value})} style={{ ...inputStyle, width: "100%", textAlign: "right" }} />
                  <input type="number" step="0.01" value={editForm.value} onChange={e => setEditForm({...editForm, value: e.target.value})} style={{ ...inputStyle, width: "100%", textAlign: "right" }} />
                  <div style={{ textAlign: "right", color: "#8a9a8a", fontSize: 13 }}>-</div>
                  <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                    <button onClick={handleUpdate} disabled={loading} style={{ cursor: "pointer", background: "none", border: "none", color: "#50c860" }}>✓</button>
                    <button onClick={() => setEditingId(null)} style={{ cursor: "pointer", background: "none", border: "none", color: "#e05050" }}>✗</button>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "3fr 2fr 1fr 2fr 2fr 1fr", gap: 10, alignItems: "center", padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ color: "#e8e0d0", fontSize: 13 }}>{item.item_name}</div>
                <div style={{ color: "#8a9a8a", fontSize: 12 }}>{item.category || "Input"}</div>
                <div style={{ textAlign: "right", color: "#c8a820", fontSize: 13 }}>{item.quantity}</div>
                <div style={{ textAlign: "right", color: "#8a9a8a", fontSize: 12 }}>{fmt(item.est_value)}</div>
                <div style={{ textAlign: "right", color: "#50c860", fontSize: 13, fontWeight: "bold" }}>{fmt(itemTotal)}</div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={() => startEdit(item)} style={{ cursor: "pointer", background: "none", border: "none", color: "#8a9a8a", fontSize: 12 }}>✎</button>
                  <button onClick={() => handleDelete(item.id)} style={{ cursor: "pointer", background: "none", border: "none", color: "#e05050", fontSize: 12 }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#e8e0d0", fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>Inventory Management</div>
        <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 4 }}>Track raw materials and finished goods</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
             <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Current Stock</div>
             <div style={{ color: "#c8a820", fontSize: 14, fontWeight: "bold" }}>Total Value: {fmt(totalInventoryValue)}</div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {renderTable(inputs, "Inputs (Ingredients)")}
            {renderTable(outputs, "Outputs (Drinks / Elixirs)")}
            {renderTable(equipment, "Equipment")}
            {inventory.length === 0 && <div style={{ textAlign: "center", padding: 20, color: "#5a6a5a" }}>No inventory items found.</div>}
          </div>
        </div>

        <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "24px", height: "fit-content" }}>
          <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Add New Item</div>
          <form onSubmit={handleAdd}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Item Name</label>
              <input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} style={{ ...inputStyle, width: "100%" }} placeholder="e.g. Hops" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Category</label>
              <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} style={{ ...inputStyle, width: "100%" }}>
                <option value="Input">Input</option>
                <option value="Output">Output</option>
                <option value="Equipment">Equipment</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Quantity</label>
              <input type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} style={{ ...inputStyle, width: "100%" }} placeholder="0" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Est. Value ($)</label>
              <input type="number" step="0.01" value={newItem.value} onChange={e => setNewItem({...newItem, value: e.target.value})} style={{ ...inputStyle, width: "100%" }} placeholder="0.00" />
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", background: loading ? "rgba(180,140,20,0.3)" : "linear-gradient(135deg, #c8a820, #a08010)", border: "none", borderRadius: 3, padding: "11px", color: "#0d0a1a", fontSize: 12, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase", cursor: loading ? "default" : "pointer", fontFamily: "Georgia, serif" }}>
              {loading ? "Adding..." : "Add to Inventory"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Settings({ user, categories, onDataUpdate }) {
  const revenueCategories = categories.filter(c => c.type === 'Revenue').map(c => c.name);
  const expenseCategories = categories.filter(c => c.type === 'Expense').map(c => c.name);
  const otherCategories = categories.filter(c => c.type !== 'Revenue' && c.type !== 'Expense');

  const [pForm, setPForm] = useState({ current: "", new: "" });
  const [pMsg, setPMsg] = useState("");
  const [pLoading, setPLoading] = useState(false);

  const updatePassword = async (e) => {
    e.preventDefault();
    if (!pForm.current || !pForm.new) return;
    
    if (pForm.current !== user.password) {
      setPMsg("Error: Current password incorrect.");
      return;
    }

    setPLoading(true);
    const { error } = await supabase.from('accounts').update({ password: pForm.new }).eq('id', user.id);
    
    if (error) {
      console.error(error);
      setPMsg("Error updating password.");
    } else {
      setPMsg("Success: Password updated!");
      setPForm({ current: "", new: "" });
      if (onDataUpdate) onDataUpdate();
      setTimeout(() => setPMsg(""), 3000);
    }
    setPLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#e8e0d0", fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>Settings</div>
        <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 4 }}>Company configuration and chart of accounts</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "24px" }}>
            <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Company Info</div>
            {[
              { k: "Company Name", v: "Green Bastards" },
              { k: "DemocracyCraft Firm ID", v: "/firm GB" },
              { k: "Licensed Accountant", v: "ILatteralus (IC)" },
              { k: "Fiscal Period", v: "Monthly" },
              { k: "Jurisdiction", v: "DemocracyCraft" },
              { 
                k: "Reporting Standard", 
                v: (
                  <div style={{ textAlign: "right" }}>
                    <a href="https://www.democracycraft.net/threads/accounting-reform-act.32101/" target="_blank" rel="noopener noreferrer" style={{ color: "#c8a820", textDecoration: "underline" }}>
                      Accounting Reform Act 2025
                    </a>
                    <br />
                    <a href="https://www.democracycraft.net/threads/taxation-act.4691/" target="_blank" rel="noopener noreferrer" style={{ color: "#c8a820", textDecoration: "underline" }}>
                      Taxation Act
                    </a>
                  </div>
                )
              }
            ].map(({ k, v }) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color: "#5a6a5a", fontSize: 12 }}>{k}</span>
                <span style={{ color: "#c8a820", fontSize: 12 }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "24px" }}>
            <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>User Security</div>
            <form onSubmit={updatePassword}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Current Password</label>
                <input type="password" value={pForm.current} onChange={e => setPForm(f => ({ ...f, current: e.target.value }))} 
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,140,20,0.2)", borderRadius: 3, padding: "9px 12px", color: "#e8e0d0", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif" }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>New Password</label>
                <input type="password" value={pForm.new} onChange={e => setPForm(f => ({ ...f, new: e.target.value }))} 
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,140,20,0.2)", borderRadius: 3, padding: "9px 12px", color: "#e8e0d0", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif" }} />
              </div>
              {pMsg && <div style={{ color: pMsg.startsWith("Success") ? "#50c860" : "#e05050", fontSize: 12, marginBottom: 12, textAlign: "center" }}>{pMsg}</div>}
              <button type="submit" disabled={pLoading} 
                style={{ width: "100%", background: pLoading ? "rgba(180,140,20,0.3)" : "linear-gradient(135deg, #c8a820, #a08010)", border: "none", borderRadius: 3, padding: "10px", color: "#0d0a1a", fontSize: 12, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase", cursor: pLoading ? "default" : "pointer", fontFamily: "Georgia, serif" }}>
                {pLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>

        <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "24px" }}>
          <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Chart of Accounts</div>
          <div style={{ color: "#5a6a5a", fontSize: 12, marginBottom: 14 }}>Revenue Categories</div>
          {revenueCategories.map(c => (
            <div key={c} style={{ color: "#50c860", fontSize: 13, padding: "4px 0" }}>↑ {c}</div>
          ))}
          <div style={{ color: "#5a6a5a", fontSize: 12, marginTop: 14, marginBottom: 14 }}>Expense Categories</div>
          {expenseCategories.map(c => (
            <div key={c} style={{ color: "#e05050", fontSize: 13, padding: "4px 0" }}>↓ {c}</div>
          ))}
           <div style={{ color: "#5a6a5a", fontSize: 12, marginTop: 14, marginBottom: 14 }}>Other (Assets/Liabilities/Equity)</div>
          {otherCategories.map(c => (
            <div key={c.name} style={{ color: "#3498db", fontSize: 13, padding: "4px 0" }}>• {c.name} ({c.type})</div>
          ))}

          {user.role === "CFO" && (
            <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(180,140,20,0.06)", border: "1px dashed rgba(180,140,20,0.2)", borderRadius: 3, color: "#5a6a5a", fontSize: 12 }}>
              + Add custom categories (backend required for persistence)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      return null;
    }
  });
  const [active, setActive] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, catRes, accRes, invRes, loanRes] = await Promise.all([
        supabase.from('transactions').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('accounts').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('loans').select('*')
      ]);

      if (txRes.error) throw txRes.error;
      if (catRes.error) throw catRes.error;
      if (accRes.error) throw accRes.error;
      if (invRes.error) throw invRes.error;
      if (loanRes.error) throw loanRes.error;

      // Transform transactions to match app schema (camelCase)
      const formattedTransactions = txRes.data.map(t => ({
        ...t,
        submittedBy: t.submitted_by,
        approvedBy: t.approved_by
      }));

      setTransactions(formattedTransactions);
      setCategories(catRes.data);
      setAccounts(accRes.data);
      setInventory(invRes.data);
      setLoans(loanRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransactionUpdate = () => {
    fetchData(); // Simplest way to keep everything in sync
  };

  if (loading && !user) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0a1a", color: "#c8a820" }}>Loading Brewery Data...</div>;

  if (!user) return <LoginScreen onLogin={setUser} accounts={accounts} />;

  const pendingCount = transactions.filter(t => t.status === "Pending").length;
  const pageStyle = { marginLeft: 220, minHeight: "100vh", background: "linear-gradient(160deg, #0d0a1a 0%, #111820 100%)", padding: "36px 40px", fontFamily: "Georgia, serif" };

  return (
    <div style={{ background: "#0a0714", minHeight: "100vh" }}>
      <Sidebar active={active} setActive={setActive} user={user} onLogout={() => { 
        localStorage.removeItem("user");
        setUser(null); 
        setActive("dashboard"); 
      }} pendingCount={pendingCount} />
      <div style={pageStyle}>
        {active === "dashboard" && <Dashboard transactions={transactions} categories={categories} />}
        {active === "transactions" && <Transactions transactions={transactions} onTransactionUpdate={handleTransactionUpdate} user={user} categories={categories} loans={loans} />}
        {active === "inventory" && <Inventory inventory={inventory} onInventoryUpdate={handleTransactionUpdate} />}
        {active === "loans" && <Loans transactions={transactions} loans={loans} />}
        {active === "audit" && user.role === "CFO" && <AuditCenter transactions={transactions} onTransactionUpdate={handleTransactionUpdate} user={user} categories={categories} />}
        {active === "reports" && <Reports transactions={transactions} inventory={inventory} categories={categories} />}
        {active === "settings" && <Settings user={user} categories={categories} onDataUpdate={handleTransactionUpdate} />}
      </div>
    </div>
  );
}
