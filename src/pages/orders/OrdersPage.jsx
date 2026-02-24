import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { fmt } from "../../helpers";

const STATUS_LIST = [
  "All",
  "Submitted",
  "Awaiting Payment",
  "Confirmed",
  "In Production",
  "Ready",
  "Delivered",
  "Cancelled",
];

const STATUS_COLORS = {
  Submitted: "#e09030",
  "Awaiting Payment": "#e09030",
  Confirmed: "#3498db",
  "In Production": "#9b59b6",
  Ready: "#50c860",
  Delivered: "#50c860",
  Cancelled: "#e05050",
};

const NEXT_TRANSITIONS = {
  Submitted: { label: "Move to Awaiting Payment", next: "Awaiting Payment" },
  "Awaiting Payment": { label: "Mark Payment Confirmed", next: "Confirmed", confirmPayment: true },
  Confirmed: { label: "Start Production", next: "In Production" },
  "In Production": { label: "Mark Ready", next: "Ready" },
  Ready: { label: "Mark Delivered", next: "Delivered" },
};

// Props: user, showFinancial (boolean), onCreateTransaction (function)
export default function OrdersPage({ showFinancial = false, onCreateTransaction }) {
  const [orders, setOrders] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [brewers, setBrewers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedIds, setExpandedIds] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [mutating, setMutating] = useState(false);

  // Add Order Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    customer_ic_name: "",
    customer_discord: "",
    delivery_method: "Pickup",
    delivery_location: "",
    notes: "",
    status: "Confirmed",
  });
  const [addQuantities, setAddQuantities] = useState({});
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // ─── Data Fetching ────────────────────────────────────────────────────────────

  async function fetchOrders() {
    const { data, error: err } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders.");
      return [];
    }
    return data || [];
  }

  async function fetchRecipes() {
    const { data, error: err } = await supabase
      .from("recipes")
      .select("*, recipe_ingredients(*)")
      .order("product_id");
    if (err) {
      console.error("Error fetching recipes:", err);
      return [];
    }
    return data || [];
  }

  async function fetchBrewers() {
    const { data, error: err } = await supabase
      .from("accounts")
      .select("username, position");
    if (err) {
      console.error("Error fetching accounts:", err);
      return [];
    }
    return (data || []).filter(
      (a) => a.position === "Brewer" || a.position === "CEO"
    );
  }

  async function fetchProducts() {
    const { data, error: err } = await supabase
      .from("products")
      .select("*")
      .order("name");
    if (err) {
      console.error("Error fetching products:", err);
      return [];
    }
    return data || [];
  }

  async function loadAll() {
    setLoading(true);
    setError(null);
    const [o, r, b, p] = await Promise.all([
      fetchOrders(),
      fetchRecipes(),
      fetchBrewers(),
      fetchProducts(),
    ]);
    setOrders(o);
    setRecipes(r);
    setBrewers(b);
    setProducts(p);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await loadAll();
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Mutations ────────────────────────────────────────────────────────────────

  async function updateOrderStatus(order, nextStatus, extraFields = {}) {
    setMutating(true);
    // Optimistic update
    const updatedOrders = orders.map((o) =>
      o.id === order.id
        ? {
            ...o,
            status: nextStatus,
            status_updated_at: new Date().toISOString(),
            ...extraFields,
          }
        : o
    );
    setOrders(updatedOrders);

    const { error: err } = await supabase
      .from("orders")
      .update({
        status: nextStatus,
        status_updated_at: new Date().toISOString(),
        ...extraFields,
      })
      .eq("id", order.id);

    if (err) {
      console.error("Error updating order status:", err);
      setError("Failed to update order. Refreshing...");
    }
    // Refetch to confirm
    const fresh = await fetchOrders();
    setOrders(fresh);
    setMutating(false);
  }

  async function handleAdvanceStatus(order) {
    const transition = NEXT_TRANSITIONS[order.status];
    if (!transition) return;
    const extra = transition.confirmPayment ? { payment_confirmed: true } : {};
    await updateOrderStatus(order, transition.next, extra);
  }

  async function handleCancelOrder(order) {
    if (!cancelReason.trim()) return;
    setMutating(true);
    const appendedNotes = order.notes
      ? `${order.notes}\n[CANCELLED] ${cancelReason.trim()}`
      : `[CANCELLED] ${cancelReason.trim()}`;

    const updatedOrders = orders.map((o) =>
      o.id === order.id
        ? {
            ...o,
            status: "Cancelled",
            notes: appendedNotes,
            status_updated_at: new Date().toISOString(),
          }
        : o
    );
    setOrders(updatedOrders);

    const { error: err } = await supabase
      .from("orders")
      .update({
        status: "Cancelled",
        notes: appendedNotes,
        status_updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (err) {
      console.error("Error cancelling order:", err);
      setError("Failed to cancel order. Refreshing...");
    }
    const fresh = await fetchOrders();
    setOrders(fresh);
    setCancellingId(null);
    setCancelReason("");
    setMutating(false);
  }

  async function handleAssign(order, username) {
    setMutating(true);
    const updatedOrders = orders.map((o) =>
      o.id === order.id
        ? {
            ...o,
            assigned_to: username,
            status_updated_at: new Date().toISOString(),
          }
        : o
    );
    setOrders(updatedOrders);

    const { error: err } = await supabase
      .from("orders")
      .update({
        assigned_to: username,
        status_updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (err) {
      console.error("Error assigning order:", err);
      setError("Failed to assign order. Refreshing...");
    }
    const fresh = await fetchOrders();
    setOrders(fresh);
    setMutating(false);
  }

  async function handleAddOrder(e) {
    e.preventDefault();
    setSubmittingAdd(true);

    let totalCost = 0;
    const items = [];
    Object.keys(addQuantities).forEach((id) => {
      const qty = addQuantities[id];
      if (qty > 0) {
        const product = products.find((p) => p.id === id);
        if (product) {
          totalCost += product.price * qty;
          items.push({
            product_id: product.id,
            product_name: product.name,
            quantity: qty,
            unit_price: product.price,
            subtotal: Math.round(product.price * qty * 100) / 100,
          });
        }
      }
    });

    if (items.length === 0) {
      alert("Please add at least one item to the order.");
      setSubmittingAdd(false);
      return;
    }

    try {
      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_ic_name: addForm.customer_ic_name.trim(),
          customer_discord: addForm.customer_discord.trim() || null,
          delivery_method: addForm.delivery_method,
          delivery_location:
            addForm.delivery_method === "Delivery"
              ? addForm.delivery_location.trim()
              : null,
          total_cost: Math.round(totalCost * 100) / 100,
          notes: addForm.notes.trim() || null,
          status: addForm.status,
          payment_confirmed: addForm.status !== "Submitted" && addForm.status !== "Awaiting Payment"
        })
        .select("id")
        .single();

      if (orderErr) throw orderErr;

      const orderId = orderData.id;

      const itemsToInsert = items.map((i) => ({ ...i, order_id: orderId }));
      const { error: itemsErr } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

      if (itemsErr) throw itemsErr;

      setAddForm({
        customer_ic_name: "",
        customer_discord: "",
        delivery_method: "Pickup",
        delivery_location: "",
        notes: "",
        status: "Confirmed",
      });
      setAddQuantities({});
      setShowAddModal(false);

      const fresh = await fetchOrders();
      setOrders(fresh);
    } catch (err) {
      console.error("Error adding order:", err);
      setError("Failed to add order.");
    } finally {
      setSubmittingAdd(false);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  function toggleExpanded(id) {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function itemsSummary(items) {
    if (!items || items.length === 0) return "No items";
    return items.map((i) => `${i.quantity}x ${i.product_name}`).join(", ");
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getRecipeForProduct(productId) {
    return recipes.find((r) => r.product_id === productId) || null;
  }

  // ─── Filter ───────────────────────────────────────────────────────────────────

  const filteredOrders =
    statusFilter === "All"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  function statusCount(status) {
    if (status === "All") return orders.length;
    return orders.filter((o) => o.status === status).length;
  }

  // ─── CFO Financial Calculations ───────────────────────────────────────────────

  function getMonthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }

  const deliveredThisMonth = orders
    .filter(
      (o) =>
        o.status === "Delivered" && o.created_at && o.created_at >= getMonthStart()
    )
    .reduce((sum, o) => sum + (parseFloat(o.total_cost) || 0), 0);

  const pendingRevenue = orders
    .filter((o) => o.status === "Confirmed" || o.status === "In Production")
    .reduce((sum, o) => sum + (parseFloat(o.total_cost) || 0), 0);

  const potentialRevenue = orders
    .filter(
      (o) => o.status === "Submitted" || o.status === "Awaiting Payment"
    )
    .reduce((sum, o) => sum + (parseFloat(o.total_cost) || 0), 0);

  // ─── Styles ───────────────────────────────────────────────────────────────────

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(180,140,20,0.2)",
    color: "#e8e0d0",
    borderRadius: 3,
    padding: "9px 12px",
    fontFamily: "Georgia, serif",
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
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

  const redBtnStyle = {
    ...goldBtnStyle,
    background: "linear-gradient(135deg, #e05050, #b03030)",
    color: "#fff",
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        style={{
          fontFamily: "Georgia, serif",
          color: "#5a6a5a",
          padding: "60px 40px",
          textAlign: "center",
          fontSize: 16,
        }}
      >
        Loading orders...
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div
        style={{
          fontFamily: "Georgia, serif",
          color: "#e05050",
          padding: "60px 40px",
          textAlign: "center",
          fontSize: 16,
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>
            Order Management
          </div>
          <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 6 }}>
            Manage customer orders through the fulfillment lifecycle
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ ...goldBtnStyle }}
        >
          + Add Order
        </button>
      </div>

      {/* ── Error Banner ───────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            background: "rgba(224,80,80,0.1)",
            border: "1px solid rgba(224,80,80,0.3)",
            color: "#e05050",
            borderRadius: 4,
            padding: "10px 16px",
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* ── CFO Financial Impact Panel ─────────────────────────────────── */}
      {showFinancial && (
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              background: "rgba(15,10,30,0.8)",
              border: "1px solid rgba(80,200,96,0.15)",
              borderRadius: 4,
              padding: "20px 24px",
              flex: 1,
            }}
          >
            <div
              style={{
                color: "#5a6a5a",
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Delivered Revenue This Month
            </div>
            <div
              style={{
                color: "#50c860",
                fontSize: 26,
                fontWeight: "bold",
                letterSpacing: 1,
              }}
            >
              {fmt(deliveredThisMonth)}
            </div>
          </div>
          <div
            style={{
              background: "rgba(15,10,30,0.8)",
              border: "1px solid rgba(52,152,219,0.15)",
              borderRadius: 4,
              padding: "20px 24px",
              flex: 1,
            }}
          >
            <div
              style={{
                color: "#5a6a5a",
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Pending Revenue
            </div>
            <div
              style={{
                color: "#3498db",
                fontSize: 26,
                fontWeight: "bold",
                letterSpacing: 1,
              }}
            >
              {fmt(pendingRevenue)}
            </div>
          </div>
          <div
            style={{
              background: "rgba(15,10,30,0.8)",
              border: "1px solid rgba(224,144,48,0.15)",
              borderRadius: 4,
              padding: "20px 24px",
              flex: 1,
            }}
          >
            <div
              style={{
                color: "#5a6a5a",
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Potential Revenue
            </div>
            <div
              style={{
                color: "#e09030",
                fontSize: 26,
                fontWeight: "bold",
                letterSpacing: 1,
              }}
            >
              {fmt(potentialRevenue)}
            </div>
          </div>
        </div>
      )}

      {/* ── Status Filter Bar ──────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        {STATUS_LIST.map((s) => {
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                background: active
                  ? "linear-gradient(135deg, #c8a820, #a08010)"
                  : "rgba(255,255,255,0.04)",
                color: active ? "#0d0a1a" : "#8a9a8a",
                border: active
                  ? "1px solid #c8a820"
                  : "1px solid rgba(180,140,20,0.15)",
                borderRadius: 3,
                padding: "7px 14px",
                cursor: "pointer",
                fontFamily: "Georgia, serif",
                fontSize: 12,
                fontWeight: active ? "bold" : "normal",
                letterSpacing: active ? 1 : 0,
              }}
            >
              {s} ({statusCount(s)})
            </button>
          );
        })}
      </div>

      {/* ── Orders List ────────────────────────────────────────────────── */}
      {filteredOrders.length === 0 && (
        <div
          style={{
            color: "#5a6a5a",
            textAlign: "center",
            padding: "40px 0",
            fontSize: 14,
          }}
        >
          No orders found{statusFilter !== "All" ? ` with status "${statusFilter}"` : ""}.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredOrders.map((order) => {
          const expanded = expandedIds.includes(order.id);
          const items = order.order_items || [];
          const statusColor = STATUS_COLORS[order.status] || "#8a9a8a";
          const transition = NEXT_TRANSITIONS[order.status];
          const canCancel =
            order.status !== "Delivered" && order.status !== "Cancelled";
          const showAssign =
            order.status === "Confirmed" || order.status === "In Production";

          return (
            <div
              key={order.id}
              style={{
                background: "rgba(15,10,30,0.8)",
                border: `1px solid rgba(180,140,20,0.15)`,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              {/* ── Collapsed Row ──────────────────────────────────── */}
              <div
                onClick={() => toggleExpanded(order.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 20px",
                  cursor: "pointer",
                  flexWrap: "wrap",
                }}
              >
                {/* Order ID */}
                <div
                  style={{
                    color: "#c8a820",
                    fontFamily: "Consolas, monospace",
                    fontSize: 13,
                    fontWeight: "bold",
                    minWidth: 80,
                  }}
                >
                  #{order.id.slice(0, 8)}
                </div>

                {/* Customer */}
                <div
                  style={{
                    color: "#e8e0d0",
                    fontSize: 13,
                    minWidth: 120,
                  }}
                >
                  {order.customer_ic_name || "Unknown"}
                </div>

                {/* Items Summary */}
                <div
                  style={{
                    color: "#8a9a8a",
                    fontSize: 12,
                    flex: 1,
                    minWidth: 150,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {itemsSummary(items)}
                </div>

                {/* Total */}
                <div
                  style={{
                    color: "#e8e0d0",
                    fontSize: 13,
                    fontWeight: "bold",
                    minWidth: 80,
                    textAlign: "right",
                  }}
                >
                  {fmt(parseFloat(order.total_cost) || 0)}
                </div>

                {/* Status Badge */}
                <div
                  style={{
                    background: `${statusColor}18`,
                    color: statusColor,
                    border: `1px solid ${statusColor}44`,
                    borderRadius: 3,
                    padding: "3px 10px",
                    fontSize: 11,
                    fontWeight: "bold",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    minWidth: 100,
                    textAlign: "center",
                  }}
                >
                  {order.status}
                </div>

                {/* Assigned */}
                <div
                  style={{
                    color: order.assigned_to ? "#8a9a8a" : "#5a6a5a",
                    fontSize: 12,
                    minWidth: 90,
                    fontStyle: order.assigned_to ? "normal" : "italic",
                  }}
                >
                  {order.assigned_to || "Unassigned"}
                </div>

                {/* Date */}
                <div
                  style={{
                    color: "#5a6a5a",
                    fontSize: 11,
                    minWidth: 140,
                    textAlign: "right",
                  }}
                >
                  {formatDate(order.created_at)}
                </div>

                {/* Expand Indicator */}
                <div
                  style={{
                    color: "#5a6a5a",
                    fontSize: 14,
                    transition: "transform 0.2s",
                    transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                >
                  ▶
                </div>
              </div>

              {/* ── Expanded Details ──────────────────────────────── */}
              {expanded && (
                <div
                  style={{
                    borderTop: "1px solid rgba(180,140,20,0.15)",
                    padding: "20px 24px",
                  }}
                >
                  {/* Detail Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "12px 24px",
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <div style={{ color: "#5a6a5a", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                        Customer Discord
                      </div>
                      <div style={{ color: "#e8e0d0", fontSize: 13 }}>
                        {order.customer_discord || "—"}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#5a6a5a", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                        Delivery Method
                      </div>
                      <div style={{ color: "#e8e0d0", fontSize: 13 }}>
                        {order.delivery_method || "—"}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#5a6a5a", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                        Delivery Location
                      </div>
                      <div style={{ color: "#e8e0d0", fontSize: 13 }}>
                        {order.delivery_location || "—"}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#5a6a5a", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                        Payment Confirmed
                      </div>
                      <div style={{ fontSize: 13 }}>
                        {order.payment_confirmed ? (
                          <span style={{ color: "#50c860" }}>✓ Confirmed</span>
                        ) : (
                          <span style={{ color: "#e05050" }}>✗ Not Confirmed</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#5a6a5a", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                        Status Updated
                      </div>
                      <div style={{ color: "#e8e0d0", fontSize: 13 }}>
                        {formatDate(order.status_updated_at)}
                      </div>
                    </div>
                    {order.notes && (
                      <div>
                        <div style={{ color: "#5a6a5a", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                          Notes
                        </div>
                        <div
                          style={{
                            color: "#8a9a8a",
                            fontSize: 13,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {order.notes}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Items & Recipe Breakdown ───────────────────── */}
                  <div
                    style={{
                      borderTop: "1px solid rgba(180,140,20,0.1)",
                      paddingTop: 16,
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        color: "#c8a820",
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: 2,
                        marginBottom: 12,
                        fontWeight: "bold",
                      }}
                    >
                      Order Items & Recipe Breakdown
                    </div>

                    {items.map((item) => {
                      const recipe = getRecipeForProduct(item.product_id);
                      return (
                        <div
                          key={item.id}
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(180,140,20,0.1)",
                            borderRadius: 3,
                            padding: "14px 18px",
                            marginBottom: 10,
                          }}
                        >
                          {/* Item header */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: recipe ? 10 : 0,
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  color: "#e8e0d0",
                                  fontSize: 14,
                                  fontWeight: "bold",
                                }}
                              >
                                {item.product_name}
                              </span>
                              <span
                                style={{
                                  color: "#8a9a8a",
                                  fontSize: 12,
                                  marginLeft: 12,
                                }}
                              >
                                ×{item.quantity} @ {fmt(parseFloat(item.unit_price) || 0)} each
                              </span>
                            </div>
                            <div
                              style={{
                                color: "#c8a820",
                                fontSize: 13,
                                fontWeight: "bold",
                              }}
                            >
                              {fmt(parseFloat(item.subtotal) || 0)}
                            </div>
                          </div>

                          {/* Recipe details */}
                          {recipe ? (
                            <div
                              style={{
                                borderTop: "1px solid rgba(180,140,20,0.08)",
                                paddingTop: 10,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: 20,
                                  flexWrap: "wrap",
                                  marginBottom: 8,
                                }}
                              >
                                {recipe.difficulty && (
                                  <div style={{ fontSize: 11 }}>
                                    <span style={{ color: "#5a6a5a" }}>Difficulty: </span>
                                    <span style={{ color: "#8a9a8a" }}>{recipe.difficulty}</span>
                                  </div>
                                )}
                                {recipe.cooking_time && (
                                  <div style={{ fontSize: 11 }}>
                                    <span style={{ color: "#5a6a5a" }}>Cook Time: </span>
                                    <span style={{ color: "#8a9a8a" }}>{recipe.cooking_time}</span>
                                  </div>
                                )}
                                {recipe.distill_runs != null && (
                                  <div style={{ fontSize: 11 }}>
                                    <span style={{ color: "#5a6a5a" }}>Distill Runs: </span>
                                    <span style={{ color: "#8a9a8a" }}>{recipe.distill_runs}</span>
                                  </div>
                                )}
                                {recipe.age_requirement && (
                                  <div style={{ fontSize: 11 }}>
                                    <span style={{ color: "#5a6a5a" }}>Age Req: </span>
                                    <span style={{ color: "#8a9a8a" }}>{recipe.age_requirement}</span>
                                  </div>
                                )}
                                {recipe.barrel_type && (
                                  <div style={{ fontSize: 11 }}>
                                    <span style={{ color: "#5a6a5a" }}>Barrel: </span>
                                    <span style={{ color: "#8a9a8a" }}>{recipe.barrel_type}</span>
                                  </div>
                                )}
                              </div>

                              {/* Base & Scaled Ingredients */}
                              {recipe.recipe_ingredients &&
                                recipe.recipe_ingredients.length > 0 && (
                                  <div style={{ marginBottom: recipe.notes ? 8 : 0 }}>
                                    {/* Base Ingredients */}
                                    <div
                                      style={{
                                        color: "#5a6a5a",
                                        fontSize: 10,
                                        textTransform: "uppercase",
                                        letterSpacing: 1,
                                        marginBottom: 4,
                                      }}
                                    >
                                      Ingredients
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "4px 16px",
                                        marginBottom: 12,
                                      }}
                                    >
                                      {recipe.recipe_ingredients.map((ing) => (
                                        <div
                                          key={`base-${ing.id}`}
                                          style={{
                                            color: "#8a9a8a",
                                            fontSize: 12,
                                          }}
                                        >
                                          {ing.quantity}
                                          {ing.unit || "x"} {ing.ingredient_name}
                                        </div>
                                      ))}
                                    </div>

                                    {/* Scaled Ingredients */}
                                    <div
                                      style={{
                                        color: "#5a6a5a",
                                        fontSize: 10,
                                        textTransform: "uppercase",
                                        letterSpacing: 1,
                                        marginBottom: 4,
                                      }}
                                    >
                                      Total Ingredients (scaled ×{item.quantity})
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "4px 16px",
                                      }}
                                    >
                                      {recipe.recipe_ingredients.map((ing) => {
                                        const scaled =
                                          (parseFloat(ing.quantity) || 0) *
                                          (item.quantity || 1);
                                        return (
                                          <div
                                            key={`scaled-${ing.id}`}
                                            style={{
                                              color: "#8a9a8a",
                                              fontSize: 12,
                                            }}
                                          >
                                            {scaled}
                                            {ing.unit || "x"} {ing.ingredient_name}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                              {recipe.notes && (
                                <div
                                  style={{
                                    color: "#5a6a5a",
                                    fontSize: 11,
                                    fontStyle: "italic",
                                    marginTop: 4,
                                  }}
                                >
                                  Note: {recipe.notes}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div
                              style={{
                                color: "#5a6a5a",
                                fontSize: 12,
                                fontStyle: "italic",
                                marginTop: 6,
                              }}
                            >
                              No recipe on file
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Action Buttons ─────────────────────────────── */}
                  <div
                    style={{
                      borderTop: "1px solid rgba(180,140,20,0.1)",
                      paddingTop: 16,
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    {/* Next Status Transition */}
                    {transition && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdvanceStatus(order);
                        }}
                        disabled={mutating}
                        style={{
                          ...goldBtnStyle,
                          opacity: mutating ? 0.6 : 1,
                        }}
                      >
                        {transition.label}
                      </button>
                    )}

                    {/* Cancel Order */}
                    {canCancel && cancellingId !== order.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCancellingId(order.id);
                          setCancelReason("");
                        }}
                        disabled={mutating}
                        style={{
                          ...redBtnStyle,
                          opacity: mutating ? 0.6 : 1,
                        }}
                      >
                        Cancel Order
                      </button>
                    )}

                    {/* Cancel Reason Input */}
                    {cancellingId === order.id && (
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          flex: 1,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          placeholder="Cancellation reason (required)..."
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <button
                          onClick={() => handleCancelOrder(order)}
                          disabled={mutating || !cancelReason.trim()}
                          style={{
                            ...redBtnStyle,
                            opacity:
                              mutating || !cancelReason.trim() ? 0.5 : 1,
                          }}
                        >
                          Confirm Cancel
                        </button>
                        <button
                          onClick={() => {
                            setCancellingId(null);
                            setCancelReason("");
                          }}
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            color: "#8a9a8a",
                            border: "1px solid rgba(180,140,20,0.15)",
                            borderRadius: 3,
                            padding: "8px 14px",
                            cursor: "pointer",
                            fontFamily: "Georgia, serif",
                            fontSize: 12,
                          }}
                        >
                          Nevermind
                        </button>
                      </div>
                    )}

                    {/* CFO: Create Sales Transaction */}
                    {showFinancial &&
                      onCreateTransaction &&
                      order.status === "Delivered" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateTransaction({
                              amount: order.total_cost,
                              memo:
                                "Sales Order #" + order.id.slice(0, 8),
                              orderId: order.id,
                            });
                          }}
                          disabled={mutating}
                          style={{
                            ...goldBtnStyle,
                            background:
                              "linear-gradient(135deg, #50c860, #308030)",
                            color: "#fff",
                            opacity: mutating ? 0.6 : 1,
                          }}
                        >
                          Create Sales Transaction
                        </button>
                      )}
                  </div>

                  {/* ── Assign Order Dropdown ──────────────────────── */}
                  {showAssign && (
                    <div
                      style={{
                        marginTop: 14,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          color: "#5a6a5a",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        Assign To:
                      </div>
                      <select
                        value={order.assigned_to || ""}
                        onChange={(e) =>
                          handleAssign(order, e.target.value || null)
                        }
                        style={{
                          ...inputStyle,
                          width: "auto",
                          minWidth: 160,
                          cursor: "pointer",
                        }}
                      >
                        <option value="">Unassigned</option>
                        {brewers.map((b) => (
                          <option key={b.username} value={b.username}>
                            {b.username} ({b.position})
                          </option>
                        ))}
                      </select>
                      {order.assigned_to && (
                        <span style={{ color: "#8a9a8a", fontSize: 12 }}>
                          Currently: {order.assigned_to}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* ── Add Order Modal ─────────────────────────────────────────────── */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#0d0a1a",
              border: "1px solid rgba(180,140,20,0.3)",
              borderRadius: 4,
              width: 600,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 32,
            }}
          >
            <h2 style={{ color: "#c8a820", marginTop: 0, marginBottom: 20 }}>
              Add Order
            </h2>
            <form
              onSubmit={handleAddOrder}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>IC Name <span style={{ color: "#e05050" }}>*</span></label>
                  <input required value={addForm.customer_ic_name} onChange={e => setAddForm({...addForm, customer_ic_name: e.target.value})} placeholder="In-game Name" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>Discord Username (Optional)</label>
                  <input value={addForm.customer_discord} onChange={e => setAddForm({...addForm, customer_discord: e.target.value})} placeholder="Optional" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>Delivery Method</label>
                  <select value={addForm.delivery_method} onChange={e => setAddForm({...addForm, delivery_method: e.target.value})} style={inputStyle}>
                    <option value="Pickup">Pickup</option>
                    <option value="Delivery">Delivery</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>Delivery Location</label>
                  <input value={addForm.delivery_location} onChange={e => setAddForm({...addForm, delivery_location: e.target.value})} style={{ ...inputStyle, opacity: addForm.delivery_method === "Delivery" ? 1 : 0.5 }} disabled={addForm.delivery_method !== "Delivery"} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>Status</label>
                  <select value={addForm.status} onChange={e => setAddForm({...addForm, status: e.target.value})} style={inputStyle}>
                    {STATUS_LIST.filter(s => s !== "All").map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>Notes (Optional)</label>
                <textarea value={addForm.notes} onChange={e => setAddForm({...addForm, notes: e.target.value})} placeholder="Any special requests or details..." style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} />
              </div>

              <div style={{ borderTop: "1px solid rgba(180,140,20,0.15)", paddingTop: 16 }}>
                <label style={{ display: "block", color: "#c8a820", fontSize: 12, marginBottom: 12, textTransform: "uppercase", fontWeight: "bold" }}>Products</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto", paddingRight: 8 }}>
                  {products.map(p => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: 3 }}>
                      <div>
                        <span style={{ color: "#e8e0d0", fontSize: 13 }}>{p.name}</span>
                        <span style={{ color: "#8a9a8a", fontSize: 11, marginLeft: 8 }}>{fmt(p.price)}</span>
                      </div>
                      <input 
                        type="number" 
                        min="0" 
                        value={addQuantities[p.id] || ""} 
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setAddQuantities(prev => ({ ...prev, [p.id]: val }));
                        }}
                        style={{ ...inputStyle, width: 60, padding: "4px 8px", textAlign: "center" }} 
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid #5a6a5a",
                    color: "#8a9a8a",
                    padding: "8px 16px",
                    borderRadius: 3,
                    cursor: "pointer",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  style={{ ...goldBtnStyle, opacity: submittingAdd ? 0.6 : 1 }}
                >
                  {submittingAdd ? "Saving..." : "Add Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
