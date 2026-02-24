import { useState, useEffect, useCallback } from "react";
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

const ALL_STATUSES = [
  "Submitted", "Awaiting Payment", "Confirmed", "In Production", 
  "Ready", "Delivered", "Cancelled"
];

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

export default function MyOrders({ user }) {
  const [orders, setOrders] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState([]);
  const [mutating, setMutating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const isManager = ["Manager", "CEO", "CFO"].includes(user.role || user.position);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [assignmentsRes, recipesRes] = await Promise.all([
      supabase.from("order_assignments").select("order_id").eq("account_id", user.id),
      supabase.from("recipes").select("*, recipe_ingredients(*)")
    ]);
    
    setRecipes(recipesRes.data || []);

    if (assignmentsRes.error) {
      console.error("Error loading assignments:", assignmentsRes.error);
    } else {
      const orderIds = (assignmentsRes.data || []).map(a => a.order_id);
      if (orderIds.length > 0) {
        const { data: ordersData, error: ordersErr } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .in("id", orderIds)
          .order("created_at", { ascending: false });
        if (!ordersErr) setOrders(ordersData || []);
      } else {
        setOrders([]);
      }
    }
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleExpanded = (id) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const updateStatus = async (orderId, newStatus) => {
    setMutating(true);
    const { error } = await supabase.from("orders").update({
      status: newStatus,
      status_updated_at: new Date().toISOString()
    }).eq("id", orderId);

    if (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    } else {
      loadData();
    }
    setMutating(false);
  };

  const getRecipe = (productId) => recipes.find(r => r.product_id === productId);

  const generateCombinedShoppingList = (items) => {
    const list = {};
    items.forEach(item => {
      const recipe = getRecipe(item.product_id);
      if (recipe && recipe.recipe_ingredients) {
        recipe.recipe_ingredients.forEach(ing => {
          const scaled = (parseFloat(ing.quantity) || 0) * (item.quantity || 1);
          const key = `${ing.unit || ""} ${ing.ingredient_name}`.trim();
          list[key] = (list[key] || 0) + scaled;
        });
      }
    });
    return list;
  };

  const handleCopyShoppingList = (items) => {
    const list = generateCombinedShoppingList(items);
    if (Object.keys(list).length === 0) return;
    
    let text = "COMBINED MATERIALS FOR THIS ORDER:\n";
    Object.entries(list).forEach(([key, qty]) => {
      text += `  ${qty}x  ${key}\n`;
    });
    
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) return <div style={{ color: "#5a6a5a", padding: "40px", textAlign: "center" }}>Loading your orders...</div>;

  return (
    <div style={{ color: "#e8e0d0" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>My Orders</div>
        <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 4 }}>Orders you are actively working on</div>
      </div>

      {orders.length === 0 ? (
        <div style={{ color: "#5a6a5a", textAlign: "center", padding: "40px 0" }}>
          You have no assigned orders. Check the Production Queue to join one.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map(order => {
            const expanded = expandedIds.includes(order.id);
            const items = order.order_items || [];
            const combinedList = generateCombinedShoppingList(items);
            const statusColor = STATUS_COLORS[order.status] || "#8a9a8a";

            return (
              <div key={order.id} style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, overflow: "hidden" }}>
                {/* Header Row */}
                <div onClick={() => toggleExpanded(order.id)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", cursor: "pointer", flexWrap: "wrap" }}>
                  <div style={{ color: "#c8a820", fontFamily: "Consolas, monospace", fontSize: 13, fontWeight: "bold", minWidth: 80 }}>
                    #GB-{order.id.slice(0, 4).toUpperCase()}
                  </div>
                  <div style={{ color: "#e8e0d0", fontSize: 13, minWidth: 120 }}>
                    {order.customer_ic_name}
                  </div>
                  <div style={{ color: "#8a9a8a", fontSize: 12, flex: 1, minWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {items.length === 0 ? "No items" : items.map(i => `${i.quantity}x ${i.product_name}`).join(", ")}
                  </div>
                  <div style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}44`, borderRadius: 3, padding: "3px 10px", fontSize: 11, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase", minWidth: 100, textAlign: "center" }}>
                    {order.status}
                  </div>
                  <div style={{ color: "#5a6a5a", fontSize: 14, transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                    ▶
                  </div>
                </div>

                {/* Expanded Details */}
                {expanded && (
                  <div style={{ borderTop: "1px solid rgba(180,140,20,0.15)", padding: "20px 24px" }}>
                    {/* Status Controls */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px dashed rgba(180,140,20,0.1)" }}>
                      <div style={{ color: "#8a9a8a", fontSize: 12 }}>Manage Order Status:</div>
                      {isManager ? (
                        <select 
                          value={order.status} 
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          disabled={mutating}
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,140,20,0.4)", color: "#e8e0d0", padding: "6px 12px", borderRadius: 3, outline: "none", cursor: mutating ? "not-allowed" : "pointer" }}
                        >
                          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <div>
                          {order.status === "In Production" ? (
                            <button 
                              onClick={() => updateStatus(order.id, "Ready")} 
                              disabled={mutating}
                              style={{ ...btnStyle, background: "linear-gradient(135deg, #50c860, #308030)", color: "#fff", opacity: mutating ? 0.6 : 1 }}
                            >
                              Mark as Ready
                            </button>
                          ) : order.status === "Ready" ? (
                            <span style={{ color: "#e09030", fontStyle: "italic", fontSize: 12 }}>Awaiting delivery confirmation</span>
                          ) : (
                            <span style={{ color: "#5a6a5a", fontSize: 12 }}>{order.status}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Recipe Breakdowns */}
                    {items.map(item => {
                      const recipe = getRecipe(item.product_id);
                      return (
                        <div key={item.id} style={{ marginBottom: 20 }}>
                          <div style={{ color: "#c8a820", fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                            {item.product_name} × {item.quantity}
                          </div>
                          {recipe ? (
                            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(180,140,20,0.1)", borderRadius: 3, padding: "16px", fontFamily: "monospace", fontSize: 12, color: "#8a9a8a" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 4, marginBottom: 16 }}>
                                <div>Difficulty:</div><div style={{ color: "#e8e0d0" }}>{recipe.difficulty}</div>
                                <div>Cooking Time:</div><div style={{ color: "#e8e0d0" }}>{recipe.cooking_time || "—"}</div>
                                <div>Distill Runs:</div><div style={{ color: "#e8e0d0" }}>{recipe.distill_runs != null ? recipe.distill_runs : "—"}</div>
                                <div>Age:</div><div style={{ color: "#e8e0d0" }}>{recipe.age_requirement || "—"}</div>
                                <div>Barrel Type:</div><div style={{ color: "#e8e0d0" }}>{recipe.barrel_type || "—"}</div>
                              </div>
                              <div style={{ marginBottom: 4, color: "#5a6a5a" }}>INGREDIENTS (scaled to qty {item.quantity}):</div>
                              {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 ? (
                                <div style={{ marginBottom: 12, paddingLeft: 12, borderLeft: "2px solid rgba(180,140,20,0.2)" }}>
                                  {recipe.recipe_ingredients.map(ing => (
                                    <div key={ing.id} style={{ color: "#e8e0d0" }}>
                                      {(parseFloat(ing.quantity) || 0) * item.quantity}x {ing.unit || ""} {ing.ingredient_name}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ fontStyle: "italic", marginBottom: 12 }}>No ingredients specified.</div>
                              )}
                              {recipe.notes && (
                                <div>
                                  <div style={{ color: "#5a6a5a" }}>NOTES:</div>
                                  <div style={{ color: "#e8e0d0", whiteSpace: "pre-wrap" }}>{recipe.notes}</div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ color: "#5a6a5a", fontStyle: "italic", fontSize: 12 }}>No recipe found.</div>
                          )}
                        </div>
                      )
                    })}

                    {/* Combined Shopping List */}
                    {Object.keys(combinedList).length > 0 && (
                      <div style={{ background: "rgba(15,10,30,0.95)", border: "1px solid rgba(180,140,20,0.3)", borderRadius: 4, padding: "16px", marginTop: 24 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <div style={{ color: "#e8e0d0", fontSize: 13, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase" }}>Combined Materials For This Order:</div>
                          <button onClick={() => handleCopyShoppingList(items)} style={{ background: "transparent", border: "1px solid rgba(180,140,20,0.4)", color: "#c8a820", borderRadius: 3, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>
                            {copySuccess ? "✓ Copied!" : "Copy Shopping List"}
                          </button>
                        </div>
                        <div style={{ fontFamily: "monospace", fontSize: 13, color: "#8a9a8a", paddingLeft: 12, borderLeft: "2px solid rgba(180,140,20,0.3)" }}>
                          {Object.entries(combinedList).map(([key, qty]) => (
                            <div key={key} style={{ marginBottom: 4 }}>
                              <span style={{ color: "#c8a820" }}>{qty}x</span> {key}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
