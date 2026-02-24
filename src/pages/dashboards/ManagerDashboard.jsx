import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import OrdersPage from "../orders/OrdersPage";
import ForecastingPage from "../production/ForecastingPage";
import ProductsRecipesAdmin from "../production/ProductsRecipesAdmin";
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

export default function ManagerDashboard({ user, onLogout }) {
  const [active, setActive] = useState("orders");

  // Assign Orders state
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [brewers, setBrewers] = useState([]);
  const [assignSelections, setAssignSelections] = useState({});
  const [assignLoading, setAssignLoading] = useState(true);
  const [assignError, setAssignError] = useState(null);
  const [mutating, setMutating] = useState(false);

  // Production Queue state
  const [queueOrders, setQueueOrders] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);

  const navItems = [
    { id: "orders", label: "All Orders", icon: "📋" },
    { id: "assign", label: "Assign Orders", icon: "👤" },
    { id: "queue", label: "Production Queue", icon: "⚗" },
    { id: "forecasting", label: "Forecasting", icon: "📊" },
    { id: "products", label: "Products & Recipes", icon: "🍺" },
  ];

  const pageStyle = {
    marginLeft: 220,
    minHeight: "100vh",
    background: "linear-gradient(160deg, #0d0a1a 0%, #111820 100%)",
    padding: "36px 40px",
    fontFamily: "Georgia, serif",
  };

  // ─── Data Fetching ────────────────────────────────────────────────────────────

  const loadAssignData = useCallback(async () => {
    setAssignLoading(true);
    setAssignError(null);
    try {
      const [ordersRes, brewersRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*, order_items(*)")
          .in("status", ["Confirmed", "Submitted"])
          .is("assigned_to", null)
          .order("created_at", { ascending: true }),
        supabase
          .from("accounts")
          .select("username, position")
          .in("position", ["Brewer", "CEO"]),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (brewersRes.error) throw brewersRes.error;

      setUnassignedOrders(ordersRes.data || []);
      setBrewers(brewersRes.data || []);
    } catch (err) {
      console.error("Error loading assign data:", err);
      setAssignError("Failed to load unassigned orders.");
    }
    setAssignLoading(false);
  }, []);

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
    if (active === "assign") loadAssignData();
    else if (active === "queue") loadQueue();
  }, [active, loadAssignData, loadQueue]);

  // ─── Assign Action ────────────────────────────────────────────────────────────

  async function handleAssign(order) {
    const selectedBrewer = assignSelections[order.id];
    if (!selectedBrewer) return;

    setMutating(true);
    const updates = {
      assigned_to: selectedBrewer,
      status_updated_at: new Date().toISOString(),
    };
    if (order.status === "Confirmed") {
      updates.status = "In Production";
    }

    const { error: err } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", order.id);

    if (err) {
      console.error("Error assigning order:", err);
      setAssignError("Failed to assign order.");
    }

    setAssignSelections((prev) => {
      const next = { ...prev };
      delete next[order.id];
      return next;
    });
    await loadAssignData();
    setMutating(false);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  function itemsSummary(items) {
    if (!items || items.length === 0) return "No items";
    return items.map((i) => `${i.quantity}x ${i.product_name}`).join(", ");
  }

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

  // ─── Assign Orders Page ───────────────────────────────────────────────────────

  function renderAssignOrders() {
    if (assignLoading) {
      return (
        <div style={{ color: "#5a6a5a", textAlign: "center", padding: "60px 0", fontSize: 16 }}>
          Loading unassigned orders...
        </div>
      );
    }

    return (
      <div style={{ color: "#e8e0d0" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>
            Assign Orders
          </div>
          <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 6 }}>
            Assign confirmed orders to brewers for production
          </div>
        </div>

        {assignError && (
          <div style={{ background: "rgba(224,80,80,0.1)", border: "1px solid rgba(224,80,80,0.3)", color: "#e05050", borderRadius: 4, padding: "10px 16px", marginBottom: 20, fontSize: 13 }}>
            {assignError}
          </div>
        )}

        {unassignedOrders.length === 0 ? (
          <div style={{ color: "#5a6a5a", textAlign: "center", padding: "40px 0", fontSize: 14 }}>
            All orders are assigned. ✓
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {unassignedOrders.map((order) => {
              const items = order.order_items || [];
              const statusColor = STATUS_COLORS[order.status] || "#8a9a8a";

              return (
                <div key={order.id} style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
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
                    <div style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}44`, borderRadius: 3, padding: "3px 10px", fontSize: 11, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase", minWidth: 80, textAlign: "center" }}>
                      {order.status}
                    </div>
                  </div>

                  {/* Assign Controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(180,140,20,0.08)" }}>
                    <div style={{ color: "#5a6a5a", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                      Assign To:
                    </div>
                    <select
                      value={assignSelections[order.id] || ""}
                      onChange={(e) => setAssignSelections((prev) => ({ ...prev, [order.id]: e.target.value }))}
                      style={inputStyle}
                    >
                      <option value="">Select Brewer...</option>
                      {brewers.map((b) => (
                        <option key={b.username} value={b.username}>
                          {b.username} ({b.position})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssign(order)}
                      disabled={mutating || !assignSelections[order.id]}
                      style={{ ...goldBtnStyle, opacity: mutating || !assignSelections[order.id] ? 0.5 : 1 }}
                    >
                      Assign
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── Production Queue Page ────────────────────────────────────────────────────

  function renderQueue() {
    if (queueLoading) {
      return (
        <div style={{ color: "#5a6a5a", textAlign: "center", padding: "60px 0", fontSize: 16 }}>
          Loading production queue...
        </div>
      );
    }

    return (
      <div style={{ color: "#e8e0d0" }}>
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
      />
      <div style={pageStyle}>
        {active === "orders" && <OrdersPage user={user} />}
        {active === "assign" && renderAssignOrders()}
        {active === "queue" && renderQueue()}
        {active === "forecasting" && <ForecastingPage />}
        {active === "products" && <ProductsRecipesAdmin />}
      </div>
    </div>
  );
}
