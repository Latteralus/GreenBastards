import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient.js";
import { fmt } from "../../helpers.js";

export default function Transactions({ transactions, onTransactionUpdate, user, categories, loans, accounts = [] }) {
  const categoryNames = categories.map(c => c.name);
  const activeEmployees = accounts.filter(a => a.status !== "Terminated");
  
  const [form, setForm] = useState({ 
    date: new Date().toISOString().slice(0, 10), 
    type: "Debit", 
    category: categoryNames[0] || "", 
    amount: "", 
    memo: "", 
    loan_id: "",
    newLoanName: "",
    newLoanLender: "",
    newLoanRate: "",
    employee_id: "",
    pay_period_start: new Date().toISOString().slice(0, 10),
    pay_period_end: new Date().toISOString().slice(0, 10),
    hours_worked: ""
  });
  const [filter, setFilter] = useState("All");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [memoError, setMemoError] = useState(false);

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
  useEffect(() => {
    if (["Loan Proceeds", "Capital Contribution", "Investment"].includes(form.category)) {
      setForm(f => ({ ...f, type: "Credit" }));
    } else if (["Loan Repayment", "Savings", "Payroll"].includes(form.category)) {
      setForm(f => ({ ...f, type: "Debit" }));
    }
  }, [form.category]);

  // Payroll auto-calculations
  useEffect(() => {
    if (form.category === "Payroll" && form.employee_id) {
      const emp = activeEmployees.find(e => e.id === form.employee_id);
      if (emp) {
        let amt = form.amount;
        if (emp.wage_type === "Hourly" && form.hours_worked) {
          amt = (parseFloat(emp.wage) * parseFloat(form.hours_worked)).toFixed(2);
        } else if (emp.wage_type !== "Hourly") {
          amt = parseFloat(emp.wage).toFixed(2);
        }
        
        const memo = `Payroll — ${emp.full_name || emp.username} (${emp.ic_name || "N/A"}) — ${form.pay_period_start} to ${form.pay_period_end}`;
        
        setForm(f => ({ ...f, amount: amt, memo }));
      }
    }
  }, [form.category, form.employee_id, form.hours_worked, form.pay_period_start, form.pay_period_end]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.memo.trim()) {
      setMemoError(true);
      return;
    }
    if (!form.amount || isNaN(parseFloat(form.amount))) return;
    setMemoError(false);
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
          principal_amount: parseFloat(form.amount) || 0
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

    const { data: txData, error: txError } = await supabase.from('transactions').insert([newT]).select().single();

    if (txError) {
      console.error('Error inserting transaction:', txError);
      alert('Failed to submit transaction');
    } else {
      // Auto-insert paystub if payroll
      if (form.category === "Payroll" && form.employee_id) {
        const emp = activeEmployees.find(e => e.id === form.employee_id);
        if (emp) {
          const { error: stubError } = await supabase.from('paystubs').insert([{
            account_id: emp.id,
            transaction_id: txData.id,
            pay_period_start: form.pay_period_start,
            pay_period_end: form.pay_period_end,
            hours_worked: emp.wage_type === "Hourly" ? (parseFloat(form.hours_worked) || null) : null,
            hourly_rate: parseFloat(emp.wage) || null,
            gross_pay: parseFloat(form.amount),
            notes: "Auto-generated from payroll transaction"
          }]);
          if (stubError) console.error("Error creating paystub:", stubError);
        }
      }

      onTransactionUpdate();
      setForm({ 
        date: new Date().toISOString().slice(0, 10), 
        type: "Debit", 
        category: categoryNames[0] || "", 
        amount: "", 
        memo: "", 
        loan_id: "",
        newLoanName: "",
        newLoanLender: "",
        newLoanRate: "",
        employee_id: "",
        pay_period_start: new Date().toISOString().slice(0, 10),
        pay_period_end: new Date().toISOString().slice(0, 10),
        hours_worked: ""
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
            
            {form.category === "Payroll" && (
              <div style={{ marginBottom: 14, padding: "12px", background: "rgba(180,140,20,0.05)", borderRadius: 3, border: "1px solid rgba(180,140,20,0.2)" }}>
                <div style={{ color: "#c8a820", fontSize: 11, fontWeight: "bold", marginBottom: 12, textTransform: "uppercase" }}>Payroll Details</div>
                
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>Select Employee</label>
                  <select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} style={inputStyle}>
                    <option value="">-- Select Employee --</option>
                    {activeEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name || emp.username} — {emp.position} — ${emp.wage} / {emp.wage_type}
                      </option>
                    ))}
                  </select>
                </div>

                {form.employee_id && (
                  <>
                    <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", color: "#8a9a8a", fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>Period Start</label>
                        <input type="date" value={form.pay_period_start} onChange={e => setForm(f => ({ ...f, pay_period_start: e.target.value }))} style={inputStyle} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", color: "#8a9a8a", fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>Period End</label>
                        <input type="date" value={form.pay_period_end} onChange={e => setForm(f => ({ ...f, pay_period_end: e.target.value }))} style={inputStyle} />
                      </div>
                    </div>
                    {activeEmployees.find(e => e.id === form.employee_id)?.wage_type === "Hourly" && (
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ display: "block", color: "#8a9a8a", fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>Hours Worked</label>
                        <input type="number" step="0.01" value={form.hours_worked} onChange={e => setForm(f => ({ ...f, hours_worked: e.target.value }))} style={inputStyle} placeholder="0.00" />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

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
              <label style={{ display: "block", color: memoError ? "#e05050" : "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Memo {memoError && <span style={{ fontWeight: "normal", textTransform: "none" }}>— A memo is required</span>}</label>
              <input value={form.memo} onChange={e => { setForm(f => ({ ...f, memo: e.target.value })); if (memoError) setMemoError(false); }} style={{ ...inputStyle, border: memoError ? "1px solid #e05050" : inputStyle.border, background: memoError ? "rgba(224,80,80,0.08)" : inputStyle.background }} placeholder="Example: Bought 10 Wheat from ExampleMart." />
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
