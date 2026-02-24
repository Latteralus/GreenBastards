import { useState } from "react";
import { calcSummary, calcSavingsBalance, calcLoanLiability, fmt } from "../../helpers.js";
import { Row, TotalRow, SectionHeader, MDASection } from "../../components/shared/ReportComponents.jsx";

export default function Reports({ transactions, inventory, categories, loans }) {
  const { revenue, expenses } = calcSummary(transactions, categories);
  const netIncome = revenue - expenses;
  const savingsBalance = calcSavingsBalance(transactions);
  const loanLiability = calcLoanLiability(transactions, loans);

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
