import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import OrdersPage from "../orders/OrdersPage";
import ForecastingPage from "../production/ForecastingPage";
import ProductsRecipesAdmin from "../production/ProductsRecipesAdmin";
import Dashboard from "../financial/Dashboard";
import Transactions from "../financial/Transactions";
import Inventory from "../financial/Inventory";
import Loans from "../financial/Loans";
import AuditCenter from "../financial/AuditCenter";
import Reports from "../financial/Reports";
import Settings from "../financial/Settings";
import { supabase } from "../../supabaseClient";
import { fmt } from "../../helpers";

const STATUS_COLORS = {
  Submitted: "#e09030",
  "Awaiting Payment": "#e09030",
  Confirmed: "#3498db",
  "In Production": "#9b59b6",
  Ready: "#50c860",
  Delivered: "#50c860",
  Cancelled: "#e05050",
};

export default function CFODashboard({ user, onLogout, fetchData, transactions, categories, inventory, loans }) {
  const [active, setActive] = useState("orders");

  // Production Queue state
  const [queueOrders, setQueueOrders] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);

  const pendingCount = transactions.filter(t => t.status === "Pending").length;

  const navItems = [
    { id: "_sep1", label: "Operations", icon: "", separator: true },
    { id: "orders", label: "All Orders", icon: "📋" },
    { id: "queue", label: "Production Queue", icon: "⚗" },
    { id: "forecasting", label: "Forecasting", icon: "📊" },
    { id: "products", label: "Products & Recipes", icon: "🍺" },
    { id: "_sep2", label: "Finance", icon: "", separator: true },
    { id: "dashboard", label: "Dashboard", icon: "◈" },
    { id: "transactions", label: "Transactions", icon: "⟳" },
    { id: "inventory", label: "Inventory", icon: "▦" },
    { id: "loans", label: "Loans", icon: "❖" },
    { id: "audit", label: "Audit Center", icon: "◎", badge: pendingCount > 0 ? pendingCount : null },
    { id: "reports", label: "Reports", icon: "▤" },
    { id: "settings", label: "Settings", icon: "⚙" },
  ];

  const pageStyle = {
    marginLeft: 220,
    minHeight: "100vh",
    background: "linear-gradient(160deg, #0d0a1a 0%, #111820 100%)",
    padding: "36px 40px",
    fontFamily: "Georgia, serif",
  };

  // ─── handleCreateTransaction Callback ─────────────────────────────────────────

  const handleCreateTransaction = async ({ amount, memo }) => {
    const newTransaction = {
      date: new Date().toISOString().slice(0, 10),
      type: "Credit",
      category: "Sales Revenue",
      amount: parseFloat(amount),
      memo: memo,
      submitted_by: user.displayName,
      status: "Approved",
      approved_by: user.displayName,
    };

    const { error } = await supabase.from("transactions").insert([newTransaction]);
    if (error) {
      console.error("Error creating transaction:", error);
      alert("Failed to create transaction");
    } else {
      fetchData(); // Refresh financial data
      alert("Sales transaction created successfully!");
    }
  };

  // ─── Production Queue ─────────────────────────────────────────────────────────

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("status", "In Production")
        .order("created_at", { ascending: true });
      if (err) throw err;
      setQueueOrders(data || []);
    } catch (err) {
      console.error("Error loading queue:", err);
    }
    setQueueLoading(false);
  }, []);

  useEffect(() => {
    if (active === "queue") loadQueue();
  }, [active, loadQueue]);

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  function itemsSummary(items) {
    if (!items || items.length === 0) return "No items";
    return items.map((i) => `${i.quantity}x ${i.product_name}`).join(", ");
  }

  // ─── Production Queue Render ──────────────────────────────────────────────────

  function renderQueue() {
    if (queueLoading) {
      return (
        <div style={{ color: "#5a6a5a", textAlign: "center", padding: "60px 0", fontSize: 16, fontFamily: "Georgia, serif" }}>
          Loading production queue...
        </div>
      );
    }

    return (
      <div style={{ color: "#e8e0d0", fontFamily: "Georgia, serif" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>
            Production Queue
          </div>
          <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 6 }}>
            {queueOrders.length} order{queueOrders.length !== 1 ? "s" : ""} currently in production
          </div>
        </div>

        {queueOrders.length === 0 ? (
          <div style={{ color: "#5a6a5a", textAlign: "center", padding: "40px 0", fontSize: 14 }}>
            No orders currently in production.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {queueOrders.map((order) => {
              const items = order.order_items || [];
              const statusColor = STATUS_COLORS["In Production"];

              return (
                <div key={order.id} style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ color: "#c8a820", fontFamily: "Consolas, monospace", fontSize: 13, fontWeight: "bold", minWidth: 80 }}>
                    #{order.id.slice(0, 8)}
                  </div>
                  <div style={{ color: "#e8e0d0", fontSize: 13, minWidth: 120 }}>
                    {order.customer_ic_name || "Unknown"}
                  </div>
                  <div style={{ color: "#8a9a8a", fontSize: 12, flex: 1, minWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {itemsSummary(items)}
                  </div>
                  <div style={{ color: "#e8e0d0", fontSize: 13, fontWeight: "bold", minWidth: 80, textAlign: "right" }}>
                    {fmt(parseFloat(order.total_cost) || 0)}
                  </div>
                  <div style={{ color: "#8a9a8a", fontSize: 12, minWidth: 90 }}>
                    {order.assigned_to || "Unassigned"}
                  </div>
                  <div style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}44`, borderRadius: 3, padding: "3px 10px", fontSize: 11, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase" }}>
                    In Production
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: "#0a0714", minHeight: "100vh" }}>
      <Sidebar
        navItems={navItems}
        active={active}
        setActive={setActive}
        user={user}
        onLogout={onLogout}
        pendingCount={pendingCount}
      />
      <div style={pageStyle}>
        {/* Operations Pages */}
        {active === "orders" && <OrdersPage user={user} showFinancial={true} onCreateTransaction={handleCreateTransaction} />}
        {active === "queue" && renderQueue()}
        {active === "forecasting" && <ForecastingPage />}
        {active === "products" && <ProductsRecipesAdmin />}

        {/* Financial Pages (preserved from original) */}
        {active === "dashboard" && <Dashboard transactions={transactions} categories={categories} loans={loans} />}
        {active === "transactions" && <Transactions transactions={transactions} onTransactionUpdate={fetchData} user={user} categories={categories} loans={loans} />}
        {active === "inventory" && <Inventory inventory={inventory} onInventoryUpdate={fetchData} />}
        {active === "loans" && <Loans transactions={transactions} loans={loans} />}
        {active === "audit" && <AuditCenter transactions={transactions} onTransactionUpdate={fetchData} user={user} categories={categories} />}
        {active === "reports" && <Reports transactions={transactions} inventory={inventory} categories={categories} loans={loans} />}
        {active === "settings" && <Settings user={user} categories={categories} onDataUpdate={fetchData} />}
      </div>
    </div>
  );
}
