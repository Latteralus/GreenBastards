import { supabase } from "../../supabaseClient.js";
import { fmt, calcSummary } from "../../helpers.js";

export default function AuditCenter({ transactions, onTransactionUpdate, user, categories }) {
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
