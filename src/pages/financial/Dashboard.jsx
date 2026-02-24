import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { buildChartData, calcSummary, calcSavingsBalance, calcLoanLiability, fmt } from "../../helpers.js";
import StatCard from "../../components/shared/StatCard.jsx";
import CustomTooltip from "../../components/shared/CustomTooltip.jsx";

export default function Dashboard({ transactions, categories, loans }) {
  const chartData = buildChartData(transactions);
  const { revenue, expenses, balance, pending } = calcSummary(transactions, categories);
  const savings = calcSavingsBalance(transactions);
  const loanLiability = calcLoanLiability(transactions, loans);

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
