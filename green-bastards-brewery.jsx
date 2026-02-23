import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const USERS = [
  { id: 1, username: "Ilatteralus", password: "cfo1239", role: "CFO", displayName: "Ilatteralus" },
  { id: 2, username: "BALLs321", password: "exec1239", role: "CEO", displayName: "BALLs321" },
  { id: 3, username: "exec2", password: "exec123", role: "Executive", displayName: "HopHead_J" },
];

const CATEGORIES = [
  "Hops", "Malt", "Barley", "Yeast", "Bottles", "Barrels",
  "Payroll", "Rent", "Utilities", "Equipment", "Tax",
  "Sales Revenue", "Contract Revenue", "Investment", "Miscellaneous"
];

const INITIAL_TRANSACTIONS = [
  { id: 1, date: "2026-02-01", type: "Credit", category: "Investment", amount: 5000, memo: "Initial founder capital injection", submittedBy: "latteralus", status: "Approved", approvedBy: "latteralus" },
  { id: 2, date: "2026-02-03", type: "Debit", category: "Hops", amount: 320, memo: "64x Hops from marketplace", submittedBy: "BrewMaster_K", status: "Approved", approvedBy: "latteralus" },
  { id: 3, date: "2026-02-05", type: "Credit", category: "Sales Revenue", amount: 1200, memo: "Chest shop sales - Feb week 1", submittedBy: "latteralus", status: "Approved", approvedBy: "latteralus" },
  { id: 4, date: "2026-02-08", type: "Debit", category: "Rent", amount: 500, memo: "Commercial plot rent - Region c047", submittedBy: "latteralus", status: "Approved", approvedBy: "latteralus" },
  { id: 5, date: "2026-02-10", type: "Debit", category: "Payroll", amount: 800, memo: "Brewer wages - 2 brewers, 8hr shifts", submittedBy: "latteralus", status: "Approved", approvedBy: "latteralus" },
  { id: 6, date: "2026-02-12", type: "Credit", category: "Sales Revenue", amount: 1850, memo: "Chest shop sales - Feb week 2", submittedBy: "HopHead_J", status: "Approved", approvedBy: "latteralus" },
  { id: 7, date: "2026-02-15", type: "Debit", category: "Malt", amount: 210, memo: "32x Malt bags from supplier", submittedBy: "BrewMaster_K", status: "Approved", approvedBy: "latteralus" },
  { id: 8, date: "2026-02-17", type: "Debit", category: "Bottles", amount: 150, memo: "128x Glass bottles", submittedBy: "BrewMaster_K", status: "Approved", approvedBy: "latteralus" },
  { id: 9, date: "2026-02-19", type: "Credit", category: "Contract Revenue", amount: 2200, memo: "Mayor's Gala supply contract", submittedBy: "latteralus", status: "Approved", approvedBy: "latteralus" },
  { id: 10, date: "2026-02-20", type: "Debit", category: "Tax", amount: 87.35, memo: "Weekly wealth tax - /db balance bracket", submittedBy: "latteralus", status: "Approved", approvedBy: "latteralus" },
  { id: 11, date: "2026-02-21", type: "Debit", category: "Hops", amount: 480, memo: "96x Hops - restocking for Mayor contract", submittedBy: "BrewMaster_K", status: "Pending", approvedBy: null },
  { id: 12, date: "2026-02-21", type: "Debit", category: "Payroll", amount: 900, memo: "Brewer wages - extra shift for gala batch", submittedBy: "HopHead_J", status: "Pending", approvedBy: null },
  { id: 13, date: "2026-02-22", type: "Credit", category: "Sales Revenue", amount: 650, memo: "Chest shop sales - Feb week 3 partial", submittedBy: "HopHead_J", status: "Pending", approvedBy: null },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function buildChartData(transactions) {
  const approved = transactions.filter(t => t.status === "Approved").sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  const byDate = {};
  approved.forEach(t => {
    running += t.type === "Credit" ? t.amount : -t.amount;
    byDate[t.date] = running;
  });
  return Object.entries(byDate).map(([date, balance]) => ({
    date: date.slice(5),
    balance: parseFloat(balance.toFixed(2))
  }));
}

function calcSummary(transactions) {
  const approved = transactions.filter(t => t.status === "Approved");
  const revenue = approved.filter(t => t.type === "Credit").reduce((s, t) => s + t.amount, 0);
  const expenses = approved.filter(t => t.type === "Debit").reduce((s, t) => s + t.amount, 0);
  const balance = revenue - expenses;
  const pending = transactions.filter(t => t.status === "Pending").length;
  return { revenue, expenses, balance, pending };
}

function fmt(n) {
  return "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const user = USERS.find(u => u.username === username && u.password === password);
      if (user) { onLogin(user); }
      else { setError("Invalid credentials. Check username and password."); setLoading(false); }
    }, 700);
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

        <div style={{ marginTop: 28, borderTop: "1px solid rgba(180,140,20,0.1)", paddingTop: 20 }}>
          <div style={{ color: "#5a6a5a", fontSize: 11, textAlign: "center", marginBottom: 10, letterSpacing: 1 }}>DEMO CREDENTIALS</div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, background: "rgba(180,140,20,0.06)", borderRadius: 3, padding: "8px 10px", border: "1px solid rgba(180,140,20,0.1)" }}>
              <div style={{ color: "#c8a820", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>CFO</div>
              <div style={{ color: "#8a9a8a", fontSize: 11 }}>latteralus / cfo123</div>
            </div>
            <div style={{ flex: 1, background: "rgba(40,100,50,0.06)", borderRadius: 3, padding: "8px 10px", border: "1px solid rgba(40,140,60,0.1)" }}>
              <div style={{ color: "#50c860", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>Executive</div>
              <div style={{ color: "#8a9a8a", fontSize: 11 }}>exec1 / exec123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ active, setActive, user, onLogout }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "◈" },
    { id: "transactions", label: "Transactions", icon: "⟳" },
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
              {item.id === "audit" && <span style={{ marginLeft: "auto", background: "#c8a820", color: "#0d0a1a", fontSize: 10, fontWeight: "bold", borderRadius: 10, padding: "1px 6px" }}>3</span>}
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

function Dashboard({ transactions, user }) {
  const chartData = buildChartData(transactions);
  const { revenue, expenses, balance, pending } = calcSummary(transactions);

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

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#e8e0d0", fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>Financial Overview</div>
        <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 4 }}>February 2026 · DemocracyCraft Fiscal Period</div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <StatCard label="Treasury Balance" value={fmt(balance)} sub="Approved transactions only" accent="#c8a820" />
        <StatCard label="Total Revenue" value={fmt(revenue)} sub="Credits this period" accent="#50c860" />
        <StatCard label="Total Expenses" value={fmt(expenses)} sub="Debits this period" accent="#e05050" />
        <StatCard label="Pending Audit" value={pending} sub="Awaiting CFO approval" accent="#e09030" />
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

function Transactions({ transactions, setTransactions, user }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), type: "Debit", category: CATEGORIES[0], amount: "", memo: "" });
  const [filter, setFilter] = useState("All");
  const [submitted, setSubmitted] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(parseFloat(form.amount))) return;
    const newT = {
      id: Date.now(),
      ...form,
      amount: parseFloat(form.amount),
      submittedBy: user.displayName,
      status: user.role === "CFO" ? "Approved" : "Pending",
      approvedBy: user.role === "CFO" ? user.displayName : null
    };
    setTransactions(prev => [...prev, newT]);
    setForm({ date: new Date().toISOString().slice(0, 10), type: "Debit", category: CATEGORIES[0], amount: "", memo: "" });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
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
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Amount ($)</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} placeholder="0.00" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Memo</label>
              <input value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} style={inputStyle} placeholder="e.g. /db withdraw 500 - Hops restock" />
            </div>
            <button type="submit" style={{ width: "100%", background: "linear-gradient(135deg, #c8a820, #a08010)", border: "none", borderRadius: 3, padding: "11px", color: "#0d0a1a", fontSize: 12, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", fontFamily: "Georgia, serif" }}>
              {submitted ? "✓ Submitted!" : "Submit Voucher"}
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

function AuditCenter({ transactions, setTransactions, user }) {
  const pending = transactions.filter(t => t.status === "Pending");
  const [note, setNote] = useState({});

  const approve = (id) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: "Approved", approvedBy: user.displayName } : t));
  };
  const reject = (id) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: "Rejected", approvedBy: user.displayName } : t));
  };

  const { revenue, expenses, balance } = calcSummary(transactions);
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
                  <button onClick={() => approve(t.id)}
                    style={{ background: "rgba(40,120,50,0.2)", border: "1px solid rgba(40,120,50,0.4)", borderRadius: 3, padding: "8px 20px", color: "#50c860", fontSize: 12, cursor: "pointer", fontWeight: "bold", letterSpacing: 1, fontFamily: "Georgia, serif" }}>
                    ✓ APPROVE
                  </button>
                  <button onClick={() => reject(t.id)}
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

