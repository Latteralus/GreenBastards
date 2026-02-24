import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
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

export default function BrewerDashboard({ user, onLogout }) {
  const [active, setActive] = useState("myorders");
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [queueOrders, setQueueOrders] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIds, setExpandedIds] = useState([]);
  const [mutating, setMutating] = useState(false);

  // ─── Data Fetching ────────────────────────────────────────────────────────────

  const loadMyOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignedRes, unassignedRes, recipesRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("assigned_to", user.displayName)
          .order("created_at", { ascending: true }),
        supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("status", "Confirmed")
          .is("assigned_to", null),
        supabase
          .from("recipes")
          .select("*, recipe_ingredients(*)"),
      ]);

      if (assignedRes.error) throw assignedRes.error;
      if (unassignedRes.error) throw unassignedRes.error;
      if (recipesRes.error) throw recipesRes.error;

      setAssignedOrders(assignedRes.data || []);
      setUnassignedOrders(unassignedRes.data || []);
      setRecipes(recipesRes.data || []);
    } catch (err) {
      console.error("Error loading brewer data:", err);
      setError("Failed to load orders.");
    }
    setLoading(false);
  }, [user.displayName]);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
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
      setError("Failed to load production queue.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (active === "myorders") loadMyOrders();
    else if (active === "queue") loadQueue();
  }, [active, loadMyOrders, loadQueue]);

  // ─── Actions ──────────────────────────────────────────────────────────────────

  async function handleClaimOrder(order) {
    setMutating(true);
    const { error: err } = await supabase
      .from("orders")
      .update({
        assigned_to: user.displayName,
        status: "In Production",
        status_updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (err) {
      console.error("Error claiming order:", err);
      setError("Failed to claim order.");
    }
    await loadMyOrders();
    setMutating(false);
  }

  async function handleMarkReady(order) {
    setMutating(true);
    const { error: err } = await supabase
      .from("orders")
      .update({
        status: "Ready",
        status_updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (err) {
      console.error("Error updating order:", err);
      setError("Failed to update order status.");
    }
    await loadMyOrders();
    setMutating(false);
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

  // ─── Nav Items ────────────────────────────────────────────────────────────────

  const navItems = [
    { id: "myorders", label: "My Orders", icon: "📋", badge: assignedOrders.length > 0 ? assignedOrders.length : null },
    { id: "queue", label: "Production Queue", icon: "⚗" },
  ];

  const pageStyle = {
    marginLeft: 220,
    minHeight: "100vh",
    background: "linear-gradient(160deg, #0d0a1a 0%, #111820 100%)",
    padding: "36px 40px",
    fontFamily: "Georgia, serif",
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

  const greenBtnStyle = {
    ...goldBtnStyle,
    background: "linear-gradient(135deg, #50c860, #308030)",
    color: "#fff",
  };

  // ─── My Orders Page ───────────────────────────────────────────────────────────

  function renderMyOrders() {
    if (loading) {
      return (
        <div style={{ color: "#5a6a5a", textAlign: "center", padding: "60px 0", fontSize: 16 }}>
          Loading orders...
        </div>
      );
    }

    if (error && assignedOrders.length === 0) {
      return (
        <div style={{ color: "#e05050", textAlign: "center", padding: "60px 0", fontSize: 16 }}>
          {error}
        </div>
      );
    }

    return (
      <div style={{ color: "#e8e0d0" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>
            My Orders
          </div>
          <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 6 }}>
            {assignedOrders.length} order{assignedOrders.length !== 1 ? "s" : ""} assigned to you
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{ background: "rgba(224,80,80,0.1)", border: "1px solid rgba(224,80,80,0.3)", color: "#e05050", borderRadius: 4, padding: "10px 16px", marginBottom: 20, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Unassigned Orders Section */}
        {unassignedOrders.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ color: "#e09030", fontSize: 16, fontWeight: "bold", letterSpacing: 1 }}>
                Available Orders
              </div>
              <div style={{ background: "rgba(224,144,48,0.15)", color: "#e09030", fontSize: 11, fontWeight: "bold", borderRadius: 10, padding: "2px 8px" }}>
                {unassignedOrders.length}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {unassignedOrders.map((order) => {
                const items = order.order_items || [];
                return (
                  <div key={order.id} style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(224,144,48,0.2)", borderRadius: 4, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ color: "#c8a820", fontFamily: "Consolas, monospace", fontSize: 13, fontWeight: "bold", minWidth: 80 }}>
                      #{order.id.slice(0, 8)}
                    </div>
                    <div style={{ color: "#e8e0d0", fontSize: 13, minWidth: 120 }}>
                      {order.customer_ic_name || "Unknown"}
                    </div>
                    <div style={{ color: "#8a9a8a", fontSize: 12, flex: 1, minWidth: 150 }}>
                      {itemsSummary(items)}
                    </div>
                    <div style={{ color: "#e8e0d0", fontSize: 13, fontWeight: "bold", minWidth: 80, textAlign: "right" }}>
                      {fmt(parseFloat(order.total_cost) || 0)}
                    </div>
                    <button
                      onClick={() => handleClaimOrder(order)}
                      disabled={mutating}
                      style={{ ...goldBtnStyle, opacity: mutating ? 0.6 : 1 }}
                    >
                      Claim Order
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Assigned Orders Section */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ color: "#c8a820", fontSize: 16, fontWeight: "bold", letterSpacing: 1 }}>
              Assigned Orders
            </div>
            <div style={{ background: "rgba(200,168,32,0.15)", color: "#c8a820", fontSize: 11, fontWeight: "bold", borderRadius: 10, padding: "2px 8px" }}>
              {assignedOrders.length}
            </div>
          </div>

          {assignedOrders.length === 0 && (
            <div style={{ color: "#5a6a5a", textAlign: "center", padding: "40px 0", fontSize: 14 }}>
              No orders assigned to you yet. Claim one from the Available Orders above!
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {assignedOrders.map((order) => {
              const expanded = expandedIds.includes(order.id);
              const items = order.order_items || [];
              const statusColor = STATUS_COLORS[order.status] || "#8a9a8a";

              return (
                <div key={order.id} style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, overflow: "hidden" }}>
                  {/* Collapsed Row */}
                  <div
                    onClick={() => toggleExpanded(order.id)}
                    style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", cursor: "pointer", flexWrap: "wrap" }}
                  >
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
                    <div style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}44`, borderRadius: 3, padding: "3px 10px", fontSize: 11, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase", minWidth: 100, textAlign: "center" }}>
                      {order.status}
                    </div>
                    <div style={{ color: "#5a6a5a", fontSize: 11, minWidth: 140, textAlign: "right" }}>
                      {formatDate(order.created_at)}
                    </div>
                    <div style={{ color: "#5a6a5a", fontSize: 14, transition: "transform 0.2s", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>
                      ▶
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expanded && (
                    <div style={{ borderTop: "1px solid rgba(180,140,20,0.15)", padding: "20px 24px" }}>
                      {/* Customer Info Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px 24px", marginBottom: 20 }}>
                        <div>
                          <div style={{ color: "#5a6a5a", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Customer Discord</div>
                          <div style={{ color: "#e8e0d0", fontSize: 13 }}>{order.customer_discord || "—"}</div>
                        </div>
                        <div>
                          <div style={{ color: "#5a6a5a", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Delivery Method</div>
                          <div style={{ color: "#e8e0d0", fontSize: 13 }}>{order.delivery_method || "—"}</div>
                        </div>
                        <div>
                          <div style={{ color: "#5a6a5a", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Delivery Location</div>
                          <div style={{ color: "#e8e0d0", fontSize: 13 }}>{order.delivery_location || "—"}</div>
                        </div>
                        <div>
                          <div style={{ color: "#5a6a5a", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Payment Confirmed</div>
                          <div style={{ fontSize: 13 }}>
                            {order.payment_confirmed
                              ? <span style={{ color: "#50c860" }}>✓ Confirmed</span>
                              : <span style={{ color: "#e05050" }}>✗ Not Confirmed</span>
                            }
                          </div>
                        </div>
                        {order.notes && (
                          <div>
                            <div style={{ color: "#5a6a5a", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Notes</div>
                            <div style={{ color: "#8a9a8a", fontSize: 13, whiteSpace: "pre-wrap" }}>{order.notes}</div>
                          </div>
                        )}
                      </div>

                      {/* Recipe Breakdown */}
                      <div style={{ borderTop: "1px solid rgba(180,140,20,0.1)", paddingTop: 16, marginBottom: 20 }}>
                        <div style={{ color: "#c8a820", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, fontWeight: "bold" }}>
                          Recipe Breakdown
                        </div>

                        {items.map((item) => {
                          const recipe = getRecipeForProduct(item.product_id);
                          return (
                            <div key={item.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(180,140,20,0.1)", borderRadius: 3, padding: "14px 18px", marginBottom: 10 }}>
                              {/* Item header */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: recipe ? 10 : 0 }}>
                                <div>
                                  <span style={{ color: "#e8e0d0", fontSize: 14, fontWeight: "bold" }}>{item.product_name}</span>
                                  <span style={{ color: "#8a9a8a", fontSize: 12, marginLeft: 12 }}>×{item.quantity} @ {fmt(parseFloat(item.unit_price) || 0)} each</span>
                                </div>
                                <div style={{ color: "#c8a820", fontSize: 13, fontWeight: "bold" }}>
                                  {fmt(parseFloat(item.subtotal) || 0)}
                                </div>
                              </div>

                              {/* Recipe details */}
                              {recipe ? (
                                <div style={{ borderTop: "1px solid rgba(180,140,20,0.08)", paddingTop: 10 }}>
                                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 8 }}>
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

                                  {/* Scaled Ingredients */}
                                  {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 && (
                                    <div style={{ marginBottom: recipe.notes ? 8 : 0 }}>
                                      <div style={{ color: "#5a6a5a", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                                        Ingredients (scaled ×{item.quantity})
                                      </div>
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
                                        {recipe.recipe_ingredients.map((ing) => {
                                          const scaled = (parseFloat(ing.quantity) || 0) * (item.quantity || 1);
                                          return (
                                            <div key={ing.id} style={{ color: "#8a9a8a", fontSize: 12 }}>
                                              {scaled}{ing.unit || ""} {ing.ingredient_name}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {recipe.notes && (
                                    <div style={{ color: "#5a6a5a", fontSize: 11, fontStyle: "italic", marginTop: 4 }}>
                                      Note: {recipe.notes}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div style={{ color: "#5a6a5a", fontSize: 12, fontStyle: "italic", marginTop: 6 }}>
                                  No recipe on file
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Status Update Button */}
                      {order.status === "In Production" && (
                        <div style={{ borderTop: "1px solid rgba(180,140,20,0.1)", paddingTop: 16 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMarkReady(order); }}
                            disabled={mutating}
                            style={{ ...greenBtnStyle, opacity: mutating ? 0.6 : 1 }}
                          >
                            ✓ Mark as Ready
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Production Queue Page ────────────────────────────────────────────────────

  function renderQueue() {
    if (loading) {
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

        {queueOrders.length === 0 && (
          <div style={{ color: "#5a6a5a", textAlign: "center", padding: "40px 0", fontSize: 14 }}>
            No orders currently in production.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {queueOrders.map((order) => {
            const items = order.order_items || [];
            const isMe = order.assigned_to === user.displayName;
            const statusColor = STATUS_COLORS["In Production"];

            return (
              <div key={order.id} style={{
                background: "rgba(15,10,30,0.8)",
                border: `1px solid ${isMe ? "rgba(200,168,32,0.3)" : "rgba(180,140,20,0.15)"}`,
                borderLeft: isMe ? "3px solid #c8a820" : "1px solid rgba(180,140,20,0.15)",
                borderRadius: 4,
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}>
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
                <div style={{ color: isMe ? "#c8a820" : "#8a9a8a", fontSize: 12, minWidth: 90 }}>
                  {order.assigned_to || "Unassigned"}
                  {isMe && <span style={{ color: "#c8a820", fontSize: 10, marginLeft: 4 }}>(you)</span>}
                </div>
                <div style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}44`, borderRadius: 3, padding: "3px 10px", fontSize: 11, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase" }}>
                  In Production
                </div>
              </div>
            );
          })}
        </div>
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
        {active === "myorders" && renderMyOrders()}
        {active === "queue" && renderQueue()}
      </div>
    </div>
  );
}
