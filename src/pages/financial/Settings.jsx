import { useState } from "react";
import { supabase } from "../../supabaseClient.js";

export default function Settings({ user, categories, onDataUpdate }) {
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
