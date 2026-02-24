import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { fmt } from "../../helpers";

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(180,140,20,0.2)",
  borderRadius: 3,
  padding: "9px 12px",
  color: "#e8e0d0",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "Georgia, serif"
};

const btnStyle = {
  background: "linear-gradient(135deg, #c8a820, #a08010)",
  color: "#0d0a1a",
  fontWeight: "bold",
  textTransform: "uppercase",
  border: "none",
  borderRadius: 3,
  padding: "8px 16px",
  cursor: "pointer",
  fontFamily: "Georgia, serif",
  fontSize: 12,
  letterSpacing: 1
};

export default function EmployeeProfile({ user, employeeId, onBack }) {
  const [employee, setEmployee] = useState(null);
  const [paystubs, setPaystubs] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  
  const [contractChecked, setContractChecked] = useState(false);
  const [signing, setSigning] = useState(false);
  
  const [showManualPaystub, setShowManualPaystub] = useState(false);
  const [paystubForm, setPaystubForm] = useState({
    pay_period_start: new Date().toISOString().slice(0, 10),
    pay_period_end: new Date().toISOString().slice(0, 10),
    hours_worked: "",
    hourly_rate: "",
    gross_pay: "",
    notes: ""
  });
  const [submittingPaystub, setSubmittingPaystub] = useState(false);

  const isOwner = user.id === employeeId;
  const isManager = ["Manager", "CEO", "CFO"].includes(user.role || user.position);

  const fetchData = async () => {
    setLoading(true);
    const [empRes, stubRes] = await Promise.all([
      supabase.from("accounts").select("*").eq("id", employeeId).single(),
      supabase.from("paystubs").select("*").eq("account_id", employeeId).order("created_at", { ascending: false })
    ]);
    
    if (empRes.error) console.error("Error fetching employee:", empRes.error);
    else setEmployee(empRes.data);
    
    if (stubRes.error) console.error("Error fetching paystubs:", stubRes.error);
    else setPaystubs(stubRes.data || []);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const handleSignContract = async () => {
    if (!contractChecked) return;
    setSigning(true);
    const { error } = await supabase.from("accounts").update({
      contract_agreed: true,
      contract_agreed_at: new Date().toISOString()
    }).eq("id", employeeId);
    
    if (error) {
      console.error("Error signing contract:", error);
      alert("Failed to sign contract");
    } else {
      fetchData();
    }
    setSigning(false);
  };

  const handlePaystubSubmit = async (e) => {
    e.preventDefault();
    setSubmittingPaystub(true);
    const { error } = await supabase.from("paystubs").insert([{
      account_id: employeeId,
      pay_period_start: paystubForm.pay_period_start,
      pay_period_end: paystubForm.pay_period_end,
      hours_worked: parseFloat(paystubForm.hours_worked) || null,
      hourly_rate: parseFloat(paystubForm.hourly_rate) || null,
      gross_pay: parseFloat(paystubForm.gross_pay) || 0,
      notes: paystubForm.notes || "Manual Entry"
    }]);

    if (error) {
      console.error("Error adding paystub:", error);
      alert("Failed to add paystub");
    } else {
      setShowManualPaystub(false);
      setPaystubForm({
        pay_period_start: new Date().toISOString().slice(0, 10),
        pay_period_end: new Date().toISOString().slice(0, 10),
        hours_worked: "", hourly_rate: "", gross_pay: "", notes: ""
      });
      fetchData();
    }
    setSubmittingPaystub(false);
  };

  if (loading || !employee) {
    return <div style={{ color: "#5a6a5a", padding: "40px", textAlign: "center" }}>Loading profile...</div>;
  }

  const totalAllTime = paystubs.reduce((sum, p) => sum + (parseFloat(p.gross_pay) || 0), 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const totalThisMonth = paystubs.reduce((sum, p) => {
    const d = new Date(p.created_at);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      return sum + (parseFloat(p.gross_pay) || 0);
    }
    return sum;
  }, 0);

  return (
    <div style={{ color: "#e8e0d0" }}>
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: "#8a9a8a", cursor: "pointer", fontFamily: "Georgia, serif", padding: 0, marginBottom: 20 }}>
        ← Back
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>{employee.ic_name || employee.username}</div>
          <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 4 }}>{employee.position} · {employee.status}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, borderBottom: "1px solid rgba(180,140,20,0.2)", paddingBottom: 10 }}>
        <button onClick={() => setActiveTab("profile")} style={{ background: "transparent", border: "none", color: activeTab === "profile" ? "#c8a820" : "#8a9a8a", fontWeight: activeTab === "profile" ? "bold" : "normal", cursor: "pointer", fontFamily: "Georgia, serif", padding: "8px 16px" }}>Profile & Contract</button>
        <button onClick={() => setActiveTab("paystubs")} style={{ background: "transparent", border: "none", color: activeTab === "paystubs" ? "#c8a820" : "#8a9a8a", fontWeight: activeTab === "paystubs" ? "bold" : "normal", cursor: "pointer", fontFamily: "Georgia, serif", padding: "8px 16px" }}>Pay History</button>
      </div>

      {activeTab === "profile" && (
        <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: 32, fontFamily: "monospace" }}>
          <div style={{ color: "#c8a820", fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>GREEN BASTARDS BREWERY</div>
          <div style={{ color: "#5a6a5a", marginBottom: 16 }}>─────────────────────────────────────</div>
          <div style={{ color: "#e8e0d0", fontSize: 16, fontWeight: "bold", marginBottom: 16 }}>EMPLOYMENT CONTRACT</div>
          <div style={{ color: "#5a6a5a", marginBottom: 16 }}>─────────────────────────────────────</div>
          
          <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 8, fontSize: 13, marginBottom: 16, color: "#8a9a8a" }}>
            <div>IC Name:</div><div style={{ color: "#e8e0d0" }}>{employee.ic_name || employee.username}</div>
            <div>Discord:</div><div style={{ color: "#e8e0d0" }}>{employee.discord_username || "—"}</div>
            <div>Role:</div><div style={{ color: "#e8e0d0" }}>{employee.position}</div>
            <div>Hire Date:</div><div style={{ color: "#e8e0d0" }}>{employee.hire_date}</div>
            <div>Wage:</div><div style={{ color: "#e8e0d0" }}>{fmt(employee.wage)} / {employee.wage_type}</div>
            <div>Status:</div><div style={{ color: employee.status === "Active" ? "#50c860" : "#e05050" }}>{employee.status}</div>
          </div>
          
          <div style={{ color: "#5a6a5a", marginBottom: 16 }}>─────────────────────────────────────</div>
          <div style={{ color: "#e8e0d0", fontSize: 14, fontWeight: "bold", marginBottom: 12 }}>TERMS & CONDITIONS:</div>
          <div style={{ color: "#8a9a8a", fontSize: 13, whiteSpace: "pre-wrap", marginBottom: 20 }}>{employee.contract_text || "No contract terms specified."}</div>
          <div style={{ color: "#5a6a5a", marginBottom: 20 }}>─────────────────────────────────────</div>

          {employee.contract_agreed ? (
            <div style={{ color: "#50c860", fontWeight: "bold" }}>✓ Signed on {new Date(employee.contract_agreed_at).toLocaleDateString()}</div>
          ) : (
            <div>
              {isOwner ? (
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 16, color: "#8a9a8a", fontSize: 13 }}>
                    <input type="checkbox" checked={contractChecked} onChange={e => setContractChecked(e.target.checked)} />
                    I have read and agree to the terms of this employment contract
                  </label>
                  <button onClick={handleSignContract} disabled={!contractChecked || signing} style={{ ...btnStyle, opacity: (!contractChecked || signing) ? 0.6 : 1 }}>
                    {signing ? "Signing..." : "Sign Contract"}
                  </button>
                  {employee.contract_agreed && <div style={{ color: "#50c860", marginTop: 12, fontSize: 13 }}>Contract signed. Welcome to Green Bastards Brewery.</div>}
                </div>
              ) : (
                <div style={{ color: "#e09030", fontWeight: "bold" }}>Awaiting employee signature</div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "paystubs" && (
        <div>
          {isManager && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <button onClick={() => setShowManualPaystub(!showManualPaystub)} style={{ background: "transparent", border: "1px solid rgba(180,140,20,0.4)", color: "#c8a820", borderRadius: 3, padding: "6px 12px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 11 }}>
                {showManualPaystub ? "Cancel" : "Record Manual Paystub"}
              </button>
            </div>
          )}

          {showManualPaystub && (
            <div style={{ background: "rgba(15,10,30,0.8)", border: "1px dashed rgba(180,140,20,0.3)", borderRadius: 4, padding: 24, marginBottom: 24 }}>
              <h3 style={{ color: "#c8a820", marginTop: 0, fontSize: 14, textTransform: "uppercase" }}>Manual Paystub Entry</h3>
              <form onSubmit={handlePaystubSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4 }}>Period Start</label>
                  <input type="date" required value={paystubForm.pay_period_start} onChange={e => setPaystubForm({...paystubForm, pay_period_start: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4 }}>Period End</label>
                  <input type="date" required value={paystubForm.pay_period_end} onChange={e => setPaystubForm({...paystubForm, pay_period_end: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4 }}>Hours Worked</label>
                  <input type="number" step="0.01" value={paystubForm.hours_worked} onChange={e => setPaystubForm({...paystubForm, hours_worked: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4 }}>Hourly Rate / Wage</label>
                  <input type="number" step="0.01" value={paystubForm.hourly_rate} onChange={e => setPaystubForm({...paystubForm, hourly_rate: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4 }}>Gross Pay ($)</label>
                  <input type="number" step="0.01" required value={paystubForm.gross_pay} onChange={e => setPaystubForm({...paystubForm, gross_pay: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4 }}>Notes</label>
                  <input value={paystubForm.notes} onChange={e => setPaystubForm({...paystubForm, notes: e.target.value})} style={inputStyle} placeholder="Bonus, Correction, etc." />
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" disabled={submittingPaystub} style={btnStyle}>{submittingPaystub ? "Saving..." : "Save Paystub"}</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "#8a9a8a", borderBottom: "1px solid rgba(180,140,20,0.2)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px" }}>Pay Period</th>
                  <th style={{ padding: "12px 16px" }}>Hours Worked</th>
                  <th style={{ padding: "12px 16px" }}>Rate</th>
                  <th style={{ padding: "12px 16px" }}>Gross Pay</th>
                  <th style={{ padding: "12px 16px" }}>Notes</th>
                  <th style={{ padding: "12px 16px" }}>Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {paystubs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "30px", textAlign: "center", color: "#5a6a5a" }}>No pay history found.</td>
                  </tr>
                ) : (
                  paystubs.map(p => (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "12px 16px" }}>{p.pay_period_start} — {p.pay_period_end}</td>
                      <td style={{ padding: "12px 16px" }}>{p.hours_worked ? p.hours_worked : "—"}</td>
                      <td style={{ padding: "12px 16px" }}>{p.hourly_rate ? fmt(p.hourly_rate) : "—"}</td>
                      <td style={{ padding: "12px 16px", color: "#50c860", fontWeight: "bold" }}>{fmt(p.gross_pay)}</td>
                      <td style={{ padding: "12px 16px", color: "#8a9a8a" }}>{p.notes || "—"}</td>
                      <td style={{ padding: "12px 16px", color: "#5a6a5a", fontSize: 11, fontFamily: "monospace" }}>{p.transaction_id ? `#${p.transaction_id.slice(0,8)}` : "Manual"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            <div style={{ borderTop: "1px solid rgba(180,140,20,0.2)", padding: "16px", display: "flex", gap: 32, justifyContent: "flex-end" }}>
              <div>
                <div style={{ color: "#8a9a8a", fontSize: 11, textTransform: "uppercase" }}>Total Earned (This Month)</div>
                <div style={{ color: "#e8e0d0", fontSize: 18, fontWeight: "bold" }}>{fmt(totalThisMonth)}</div>
              </div>
              <div>
                <div style={{ color: "#8a9a8a", fontSize: 11, textTransform: "uppercase" }}>Total Earned (All Time)</div>
                <div style={{ color: "#c8a820", fontSize: 18, fontWeight: "bold" }}>{fmt(totalAllTime)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
