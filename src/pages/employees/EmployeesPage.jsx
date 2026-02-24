import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { fmt } from "../../helpers";

const ROLE_COLORS = {
  Brewer: "#4a4a6a",
  Manager: "#1a4a7a",
  CEO: "#4a1a7a",
  CFO: "#c8a820"
};

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

export default function EmployeesPage({ user, onViewProfile }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  // Add Employee Form State
  const [form, setForm] = useState({
    full_name: "",
    ic_name: "",
    discord_username: "",
    email: "",
    position: "Brewer",
    hire_date: new Date().toISOString().slice(0, 10),
    wage: "",
    wage_type: "Hourly",
    username: "",
    password: "",
    contract_text: ""
  });

  const [terminateReason, setTerminateReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) console.error("Error fetching employees:", error);
    else setEmployees(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    let error;
    if (editingId) {
      const { error: updErr } = await supabase.from("accounts").update({
        ...form,
        wage: parseFloat(form.wage) || 0
      }).eq("id", editingId);
      error = updErr;
    } else {
      const { error: insErr } = await supabase.from("accounts").insert([{
        ...form,
        wage: parseFloat(form.wage) || 0,
        contract_agreed: false
      }]);
      error = insErr;
    }

    if (error) {
      console.error("Error saving employee:", error);
      alert("Failed to save employee");
    } else {
      setShowAddModal(false);
      setEditingId(null);
      setForm({
        full_name: "", ic_name: "", discord_username: "", email: "", position: "Brewer",
        hire_date: new Date().toISOString().slice(0, 10), wage: "", wage_type: "Hourly",
        username: "", password: "", contract_text: ""
      });
      fetchEmployees();
    }
    setSubmitting(false);
  };

  const handleEditClick = (emp) => {
    setForm({
      full_name: emp.full_name || "",
      ic_name: emp.ic_name || "",
      discord_username: emp.discord_username || "",
      email: emp.email || "",
      position: emp.position || "Brewer",
      hire_date: emp.hire_date || new Date().toISOString().slice(0, 10),
      wage: emp.wage || "",
      wage_type: emp.wage_type || "Hourly",
      username: emp.username || "",
      password: emp.password || "",
      contract_text: emp.contract_text || ""
    });
    setEditingId(emp.id);
    setShowAddModal(true);
  };

  const handleTerminate = async (e) => {
    e.preventDefault();
    if (!terminateReason.trim()) {
      alert("Please provide a reason for termination.");
      return;
    }
    setSubmitting(true);
    
    const termNotes = showTerminateModal.contract_text 
      ? showTerminateModal.contract_text + `\n\n[TERMINATED on ${new Date().toISOString().slice(0, 10)}] Reason: ${terminateReason}`
      : `[TERMINATED on ${new Date().toISOString().slice(0, 10)}] Reason: ${terminateReason}`;

    const { error } = await supabase.from("accounts").update({
      status: "Terminated",
      contract_text: termNotes
    }).eq("id", showTerminateModal.id);

    if (error) {
      console.error("Error terminating employee:", error);
      alert("Failed to terminate employee");
    } else {
      setShowTerminateModal(null);
      setTerminateReason("");
      fetchEmployees();
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div style={{ color: "#5a6a5a", padding: "40px", textAlign: "center" }}>Loading employees...</div>;
  }

  return (
    <div style={{ color: "#e8e0d0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>Employees</div>
          <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 4 }}>Manage staff and payroll details</div>
        </div>
        <button onClick={() => setShowAddModal(true)} style={btnStyle}>+ Add Employee</button>
      </div>

      <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color: "#8a9a8a", borderBottom: "1px solid rgba(180,140,20,0.2)", textAlign: "left" }}>
              <th style={{ padding: "12px 16px", width: 40, textAlign: "center" }}>Contract</th>
              <th style={{ padding: "12px 16px" }}>Name</th>
              <th style={{ padding: "12px 16px" }}>IC Name</th>
              <th style={{ padding: "12px 16px" }}>Role</th>
              <th style={{ padding: "12px 16px" }}>Hire Date</th>
              <th style={{ padding: "12px 16px" }}>Wage</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const isTerminated = emp.status === "Terminated";
              return (
                <tr key={emp.id} style={{ 
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  opacity: isTerminated ? 0.4 : 1
                }}>
                  <td style={{ padding: "12px 16px", textAlign: "center", fontSize: 16 }}>
                    {emp.contract_agreed ? <span style={{ color: "#50c860" }}>✓</span> : <span style={{ color: "#e09030" }}>⏱</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>{emp.full_name || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>{emp.ic_name || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ 
                      background: ROLE_COLORS[emp.position] || "#4a4a6a", 
                      padding: "2px 8px", 
                      borderRadius: 12, 
                      fontSize: 11,
                      color: "#fff",
                      textTransform: "uppercase",
                      letterSpacing: 1
                    }}>
                      {emp.position}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>{emp.hire_date || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#c8a820" }}>
                    {emp.wage_type === "Salary" ? `${fmt(emp.wage)} salary` : 
                     emp.wage_type === "Per Order" ? `${fmt(emp.wage)} / order` :
                     `${fmt(emp.wage)} / hr`}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: "bold", color: isTerminated ? "#e05050" : "#50c860" }}>
                    {emp.status}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button onClick={() => onViewProfile(emp.id)} style={{ background: "transparent", border: "1px solid rgba(180,140,20,0.4)", color: "#c8a820", borderRadius: 3, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>View</button>
                      <button onClick={() => handleEditClick(emp)} style={{ background: "transparent", border: "1px solid rgba(180,140,20,0.4)", color: "#c8a820", borderRadius: 3, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>Edit</button>
                      {!isTerminated && <button onClick={() => setShowTerminateModal(emp)} style={{ background: "rgba(224,80,80,0.1)", border: "1px solid rgba(224,80,80,0.4)", color: "#e05050", borderRadius: 3, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>Terminate</button>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#0d0a1a", border: "1px solid rgba(180,140,20,0.3)", borderRadius: 4, width: 600, maxHeight: "90vh", overflowY: "auto", padding: 32 }}>
            <h2 style={{ color: "#c8a820", marginTop: 0, marginBottom: 20 }}>{editingId ? "Edit Employee" : "Add Employee"}</h2>
            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>Full Name</label>
                  <input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>IC Name</label>
                  <input required value={form.ic_name} onChange={e => setForm({...form, ic_name: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>Discord Username</label>
                  <input value={form.discord_username} onChange={e => setForm({...form, discord_username: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>Role</label>
                  <select value={form.position} onChange={e => setForm({...form, position: e.target.value})} style={inputStyle}>
                    <option value="Brewer">Brewer</option>
                    <option value="Manager">Manager</option>
                    <option value="CEO">CEO</option>
                    <option value="CFO">CFO</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>Hire Date</label>
                  <input type="date" required value={form.hire_date} onChange={e => setForm({...form, hire_date: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>Wage ($)</label>
                  <input type="number" step="0.01" required value={form.wage} onChange={e => setForm({...form, wage: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>Wage Type</label>
                  <select value={form.wage_type} onChange={e => setForm({...form, wage_type: e.target.value})} style={inputStyle}>
                    <option value="Hourly">Hourly</option>
                    <option value="Salary">Salary</option>
                    <option value="Per Order">Per Order</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>Login Username</label>
                  <input required value={form.username} onChange={e => setForm({...form, username: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>Temp Password</label>
                  <input required value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>Employment Contract</label>
                <textarea required value={form.contract_text} onChange={e => setForm({...form, contract_text: e.target.value})} style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} placeholder="Enter the terms of employment here..." />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                  setForm({
                    full_name: "", ic_name: "", discord_username: "", email: "", position: "Brewer",
                    hire_date: new Date().toISOString().slice(0, 10), wage: "", wage_type: "Hourly",
                    username: "", password: "", contract_text: ""
                  });
                }} style={{ background: "transparent", border: "1px solid #5a6a5a", color: "#8a9a8a", padding: "8px 16px", borderRadius: 3, cursor: "pointer", fontFamily: "Georgia, serif" }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ ...btnStyle, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Saving..." : (editingId ? "Save Changes" : "Add Employee")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTerminateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#0d0a1a", border: "1px solid rgba(224,80,80,0.5)", borderRadius: 4, width: 400, padding: 32 }}>
            <h2 style={{ color: "#e05050", marginTop: 0, marginBottom: 20 }}>Terminate Employee</h2>
            <p style={{ fontSize: 14, marginBottom: 20 }}>Are you sure you want to terminate <strong>{showTerminateModal.full_name} ({showTerminateModal.ic_name})</strong>?</p>
            <form onSubmit={handleTerminate}>
              <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>Reason for Termination</label>
              <textarea required value={terminateReason} onChange={e => setTerminateReason(e.target.value)} style={{ ...inputStyle, minHeight: 80, marginBottom: 20 }} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" onClick={() => setShowTerminateModal(null)} style={{ background: "transparent", border: "1px solid #5a6a5a", color: "#8a9a8a", padding: "8px 16px", borderRadius: 3, cursor: "pointer", fontFamily: "Georgia, serif" }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ background: "linear-gradient(135deg, #e05050, #b03030)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 3, cursor: "pointer", fontFamily: "Georgia, serif", fontWeight: "bold" }}>{submitting ? "Terminating..." : "Terminate"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
