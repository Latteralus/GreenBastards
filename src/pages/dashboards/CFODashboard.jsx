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

const inputStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(180,140,20,0.2)",
  color: "#e8e0d0",
  borderRadius: 3,
  padding: "9px 12px",
  fontFamily: "Georgia, serif",
  fontSize: 13,
  outline: "none",
  width: "auto",
  minWidth: 160,
  cursor: "pointer",
};

const goldBtnStyle = {
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
  letterSpacing: 1,
};

export default function CFODashboard({ user, onLogout, fetchData, transactions, categories, inventory, loans }) {
  const [active, setActive] = useState("orders");

  // Production Queue state
  const [queueOrders, setQueueOrders] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);

  // Manual production state
  const [products, setProducts] = useState([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualQuantities, setManualQuantities] = useState({});
  const [manualCustomer, setManualCustomer] = useState("In-Person Sale");
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState(null);

  const pendingCount = transactions.filter(t => t.status === "Pending").length;

  const navItems = [
    { id: "_sep1", label: "Operations", icon: "", separator: true },
    { id: "orders", label: "All Orders", icon: "▢" },
    { id: "queue", label: "Production Queue", icon: "◱" },
    { id: "forecasting", label: "Forecasting", icon: "◒" },
    { id: "products", label: "Products & Recipes", icon: "⬡" },
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
      const [{ data: ordersData, error: ordersErr }, { data: prodData, error: prodErr }] = await Promise.all([
        supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("status", "In Production")
          .order("created_at", { ascending: true }),
        supabase
          .from("products")
          .select("*")
          .order("name")
      ]);
      if (ordersErr) throw ordersErr;
      if (prodErr) throw prodErr;
      
      setQueueOrders(ordersData || []);
      setProducts(prodData || []);
    } catch (err) {
      console.error("Error loading queue:", err);
    }
    setQueueLoading(false);
  }, []);

  useEffect(() => {
    if (active === "queue") loadQueue();
  }, [active, loadQueue]);

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  async function handleAddManualSubmit() {
    const selectedProducts = products.filter(p => manualQuantities[p.id] > 0);
    if (selectedProducts.length === 0) {
      setManualError("Please select at least one product.");
      return;
    }
    if (!manualCustomer.trim()) {
      setManualError("Customer name is required.");
      return;
    }

    setManualSubmitting(true);
    setManualError(null);

    try {
      let totalCost = 0;
      const itemsToInsert = selectedProducts.map(p => {
        const qty = manualQuantities[p.id];
        const subtotal = qty * p.price;
        totalCost += subtotal;
        return {
          product_id: p.id,
          product_name: p.name,
          quantity: qty,
          unit_price: p.price,
          subtotal: Math.round(subtotal * 100) / 100
        };
      });

      // Insert Order directly into "In Production"
      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_ic_name: manualCustomer.trim(),
          status: "In Production",
          delivery_method: "Pickup",
          payment_confirmed: true,
          total_cost: Math.round(totalCost * 100) / 100,
          assigned_to: user.username, // Assign to current CEO/CFO by default
          notes: "Manual In-Person Sale"
        })
        .select("id")
        .single();

      if (orderErr) throw orderErr;

      // Insert Items
      const orderId = orderData.id;
      const finalItems = itemsToInsert.map(i => ({ ...i, order_id: orderId }));
      const { error: itemsErr } = await supabase.from("order_items").insert(finalItems);
      if (itemsErr) throw itemsErr;

      // Reset & Reload
      setShowManualForm(false);
      setManualQuantities({});
      setManualCustomer("In-Person Sale");
      await loadQueue();
    } catch (err) {
      console.error("Manual order error:", err);
      setManualError(err.message || "Failed to add manual order.");
    } finally {
      setManualSubmitting(false);
    }
  }

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>
              Production Queue
            </div>
            <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 6 }}>
              {queueOrders.length} order{queueOrders.length !== 1 ? "s" : ""} currently in production
            </div>
          </div>
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            style={goldBtnStyle}
          >
            {showManualForm ? "Cancel Manual Order" : "+ Add Manual Order"}
          </button>
        </div>

        {showManualForm && (
          <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.3)", borderRadius: 4, padding: "20px", marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 16px", color: "#c8a820", fontSize: 16 }}>Add Manual In-Person Sale</h3>
            
            {manualError && (
              <div style={{ background: "rgba(224,80,80,0.1)", color: "#e05050", padding: "8px 12px", borderRadius: 4, marginBottom: 16, fontSize: 13 }}>
                {manualError}
              </div>
            )}

            <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 6, textTransform: "uppercase" }}>Customer / Reference Name</label>
                <input
                  type="text"
                  value={manualCustomer}
                  onChange={(e) => setManualCustomer(e.target.value)}
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 6, textTransform: "uppercase" }}>Add Product</label>
                <select
                  id="manual-product-select"
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                  defaultValue=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      setManualQuantities(prev => ({ ...prev, [val]: (prev[val] || 0) + 1 }));
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="" disabled>-- Select a Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({fmt(p.price)})</option>
                  ))}
                </select>
              </div>
            </div>

            {Object.keys(manualQuantities).filter(id => manualQuantities[id] > 0).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: "#8a9a8a", borderBottom: "1px solid rgba(180,140,20,0.2)" }}>
                      <th style={{ textAlign: "left", padding: "8px 0" }}>Product</th>
                      <th style={{ textAlign: "center", padding: "8px 0", width: 80 }}>Qty</th>
                      <th style={{ textAlign: "right", padding: "8px 0", width: 100 }}>Subtotal</th>
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(manualQuantities).filter(id => manualQuantities[id] > 0).map(id => {
                      const p = products.find(prod => prod.id === id);
                      if (!p) return null;
                      const qty = manualQuantities[id];
                      return (
                        <tr key={id} style={{ borderBottom: "1px solid rgba(180,140,20,0.1)" }}>
                          <td style={{ padding: "8px 0" }}>{p.name}</td>
                          <td style={{ padding: "8px 0", textAlign: "center" }}>
                            <input
                              type="number"
                              min="1"
                              value={qty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setManualQuantities(prev => ({ ...prev, [id]: val }));
                              }}
                              style={{ ...inputStyle, minWidth: 50, width: 60, padding: "4px" }}
                            />
                          </td>
                          <td style={{ padding: "8px 0", textAlign: "right", color: "#c8a820" }}>
                            {fmt(p.price * qty)}
                          </td>
                          <td style={{ padding: "8px 0", textAlign: "center" }}>
                            <button
                              onClick={() => setManualQuantities(prev => ({ ...prev, [id]: 0 }))}
                              style={{ background: "none", border: "none", color: "#e05050", cursor: "pointer", fontSize: 16 }}
                            >×</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleAddManualSubmit}
                disabled={manualSubmitting}
                style={{ ...goldBtnStyle, opacity: manualSubmitting ? 0.5 : 1 }}
              >
                {manualSubmitting ? "Adding..." : "Submit Manual Order"}
              </button>
            </div>
          </div>
        )}

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
