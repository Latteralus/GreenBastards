import { useState } from "react";
import { supabase } from "../../supabaseClient.js";
import { fmt } from "../../helpers.js";

export default function Inventory({ inventory, onInventoryUpdate }) {
  const [newItem, setNewItem] = useState({ name: "", quantity: "", value: "", category: "Input" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.name) return;
    setLoading(true);
    const { error } = await supabase.from('inventory').insert([{
      item_name: newItem.name,
      quantity: parseInt(newItem.quantity) || 0,
      est_value: parseFloat(newItem.value) || 0,
      category: newItem.category
    }]);
    if (error) {
      console.error(error);
      alert("Error adding item");
    } else {
      onInventoryUpdate();
      setNewItem({ name: "", quantity: "", value: "", category: "Input" });
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setLoading(true);
    const { error } = await supabase.from('inventory').update({
      item_name: editForm.name,
      quantity: parseInt(editForm.quantity) || 0,
      est_value: parseFloat(editForm.value) || 0,
      category: editForm.category,
      last_updated: new Date()
    }).eq('id', editingId);
    
    if (error) {
      console.error(error);
      alert("Error updating item");
    } else {
      onInventoryUpdate();
      setEditingId(null);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    setLoading(true);
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) {
      console.error(error);
      alert("Error deleting item");
    } else {
      onInventoryUpdate();
    }
    setLoading(false);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ name: item.item_name, quantity: item.quantity, value: item.est_value, category: item.category || "Input" });
  };

  const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * item.est_value), 0);
  const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,140,20,0.2)", borderRadius: 3, padding: "8px 12px", color: "#e8e0d0", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif" };

  const inputs = inventory.filter(i => i.category === 'Input' || !i.category).sort((a,b) => a.item_name.localeCompare(b.item_name));
  const outputs = inventory.filter(i => i.category === 'Output').sort((a,b) => a.item_name.localeCompare(b.item_name));
  const equipment = inventory.filter(i => i.category === 'Equipment').sort((a,b) => a.item_name.localeCompare(b.item_name));

  const renderTable = (items, title) => {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, paddingBottom: 4, borderBottom: "1px solid rgba(180,140,20,0.2)" }}>{title}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr 1fr 2fr 2fr 1fr", gap: 10, padding: "0 10px 10px", color: "#5a6a5a", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
            <div>Item Name</div>
            <div>Category</div>
            <div style={{ textAlign: "right" }}>Qty</div>
            <div style={{ textAlign: "right" }}>Unit Value</div>
            <div style={{ textAlign: "right" }}>Total</div>
            <div style={{ textAlign: "center" }}>Action</div>
          </div>

          {items.map(item => {
            const isEditing = editingId === item.id;
            const itemTotal = item.quantity * item.est_value;
            
            if (isEditing) {
              return (
                <div key={item.id} style={{ display: "grid", gridTemplateColumns: "3fr 2fr 1fr 2fr 2fr 1fr", gap: 10, alignItems: "center", background: "rgba(180,140,20,0.05)", padding: "10px", borderRadius: 3, marginBottom: 4 }}>
                  <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ ...inputStyle, width: "100%" }} />
                  <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} style={{ ...inputStyle, width: "100%" }}>
                    <option value="Input">Input</option>
                    <option value="Output">Output</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                  <input type="number" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: e.target.value})} style={{ ...inputStyle, width: "100%", textAlign: "right" }} />
                  <input type="number" step="0.01" value={editForm.value} onChange={e => setEditForm({...editForm, value: e.target.value})} style={{ ...inputStyle, width: "100%", textAlign: "right" }} />
                  <div style={{ textAlign: "right", color: "#8a9a8a", fontSize: 13 }}>-</div>
                  <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                    <button onClick={handleUpdate} disabled={loading} style={{ cursor: "pointer", background: "none", border: "none", color: "#50c860" }}>✓</button>
                    <button onClick={() => setEditingId(null)} style={{ cursor: "pointer", background: "none", border: "none", color: "#e05050" }}>✗</button>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "3fr 2fr 1fr 2fr 2fr 1fr", gap: 10, alignItems: "center", padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ color: "#e8e0d0", fontSize: 13 }}>{item.item_name}</div>
                <div style={{ color: "#8a9a8a", fontSize: 12 }}>{item.category || "Input"}</div>
                <div style={{ textAlign: "right", color: "#c8a820", fontSize: 13 }}>{item.quantity}</div>
                <div style={{ textAlign: "right", color: "#8a9a8a", fontSize: 12 }}>{fmt(item.est_value)}</div>
                <div style={{ textAlign: "right", color: "#50c860", fontSize: 13, fontWeight: "bold" }}>{fmt(itemTotal)}</div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={() => startEdit(item)} style={{ cursor: "pointer", background: "none", border: "none", color: "#8a9a8a", fontSize: 12 }}>✎</button>
                  <button onClick={() => handleDelete(item.id)} style={{ cursor: "pointer", background: "none", border: "none", color: "#e05050", fontSize: 12 }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#e8e0d0", fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>Inventory Management</div>
        <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 4 }}>Track raw materials and finished goods</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
             <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Current Stock</div>
             <div style={{ color: "#c8a820", fontSize: 14, fontWeight: "bold" }}>Total Value: {fmt(totalInventoryValue)}</div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {renderTable(inputs, "Inputs (Ingredients)")}
            {renderTable(outputs, "Outputs (Drinks / Elixirs)")}
            {renderTable(equipment, "Equipment")}
            {inventory.length === 0 && <div style={{ textAlign: "center", padding: 20, color: "#5a6a5a" }}>No inventory items found.</div>}
          </div>
        </div>

        <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "24px", height: "fit-content" }}>
          <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Add New Item</div>
          <form onSubmit={handleAdd}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Item Name</label>
              <input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} style={{ ...inputStyle, width: "100%" }} placeholder="e.g. Hops" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Category</label>
              <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} style={{ ...inputStyle, width: "100%" }}>
                <option value="Input">Input</option>
                <option value="Output">Output</option>
                <option value="Equipment">Equipment</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Quantity</label>
              <input type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} style={{ ...inputStyle, width: "100%" }} placeholder="0" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Est. Value ($)</label>
              <input type="number" step="0.01" value={newItem.value} onChange={e => setNewItem({...newItem, value: e.target.value})} style={{ ...inputStyle, width: "100%" }} placeholder="0.00" />
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", background: loading ? "rgba(180,140,20,0.3)" : "linear-gradient(135deg, #c8a820, #a08010)", border: "none", borderRadius: 3, padding: "11px", color: "#0d0a1a", fontSize: 12, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase", cursor: loading ? "default" : "pointer", fontFamily: "Georgia, serif" }}>
              {loading ? "Adding..." : "Add to Inventory"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
