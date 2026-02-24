import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { fmt } from "../../helpers";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ─── CHART TOOLTIP ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, prefix }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div
        style={{
          background: "rgba(10,7,20,0.95)",
          border: "1px solid rgba(180,140,20,0.3)",
          borderRadius: 3,
          padding: "8px 14px",
        }}
      >
        <div style={{ color: "#c8a820", fontSize: 13 }}>
          {prefix === "$" ? fmt(val) : `${val} orders`}
        </div>
        <div style={{ color: "#5a6a5a", fontSize: 11 }}>
          {payload[0].payload.date}
        </div>
      </div>
    );
  }
  return null;
};

// ─── STATUS COLOURS ───────────────────────────────────────────────────────────
const STATUS_COLORS = {
  Submitted: "#e09030",
  "Awaiting Payment": "#e09030",
  Confirmed: "#3498db",
  "In Production": "#9b59b6",
  Ready: "#50c860",
  Delivered: "#50c860",
};

const PIPELINE_STATUSES = [
  "Submitted",
  "Awaiting Payment",
  "Confirmed",
  "In Production",
  "Ready",
  "Delivered",
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function ForecastingPage() {
  const [tab, setTab] = useState("shopping");
  const [orders, setOrders] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [copied, setCopied] = useState(false);

  // ── Fetch data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [ordersRes, recipesRes] = await Promise.all([
          supabase
            .from("orders")
            .select("*, order_items(*)")
            .order("created_at", { ascending: false }),
          supabase.from("recipes").select("*, recipe_ingredients(*)"),
        ]);

        if (ordersRes.error) {
          console.error("Orders fetch error:", ordersRes.error);
          throw ordersRes.error;
        }
        if (recipesRes.error) {
          console.error("Recipes fetch error:", recipesRes.error);
          throw recipesRes.error;
        }

        setOrders(ordersRes.data || []);
        setRecipes(recipesRes.data || []);
      } catch (e) {
        console.error("ForecastingPage load error:", e);
        setError(e.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const recipeByProduct = {};
  recipes.forEach((r) => {
    recipeByProduct[r.product_id] = r;
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // ══════════════════════════════════════════════════════════════════════════════
  // TAB 1: SHOPPING LIST
  // ══════════════════════════════════════════════════════════════════════════════
  const activeOrders = orders.filter(
    (o) => o.status === "Confirmed" || o.status === "In Production"
  );

  const ingredientMap = {};
  activeOrders.forEach((order) => {
    (order.order_items || []).forEach((item) => {
      const recipe = recipeByProduct[item.product_id];
      if (!recipe || !recipe.recipe_ingredients) return;
      recipe.recipe_ingredients.forEach((ri) => {
        const key = `${ri.ingredient_name}||${ri.unit}`;
        if (!ingredientMap[key]) {
          ingredientMap[key] = {
            ingredient_name: ri.ingredient_name,
            unit: ri.unit,
            quantity: 0,
          };
        }
        ingredientMap[key].quantity += (ri.quantity || 0) * (item.quantity || 1);
      });
    });
  });

  const shoppingList = Object.values(ingredientMap).sort((a, b) =>
    a.ingredient_name.localeCompare(b.ingredient_name)
  );

  function formatShoppingText() {
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const lines = shoppingList.map(
      (i) => `${i.quantity}${i.unit} ${i.ingredient_name}`
    );
    return [
      "🍺 Green Bastards Brewery — Shopping List",
      `Generated: ${dateStr}`,
      `Active Orders: ${activeOrders.length}`,
      "─────────────────────",
      ...lines,
      "─────────────────────",
      `Total: ${shoppingList.length} ingredients`,
    ].join("\n");
  }

  function handleCopy() {
    navigator.clipboard.writeText(formatShoppingText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function toggleCheck(key) {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // TAB 2: ORDER PIPELINE
  // ══════════════════════════════════════════════════════════════════════════════
  const nonCancelled = orders.filter((o) => o.status !== "Cancelled");
  const pipelineActive = nonCancelled.filter((o) => o.status !== "Delivered");
  const deliveredThisMonth = nonCancelled.filter(
    (o) =>
      o.status === "Delivered" &&
      new Date(o.status_updated_at || o.created_at) >= monthStart
  );

  const totalPipelineValue = pipelineActive.reduce(
    (s, o) => s + (parseFloat(o.total_cost) || 0),
    0
  );
  const deliveredMonthValue = deliveredThisMonth.reduce(
    (s, o) => s + (parseFloat(o.total_cost) || 0),
    0
  );

  const columnData = {};
  PIPELINE_STATUSES.forEach((status) => {
    const matching = nonCancelled.filter((o) => o.status === status);
    columnData[status] = {
      orders: matching,
      count: matching.length,
      total: matching.reduce(
        (s, o) => s + (parseFloat(o.total_cost) || 0),
        0
      ),
    };
  });

  // Average time per stage (best-effort)
  function computeAvgDays(status) {
    const statusIdx = PIPELINE_STATUSES.indexOf(status);
    // Orders that are currently in this stage or have passed it
    const relevant = nonCancelled.filter((o) => {
      const oIdx = PIPELINE_STATUSES.indexOf(o.status);
      return oIdx >= statusIdx;
    });
    if (relevant.length === 0) return null;

    // For orders past this stage, use status_updated_at - created_at as rough estimate
    // For orders in this stage, use now - status_updated_at
    const durations = relevant
      .map((o) => {
        const oIdx = PIPELINE_STATUSES.indexOf(o.status);
        if (oIdx === statusIdx && o.status_updated_at) {
          // Currently in this stage
          return (
            (now - new Date(o.status_updated_at)) / (1000 * 60 * 60 * 24)
          );
        } else if (oIdx > statusIdx && o.status_updated_at && o.created_at) {
          // Passed this stage — rough estimate
          const total =
            (new Date(o.status_updated_at) - new Date(o.created_at)) /
            (1000 * 60 * 60 * 24);
          // Distribute across stages passed
          const stagesPassed = oIdx; // stages from 0..oIdx-1
          return stagesPassed > 0 ? total / stagesPassed : total;
        }
        return null;
      })
      .filter((d) => d !== null && d >= 0);

    if (durations.length === 0) return null;
    const avg = durations.reduce((s, d) => s + d, 0) / durations.length;
    return avg;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // TAB 3: REVENUE FORECAST
  // ══════════════════════════════════════════════════════════════════════════════
  const guaranteedStatuses = ["Confirmed", "In Production", "Ready"];
  const potentialStatuses = ["Submitted", "Awaiting Payment"];

  const guaranteed = orders
    .filter((o) => guaranteedStatuses.includes(o.status))
    .reduce((s, o) => s + (parseFloat(o.total_cost) || 0), 0);

  const potential = orders
    .filter((o) => potentialStatuses.includes(o.status))
    .reduce((s, o) => s + (parseFloat(o.total_cost) || 0), 0);

  const deliveredRevenue = orders
    .filter(
      (o) =>
        o.status === "Delivered" && new Date(o.created_at) >= monthStart
    )
    .reduce((s, o) => s + (parseFloat(o.total_cost) || 0), 0);

  // Past 30 days charts
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentOrders = orders.filter(
    (o) => new Date(o.created_at) >= thirtyDaysAgo
  );

  function buildDayMap() {
    const dayMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label =
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0");
      dayMap[key] = { date: label, isoDate: key, count: 0, revenue: 0 };
    }
    recentOrders.forEach((o) => {
      const key = (o.created_at || "").slice(0, 10);
      if (dayMap[key]) {
        dayMap[key].count += 1;
        dayMap[key].revenue += parseFloat(o.total_cost) || 0;
      }
    });
    return Object.values(dayMap);
  }

  const chartData = buildDayMap();

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════
  const tabStyle = (key) => ({
    padding: "10px 24px",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "Georgia, serif",
    letterSpacing: 1,
    border: "none",
    borderBottom:
      tab === key ? "2px solid #c8a820" : "2px solid transparent",
    background: "transparent",
    color: tab === key ? "#c8a820" : "#5a6a5a",
    fontWeight: tab === key ? "bold" : "normal",
    transition: "all 0.2s",
  });

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          color: "#8a9a8a",
          fontFamily: "Georgia, serif",
          textAlign: "center",
        }}
      >
        Loading forecasting data…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 40,
          fontFamily: "Georgia, serif",
          textAlign: "center",
        }}
      >
        <div style={{ color: "#e05050", fontSize: 16, marginBottom: 8 }}>
          Error loading data
        </div>
        <div style={{ color: "#8a9a8a", fontSize: 13 }}>{error}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "32px 28px",
        fontFamily: "Georgia, serif",
        color: "#e8e0d0",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 26,
            color: "#c8a820",
            margin: 0,
            letterSpacing: 2,
            fontWeight: "bold",
          }}
        >
          ⚗ Forecasting
        </h1>
        <div
          style={{
            color: "#5a6a5a",
            fontSize: 12,
            letterSpacing: 1,
            marginTop: 4,
          }}
        >
          SHOPPING LIST • PIPELINE • REVENUE
        </div>
      </div>

      {/* Tab Bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid rgba(180,140,20,0.15)",
          marginBottom: 28,
        }}
      >
        <button style={tabStyle("shopping")} onClick={() => setTab("shopping")}>
          Shopping List
        </button>
        <button style={tabStyle("pipeline")} onClick={() => setTab("pipeline")}>
          Order Pipeline
        </button>
        <button style={tabStyle("revenue")} onClick={() => setTab("revenue")}>
          Revenue Forecast
        </button>
      </div>

      {/* ── TAB 1: SHOPPING LIST ──────────────────────────────────────────────── */}
      {tab === "shopping" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 20,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 20,
                  color: "#e8e0d0",
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                Material Requirements
              </h2>
              <div style={{ color: "#5a6a5a", fontSize: 12, letterSpacing: 1 }}>
                {activeOrders.length} active order
                {activeOrders.length !== 1 ? "s" : ""} contributing •{" "}
                {shoppingList.length} unique ingredient
                {shoppingList.length !== 1 ? "s" : ""}
              </div>
            </div>
            <button
              onClick={handleCopy}
              style={{
                background: copied
                  ? "rgba(80,200,96,0.15)"
                  : "rgba(200,168,32,0.1)",
                border: copied
                  ? "1px solid rgba(80,200,96,0.3)"
                  : "1px solid rgba(180,140,20,0.3)",
                color: copied ? "#50c860" : "#c8a820",
                padding: "8px 18px",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "Georgia, serif",
                letterSpacing: 1,
                transition: "all 0.2s",
              }}
            >
              {copied ? "✓ Copied!" : "📋 Copy to Clipboard"}
            </button>
          </div>

          {shoppingList.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#5a6a5a",
                fontSize: 14,
                background: "rgba(15,10,30,0.8)",
                border: "1px solid rgba(180,140,20,0.15)",
                borderRadius: 4,
              }}
            >
              No active orders requiring materials.
            </div>
          ) : (
            <div
              style={{
                background: "rgba(15,10,30,0.8)",
                border: "1px solid rgba(180,140,20,0.15)",
                borderRadius: 4,
                padding: 20,
              }}
            >
              {shoppingList.map((item) => {
                const key = `${item.ingredient_name}||${item.unit}`;
                const isChecked = !!checkedItems[key];
                return (
                  <div
                    key={key}
                    onClick={() => toggleCheck(key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderBottom: "1px solid rgba(180,140,20,0.06)",
                      cursor: "pointer",
                      opacity: isChecked ? 0.4 : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 3,
                        border: isChecked
                          ? "2px solid #50c860"
                          : "2px solid rgba(180,140,20,0.3)",
                        background: isChecked
                          ? "rgba(80,200,96,0.15)"
                          : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        color: "#50c860",
                        flexShrink: 0,
                      }}
                    >
                      {isChecked ? "✓" : ""}
                    </div>
                    <span
                      style={{
                        fontSize: 14,
                        color: "#e8e0d0",
                        textDecoration: isChecked ? "line-through" : "none",
                        letterSpacing: 0.5,
                      }}
                    >
                      {item.quantity}
                      {item.unit} {item.ingredient_name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ORDER PIPELINE ─────────────────────────────────────────────── */}
      {tab === "pipeline" && (
        <div>
          {/* Summary Stats */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <div
              style={{
                background: "rgba(15,10,30,0.8)",
                border: "1px solid rgba(180,140,20,0.15)",
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
                Total Active Orders
              </div>
              <div
                style={{
                  color: "#c8a820",
                  fontSize: 26,
                  fontWeight: "bold",
                  letterSpacing: 1,
                }}
              >
                {pipelineActive.length}
              </div>
            </div>
            <div
              style={{
                background: "rgba(15,10,30,0.8)",
                border: "1px solid rgba(180,140,20,0.15)",
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
                Pipeline Value
              </div>
              <div
                style={{
                  color: "#c8a820",
                  fontSize: 26,
                  fontWeight: "bold",
                  letterSpacing: 1,
                }}
              >
                {fmt(totalPipelineValue)}
              </div>
            </div>
            <div
              style={{
                background: "rgba(15,10,30,0.8)",
                border: "1px solid rgba(180,140,20,0.15)",
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
                Delivered This Month
              </div>
              <div
                style={{
                  color: "#50c860",
                  fontSize: 26,
                  fontWeight: "bold",
                  letterSpacing: 1,
                }}
              >
                {deliveredThisMonth.length}{" "}
                <span style={{ fontSize: 14, color: "#5a6a5a" }}>
                  ({fmt(deliveredMonthValue)})
                </span>
              </div>
            </div>
          </div>

          {/* Pipeline Columns */}
          <div
            style={{
              display: "flex",
              gap: 12,
              overflowX: "auto",
              paddingBottom: 8,
              marginBottom: 24,
            }}
          >
            {PIPELINE_STATUSES.map((status) => {
              const col = columnData[status];
              const color = STATUS_COLORS[status];
              return (
                <div
                  key={status}
                  style={{
                    flex: 1,
                    minWidth: 180,
                    background: "rgba(15,10,30,0.6)",
                    border: "1px solid rgba(180,140,20,0.1)",
                    borderTop: `3px solid ${color}`,
                    borderRadius: 4,
                    padding: 14,
                  }}
                >
                  {/* Column Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        color: color,
                        fontSize: 12,
                        fontWeight: "bold",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      {status}
                    </div>
                    <div
                      style={{
                        background: `${color}22`,
                        color: color,
                        fontSize: 11,
                        fontWeight: "bold",
                        padding: "2px 8px",
                        borderRadius: 10,
                        minWidth: 20,
                        textAlign: "center",
                      }}
                    >
                      {col.count}
                    </div>
                  </div>
                  <div
                    style={{
                      color: "#8a9a8a",
                      fontSize: 12,
                      marginBottom: 12,
                      letterSpacing: 0.5,
                    }}
                  >
                    {fmt(col.total)}
                  </div>

                  {/* Order cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {col.orders.slice(0, 10).map((order) => {
                      const items = order.order_items || [];
                      const itemsSummary =
                        items
                          .slice(0, 2)
                          .map((i) => i.product_name)
                          .join(", ") + (items.length > 2 ? "…" : "");
                      return (
                        <div
                          key={order.id}
                          style={{
                            background: "rgba(15,10,30,0.8)",
                            border: "1px solid rgba(180,140,20,0.08)",
                            borderRadius: 3,
                            padding: "10px 12px",
                          }}
                        >
                          <div
                            style={{
                              color: "#e8e0d0",
                              fontSize: 12,
                              fontWeight: "bold",
                              marginBottom: 4,
                            }}
                          >
                            {order.customer_ic_name || "Unknown"}
                          </div>
                          {itemsSummary && (
                            <div
                              style={{
                                color: "#5a6a5a",
                                fontSize: 11,
                                marginBottom: 4,
                              }}
                            >
                              {itemsSummary}
                            </div>
                          )}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span style={{ color: "#c8a820", fontSize: 12 }}>
                              {fmt(parseFloat(order.total_cost) || 0)}
                            </span>
                            {order.assigned_to && (
                              <span
                                style={{
                                  color: "#8a9a8a",
                                  fontSize: 10,
                                  letterSpacing: 0.5,
                                }}
                              >
                                → {order.assigned_to}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {col.orders.length > 10 && (
                      <div
                        style={{
                          color: "#5a6a5a",
                          fontSize: 11,
                          textAlign: "center",
                          padding: 6,
                        }}
                      >
                        +{col.orders.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Average Time Per Stage */}
          <div
            style={{
              background: "rgba(15,10,30,0.8)",
              border: "1px solid rgba(180,140,20,0.15)",
              borderRadius: 4,
              padding: "16px 20px",
            }}
          >
            <div
              style={{
                color: "#5a6a5a",
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Average Time Per Stage
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 20,
                fontSize: 12,
              }}
            >
              {PIPELINE_STATUSES.filter((s) => s !== "Delivered").map(
                (status) => {
                  const avg = computeAvgDays(status);
                  return (
                    <span key={status}>
                      <span
                        style={{
                          color: STATUS_COLORS[status],
                          fontWeight: "bold",
                        }}
                      >
                        {status}:
                      </span>{" "}
                      <span style={{ color: "#8a9a8a" }}>
                        {avg !== null ? `${avg.toFixed(1)} days` : "N/A"}
                      </span>
                    </span>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: REVENUE FORECAST ───────────────────────────────────────────── */}
      {tab === "revenue" && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
            <div
              style={{
                background: "rgba(15,10,30,0.8)",
                border: "1px solid #50c86022",
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
                Guaranteed Revenue
              </div>
              <div
                style={{
                  color: "#50c860",
                  fontSize: 26,
                  fontWeight: "bold",
                  letterSpacing: 1,
                }}
              >
                {fmt(guaranteed)}
              </div>
            </div>
            <div
              style={{
                background: "rgba(15,10,30,0.8)",
                border: "1px solid #e0903022",
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
                {fmt(potential)}
              </div>
            </div>
            <div
              style={{
                background: "rgba(15,10,30,0.8)",
                border: "1px solid #c8a82022",
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
                Delivered Revenue (This Month)
              </div>
              <div
                style={{
                  color: "#c8a820",
                  fontSize: 26,
                  fontWeight: "bold",
                  letterSpacing: 1,
                }}
              >
                {fmt(deliveredRevenue)}
              </div>
            </div>
          </div>

          {/* Orders by Day Chart */}
          <div
            style={{
              background: "rgba(15,10,30,0.8)",
              border: "1px solid rgba(180,140,20,0.15)",
              borderRadius: 4,
              padding: 24,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                color: "#e8e0d0",
                fontSize: 15,
                fontWeight: "bold",
                marginBottom: 4,
              }}
            >
              Orders by Day
            </div>
            <div
              style={{
                color: "#5a6a5a",
                fontSize: 11,
                letterSpacing: 1,
                marginBottom: 20,
              }}
            >
              PAST 30 DAYS
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(180,140,20,0.06)"
                />
                <XAxis
                  dataKey="date"
                  stroke="#3a3a3a"
                  tick={{ fill: "#5a6a5a", fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#3a3a3a"
                  tick={{ fill: "#5a6a5a", fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" fill="#c8a820" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Day Chart */}
          <div
            style={{
              background: "rgba(15,10,30,0.8)",
              border: "1px solid rgba(180,140,20,0.15)",
              borderRadius: 4,
              padding: 24,
            }}
          >
            <div
              style={{
                color: "#e8e0d0",
                fontSize: 15,
                fontWeight: "bold",
                marginBottom: 4,
              }}
            >
              Revenue by Day
            </div>
            <div
              style={{
                color: "#5a6a5a",
                fontSize: 11,
                letterSpacing: 1,
                marginBottom: 20,
              }}
            >
              PAST 30 DAYS
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(180,140,20,0.06)"
                />
                <XAxis
                  dataKey="date"
                  stroke="#3a3a3a"
                  tick={{ fill: "#5a6a5a", fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#3a3a3a"
                  tick={{ fill: "#5a6a5a", fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltip prefix="$" />} />
                <Bar dataKey="revenue" fill="#50c860" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
