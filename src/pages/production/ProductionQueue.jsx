import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import { fmt } from "../../helpers";

const STATUS_COLORS = {
  Confirmed: "#3498db",
  "In Production": "#9b59b6"
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

export default function ProductionQueue({ user }) {
  const [queueOrders, setQueueOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*), order_assignments(*)")
      .in("status", ["Confirmed", "In Production"])
      .order("created_at", { ascending: true });
      
    if (error) {
      console.error("Error loading queue:", error);
    } else {
      setQueueOrders(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleJoinOrder = async (order) => {
    setMutating(true);
    
    // Insert assignment
    const { error: assignErr } = await supabase.from("order_assignments").insert([{
      order_id: order.id,
      account_id: user.id,
      ic_name: user.ic_name || user.displayName
    }]);

    if (assignErr) {
      console.error("Error joining order:", assignErr);
      alert("Failed to join order.");
      setMutating(false);
      return;
    }

    // If it was Confirmed, move to In Production
    if (order.status === "Confirmed") {
      await supabase.from("orders").update({
        status: "In Production",
        status_updated_at: new Date().toISOString()
      }).eq("id", order.id);
    }

    await loadQueue();
    setMutating(false);
  };

  const handleLeaveOrder = async (order) => {
    setMutating(true);
    
    // Remove assignment
    const { error: leaveErr } = await supabase.from("order_assignments")
      .delete()
      .eq("order_id", order.id)
      .eq("account_id", user.id);

    if (leaveErr) {
      console.error("Error leaving order:", leaveErr);
      alert("Failed to leave order.");
      setMutating(false);
      return;
    }

    // Check how many are left. If 0, revert to Confirmed.
    const { count, error: countErr } = await supabase.from("order_assignments")
      .select("*", { count: 'exact', head: true })
      .eq("order_id", order.id);

    if (!countErr && count === 0 && order.status === "In Production") {
      await supabase.from("orders").update({
        status: "Confirmed",
        status_updated_at: new Date().toISOString()
      }).eq("id", order.id);
    }

    await loadQueue();
    setMutating(false);
  };

  function itemsSummary(items) {
    if (!items || items.length === 0) return "No items";
    return items.map((i) => `${i.quantity}x ${i.product_name}`).join(", ");
  }

  if (loading) {
    return <div style={{ color: "#5a6a5a", textAlign: "center", padding: "60px 0", fontSize: 16 }}>Loading production queue...</div>;
  }

  return (
    <div style={{ color: "#e8e0d0" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>Production Queue</div>
        <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 6 }}>Orders awaiting or currently in production</div>
      </div>

      {queueOrders.length === 0 ? (
        <div style={{ color: "#5a6a5a", textAlign: "center", padding: "40px 0", fontSize: 14 }}>
          No orders currently in the queue.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {queueOrders.map((order) => {
            const items = order.order_items || [];
            const assignments = order.order_assignments || [];
            const isAssigned = assignments.some(a => a.account_id === user.id);
            const statusColor = STATUS_COLORS[order.status] || "#8a9a8a";

            return (
              <div key={order.id} style={{ 
                background: "rgba(15,10,30,0.8)", 
                border: "1px solid rgba(180,140,20,0.15)", 
                borderRadius: 4, 
                padding: "16px 20px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
                  <div style={{ color: "#c8a820", fontFamily: "Consolas, monospace", fontSize: 14, fontWeight: "bold", minWidth: 80 }}>
                    #GB-{order.id.slice(0, 4).toUpperCase()}
                  </div>
                  <div style={{ color: "#e8e0d0", fontSize: 14, minWidth: 120 }}>
                    {order.customer_ic_name || "Unknown"}
                  </div>
                  <div style={{ color: "#8a9a8a", fontSize: 13, flex: 1, minWidth: 150 }}>
                    {itemsSummary(items)}
                  </div>
                  <div style={{ color: "#e8e0d0", fontSize: 14, fontWeight: "bold", minWidth: 80, textAlign: "right" }}>
                    {fmt(parseFloat(order.total_cost) || 0)}
                  </div>
                  <div style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}44`, borderRadius: 3, padding: "3px 10px", fontSize: 11, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase" }}>
                    {order.status}
                  </div>
                  <div style={{ color: "#5a6a5a", fontSize: 12, minWidth: 100, textAlign: "right" }}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(180,140,20,0.08)", paddingTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ color: "#5a6a5a", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginRight: 4 }}>Assigned Brewers:</span>
                    {assignments.length > 0 ? assignments.map(a => (
                      <span key={a.id} style={{ background: "rgba(200,168,32,0.1)", border: "1px solid rgba(200,168,32,0.3)", color: "#c8a820", padding: "2px 8px", borderRadius: 12, fontSize: 11 }}>
                        {a.ic_name}
                      </span>
                    )) : (
                      <span style={{ color: "#e09030", fontSize: 12, fontStyle: "italic" }}>Unassigned</span>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => isAssigned ? handleLeaveOrder(order) : handleJoinOrder(order)} 
                    disabled={mutating}
                    style={{ 
                      ...btnStyle, 
                      opacity: mutating ? 0.6 : 1,
                      background: isAssigned ? "transparent" : btnStyle.background,
                      border: isAssigned ? "1px solid #e05050" : "none",
                      color: isAssigned ? "#e05050" : "#0d0a1a"
                    }}
                  >
                    {isAssigned ? "Leave Order" : "Join Order"}
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