function Reports({ transactions }) {
  const approved = transactions.filter(t => t.status === "Approved");
  const revenue = approved.filter(t => t.type === "Credit").reduce((s, t) => s + t.amount, 0);
  const expenses = approved.filter(t => t.type === "Debit").reduce((s, t) => s + t.amount, 0);
  const netIncome = revenue - expenses;

  const byCategory = {};
  approved.forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = { credits: 0, debits: 0 };
    if (t.type === "Credit") byCategory[t.category].credits += t.amount;
    else byCategory[t.category].debits += t.amount;
  });

  const cogs = (byCategory["Hops"]?.debits || 0) + (byCategory["Malt"]?.debits || 0) + (byCategory["Barley"]?.debits || 0) + (byCategory["Yeast"]?.debits || 0) + (byCategory["Bottles"]?.debits || 0) + (byCategory["Barrels"]?.debits || 0);
  const operatingExpenses = expenses - cogs;
  const grossProfit = revenue - cogs;

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
            <Row label="Sales Revenue" val={byCategory["Sales Revenue"]?.credits || 0} color="#50c860" />
            <Row label="Contract Revenue" val={byCategory["Contract Revenue"]?.credits || 0} color="#50c860" />
            <Row label="Investment / Other Income" val={(byCategory["Investment"]?.credits || 0) + (byCategory["Miscellaneous"]?.credits || 0)} color="#50c860" />
            <TotalRow label="TOTAL REVENUE" val={revenue} color="#50c860" />
            <div style={{ height: 16 }} />
            <Row label="Cost of Goods Sold (COGS)" val={-cogs} color="#e05050" sub="Hops, Malt, Barley, Yeast, Bottles, Barrels" />
            <TotalRow label="GROSS PROFIT" val={grossProfit} color={grossProfit >= 0 ? "#50c860" : "#e05050"} />
            <div style={{ height: 16 }} />
            <Row label="Payroll" val={-(byCategory["Payroll"]?.debits || 0)} color="#e05050" />
            <Row label="Rent" val={-(byCategory["Rent"]?.debits || 0)} color="#e05050" />
            <Row label="Utilities / Equipment" val={-((byCategory["Utilities"]?.debits || 0) + (byCategory["Equipment"]?.debits || 0))} color="#e05050" />
            <Row label="Tax" val={-(byCategory["Tax"]?.debits || 0)} color="#e05050" />
            <Row label="Miscellaneous Expenses" val={-(byCategory["Miscellaneous"]?.debits || 0)} color="#e05050" />
            <div style={{ height: 8 }} />
            <TotalRow label="NET INCOME" val={netIncome} color={netIncome >= 0 ? "#c8a820" : "#e05050"} large />
          </div>
        )}

        {active === "balance" && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ textAlign: "center", marginBottom: 32, borderBottom: "1px solid rgba(180,140,20,0.2)", paddingBottom: 20 }}>
              <div style={{ color: "#c8a820", fontSize: 18, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase" }}>Green Bastards Brewery</div>
              <div style={{ color: "#8a9a8a", fontSize: 13, marginTop: 4 }}>Balance Sheet · February 22, 2026</div>
            </div>
            <SectionHeader label="ASSETS" />
            <Row label="Cash (/db Balance)" val={revenue - expenses} color="#50c860" />
            <Row label="Inventory (est. market value)" val={850} color="#50c860" sub="Finished goods on hand" />
            <Row label="Equipment & Fixtures" val={1200} color="#50c860" sub="Brewing stands, barrels (est.)" />
            <TotalRow label="TOTAL ASSETS" val={(revenue - expenses) + 850 + 1200} color="#50c860" />
            <div style={{ height: 20 }} />
            <SectionHeader label="LIABILITIES" />
            <Row label="Accounts Payable" val={0} color="#e05050" sub="No outstanding debts" />
            <TotalRow label="TOTAL LIABILITIES" val={0} color="#e05050" />
            <div style={{ height: 20 }} />
            <SectionHeader label="OWNER'S EQUITY" />
            <Row label="Founder Capital" val={5000} color="#c8a820" />
            <Row label="Retained Earnings" val={netIncome - 5000 + (revenue - expenses)} color="#c8a820" />
            <TotalRow label="TOTAL EQUITY" val={(revenue - expenses) + 850 + 1200} color="#c8a820" large />
          </div>
        )}

        {active === "equity" && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ textAlign: "center", marginBottom: 32, borderBottom: "1px solid rgba(180,140,20,0.2)", paddingBottom: 20 }}>
              <div style={{ color: "#c8a820", fontSize: 18, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase" }}>Green Bastards Brewery</div>
              <div style={{ color: "#8a9a8a", fontSize: 13, marginTop: 4 }}>Statement of Owner's Equity · February 2026</div>
            </div>
            <Row label="Beginning Equity (Jan 2026)" val={0} color="#c8a820" />
            <Row label="Capital Contributions" val={5000} color="#50c860" />
            <Row label="Net Income This Period" val={netIncome} color={netIncome >= 0 ? "#50c860" : "#e05050"} />
            <Row label="Owner Withdrawals" val={0} color="#e05050" />
            <TotalRow label="ENDING OWNER'S EQUITY" val={5000 + netIncome} color="#c8a820" large />
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
            <MDASection title="Revenue Performance">
              Total revenue for February 2026 reached {fmt(revenue)}, driven by chest shop sales ({fmt(byCategory["Sales Revenue"]?.credits || 0)}) and the Mayor's Gala supply contract ({fmt(byCategory["Contract Revenue"]?.credits || 0)}). The Gala contract represents a significant one-time revenue event that meaningfully accelerated our launch trajectory.
            </MDASection>
            <MDASection title="Expense Analysis">
              Cost of Goods Sold totaled {fmt(cogs)}, yielding a gross margin of {revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : "0"}%. Payroll was our largest operating expense at {fmt(byCategory["Payroll"]?.debits || 0)}, reflecting the accelerated production schedule required for the Gala contract.
            </MDASection>
            <MDASection title="Compliance & Tax">
              Weekly wealth taxes totaling {fmt(byCategory["Tax"]?.debits || 0)} were remitted to the government per the DemocracyCraft Taxation Act. The company remains in good standing. All transactions have been reviewed and certified by the licensed IC Accountant.
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

function Settings({ user }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#e8e0d0", fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>Settings</div>
        <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 4 }}>Company configuration and chart of accounts</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "24px" }}>
          <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Company Info</div>
          {[["Company Name", "Green Bastards Brewery"], ["DemocracyCraft Firm ID", "/firm GBB"], ["Licensed Accountant", "latteralus (IC)"], ["Fiscal Period", "Monthly"], ["Jurisdiction", "DemocracyCraft"], ["Reporting Standard", "Accounting Reform Act 2025"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ color: "#5a6a5a", fontSize: 12 }}>{k}</span>
              <span style={{ color: "#c8a820", fontSize: 12 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "24px" }}>
          <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Chart of Accounts</div>
          <div style={{ color: "#5a6a5a", fontSize: 12, marginBottom: 14 }}>Revenue Categories</div>
          {["Sales Revenue", "Contract Revenue", "Investment", "Miscellaneous"].map(c => (
            <div key={c} style={{ color: "#50c860", fontSize: 13, padding: "4px 0" }}>↑ {c}</div>
          ))}
          <div style={{ color: "#5a6a5a", fontSize: 12, marginTop: 14, marginBottom: 14 }}>Expense Categories</div>
          {["Hops", "Malt", "Barley", "Yeast", "Bottles", "Barrels", "Payroll", "Rent", "Utilities", "Equipment", "Tax"].map(c => (
            <div key={c} style={{ color: "#e05050", fontSize: 13, padding: "4px 0" }}>↓ {c}</div>
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
  const [user, setUser] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);

  if (!user) return <LoginScreen onLogin={setUser} />;

  const pageStyle = { marginLeft: 220, minHeight: "100vh", background: "linear-gradient(160deg, #0d0a1a 0%, #111820 100%)", padding: "36px 40px", fontFamily: "Georgia, serif" };

  return (
    <div style={{ background: "#0a0714", minHeight: "100vh" }}>
      <Sidebar active={active} setActive={setActive} user={user} onLogout={() => { setUser(null); setActive("dashboard"); }} />
      <div style={pageStyle}>
        {active === "dashboard" && <Dashboard transactions={transactions} user={user} />}
        {active === "transactions" && <Transactions transactions={transactions} setTransactions={setTransactions} user={user} />}
        {active === "audit" && user.role === "CFO" && <AuditCenter transactions={transactions} setTransactions={setTransactions} user={user} />}
        {active === "reports" && <Reports transactions={transactions} />}
        {active === "settings" && <Settings user={user} />}
      </div>
    </div>
  );
}
