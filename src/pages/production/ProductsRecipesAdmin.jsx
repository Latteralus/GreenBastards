import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { fmt } from "../../helpers";

// ─── Shared Styles ───────────────────────────────────────────────────────────

const inputStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(180,140,20,0.2)",
  color: "#e8e0d0",
  borderRadius: 3,
  padding: "9px 12px",
  fontFamily: "Georgia, serif",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const btnGold = {
  background: "linear-gradient(135deg, #c8a820, #a08010)",
  color: "#0d0a1a",
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: 1,
  border: "none",
  borderRadius: 3,
  padding: "9px 18px",
  cursor: "pointer",
  fontFamily: "Georgia, serif",
  fontSize: 12,
};

const btnRed = {
  background: "rgba(224,80,80,0.15)",
  color: "#e05050",
  border: "1px solid rgba(224,80,80,0.3)",
  borderRadius: 3,
  padding: "7px 14px",
  cursor: "pointer",
  fontFamily: "Georgia, serif",
  fontSize: 12,
  fontWeight: "bold",
};

const btnMuted = {
  background: "rgba(255,255,255,0.04)",
  color: "#8a9a8a",
  border: "1px solid rgba(180,140,20,0.15)",
  borderRadius: 3,
  padding: "7px 14px",
  cursor: "pointer",
  fontFamily: "Georgia, serif",
  fontSize: 12,
};

const cardStyle = {
  background: "rgba(15,10,30,0.8)",
  border: "1px solid rgba(180,140,20,0.3)",
  borderRadius: 4,
  padding: 24,
  marginBottom: 16,
};

// ─── Products Tab ────────────────────────────────────────────────────────────

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [addForm, setAddForm] = useState({ name: "", description: "", price: "", stock_qty: 0, in_stock: true });
  const [successMsg, setSuccessMsg] = useState(null);
  const [deleteWarning, setDeleteWarning] = useState(null);

  async function fetchProducts() {
    setLoading(true);
    const { data, error: err } = await supabase.from("products").select("*").order("name");
    if (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products.");
    } else {
      setProducts(data || []);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => { fetchProducts(); }, []);

  function startEdit(p) {
    setEditingId(p.id);
    setEditForm({ name: p.name, description: p.description || "", price: p.price, stock_qty: p.stock_qty, in_stock: p.in_stock });
    setDeleteWarning(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
    setDeleteWarning(null);
  }

  async function saveEdit(id) {
    const { error: err } = await supabase.from("products").update({
      name: editForm.name,
      description: editForm.description,
      price: parseFloat(editForm.price) || 0,
      stock_qty: parseInt(editForm.stock_qty) || 0,
      in_stock: editForm.in_stock,
    }).eq("id", id);
    if (err) {
      console.error("Error updating product:", err);
      setError("Failed to update product.");
      return;
    }
    setEditingId(null);
    setEditForm({});
    showSuccess("Product updated.");
    fetchProducts();
  }

  async function toggleStock(p) {
    const { error: err } = await supabase.from("products").update({ in_stock: !p.in_stock }).eq("id", p.id);
    if (err) {
      console.error("Error toggling stock:", err);
      return;
    }
    fetchProducts();
  }

  async function deleteProduct(p) {
    // Check for active orders containing this product
    const { data: activeItems, error: checkErr } = await supabase
      .from("order_items")
      .select("id, order_id, orders!inner(status)")
      .eq("product_id", p.id)
      .not("orders.status", "in", '("Delivered","Cancelled")');

    if (checkErr) {
      console.error("Error checking active orders:", checkErr);
      setError("Failed to check active orders.");
      return;
    }

    if (activeItems && activeItems.length > 0) {
      setDeleteWarning(`Cannot delete: ${activeItems.length} active order(s) contain this product.`);
      return;
    }

    if (!window.confirm(`Delete "${p.name}"? This action cannot be undone.`)) return;

    const { error: delErr } = await supabase.from("products").delete().eq("id", p.id);
    if (delErr) {
      console.error("Error deleting product:", delErr);
      setError("Failed to delete product.");
      return;
    }
    showSuccess("Product deleted.");
    setDeleteWarning(null);
    fetchProducts();
  }

  async function addProduct(e) {
    e.preventDefault();
    if (!addForm.name || !addForm.price) {
      setError("Name and Price are required.");
      return;
    }
    const { error: err } = await supabase.from("products").insert({
      name: addForm.name,
      description: addForm.description || null,
      price: parseFloat(addForm.price) || 0,
      stock_qty: parseInt(addForm.stock_qty) || 0,
      in_stock: addForm.in_stock,
    });
    if (err) {
      console.error("Error adding product:", err);
      setError("Failed to add product.");
      return;
    }
    setAddForm({ name: "", description: "", price: "", stock_qty: 0, in_stock: true });
    showSuccess("Product added successfully.");
    fetchProducts();
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setError(null);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  if (loading) return <div style={{ color: "#8a9a8a", padding: 40, textAlign: "center" }}>Loading products…</div>;

  return (
    <div>
      {error && (
        <div style={{ background: "rgba(224,80,80,0.1)", border: "1px solid rgba(224,80,80,0.3)", borderRadius: 3, padding: "10px 16px", marginBottom: 16, color: "#e05050", fontSize: 13 }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ background: "rgba(80,200,96,0.1)", border: "1px solid rgba(80,200,96,0.3)", borderRadius: 3, padding: "10px 16px", marginBottom: 16, color: "#50c860", fontSize: 13 }}>
          {successMsg}
        </div>
      )}
      {deleteWarning && (
        <div style={{ background: "rgba(224,144,48,0.1)", border: "1px solid rgba(224,144,48,0.3)", borderRadius: 3, padding: "10px 16px", marginBottom: 16, color: "#e09030", fontSize: 13 }}>
          {deleteWarning}
        </div>
      )}

      {/* ── Products Table ─────────────────────────────────────────────────── */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Georgia, serif", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(180,140,20,0.3)" }}>
              {["Name", "Description", "Price", "Stock Qty", "In Stock", "Actions"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#c8a820", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: "bold" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const isEditing = editingId === p.id;
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid rgba(180,140,20,0.08)" }}>
                  <td style={{ padding: "10px 12px", color: "#e8e0d0" }}>
                    {isEditing
                      ? <input style={{ ...inputStyle, width: 160 }} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                      : p.name}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#8a9a8a", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {isEditing
                      ? <input style={{ ...inputStyle, width: 200 }} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                      : (p.description || "—")}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#e8e0d0" }}>
                    {isEditing
                      ? <input type="number" step="0.01" style={{ ...inputStyle, width: 90 }} value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} />
                      : fmt(parseFloat(p.price) || 0)}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#e8e0d0" }}>
                    {isEditing
                      ? <input type="number" style={{ ...inputStyle, width: 70 }} value={editForm.stock_qty} onChange={e => setEditForm({ ...editForm, stock_qty: e.target.value })} />
                      : p.stock_qty}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {isEditing ? (
                      <button onClick={() => setEditForm({ ...editForm, in_stock: !editForm.in_stock })}
                        style={{ background: editForm.in_stock ? "linear-gradient(135deg, #c8a820, #a08010)" : "rgba(255,255,255,0.06)", color: editForm.in_stock ? "#0d0a1a" : "#5a6a5a", border: editForm.in_stock ? "none" : "1px solid rgba(180,140,20,0.15)", borderRadius: 3, padding: "5px 14px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 11, fontWeight: "bold" }}>
                        {editForm.in_stock ? "YES" : "NO"}
                      </button>
                    ) : (
                      <button onClick={() => toggleStock(p)}
                        style={{ background: p.in_stock ? "linear-gradient(135deg, #c8a820, #a08010)" : "rgba(255,255,255,0.06)", color: p.in_stock ? "#0d0a1a" : "#5a6a5a", border: p.in_stock ? "none" : "1px solid rgba(180,140,20,0.15)", borderRadius: 3, padding: "5px 14px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 11, fontWeight: "bold" }}>
                        {p.in_stock ? "YES" : "NO"}
                      </button>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(p.id)} style={{ ...btnGold, padding: "5px 12px", fontSize: 11 }}>Save</button>
                          <button onClick={cancelEdit} style={{ ...btnMuted, padding: "5px 12px", fontSize: 11 }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(p)} style={{ ...btnMuted, padding: "5px 10px", fontSize: 13 }} title="Edit">✎</button>
                          <button onClick={() => deleteProduct(p)} style={{ ...btnRed, padding: "5px 10px", fontSize: 13 }} title="Delete">🗑</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#5a6a5a" }}>No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Add New Product Form ───────────────────────────────────────────── */}
      <div style={{ marginTop: 32, border: "1px solid rgba(180,140,20,0.2)", borderRadius: 4, padding: 24 }}>
        <div style={{ color: "#c8a820", fontSize: 14, fontWeight: "bold", letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>Add New Product</div>
        <form onSubmit={addProduct}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 180px" }}>
              <label style={{ color: "#8a9a8a", fontSize: 11, display: "block", marginBottom: 4 }}>Name *</label>
              <input style={{ ...inputStyle, width: "100%" }} value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} placeholder="Product name" required />
            </div>
            <div style={{ flex: "2 1 240px" }}>
              <label style={{ color: "#8a9a8a", fontSize: 11, display: "block", marginBottom: 4 }}>Description</label>
              <input style={{ ...inputStyle, width: "100%" }} value={addForm.description} onChange={e => setAddForm({ ...addForm, description: e.target.value })} placeholder="Optional description" />
            </div>
            <div style={{ flex: "0 1 100px" }}>
              <label style={{ color: "#8a9a8a", fontSize: 11, display: "block", marginBottom: 4 }}>Price *</label>
              <input type="number" step="0.01" style={{ ...inputStyle, width: "100%" }} value={addForm.price} onChange={e => setAddForm({ ...addForm, price: e.target.value })} placeholder="0.00" required />
            </div>
            <div style={{ flex: "0 1 80px" }}>
              <label style={{ color: "#8a9a8a", fontSize: 11, display: "block", marginBottom: 4 }}>Stock Qty</label>
              <input type="number" style={{ ...inputStyle, width: "100%" }} value={addForm.stock_qty} onChange={e => setAddForm({ ...addForm, stock_qty: e.target.value })} />
            </div>
            <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 8, paddingBottom: 2 }}>
              <input type="checkbox" checked={addForm.in_stock} onChange={e => setAddForm({ ...addForm, in_stock: e.target.checked })} style={{ accentColor: "#c8a820" }} />
              <span style={{ color: "#8a9a8a", fontSize: 12 }}>In Stock</span>
            </div>
            <div style={{ flex: "0 0 auto" }}>
              <button type="submit" style={btnGold}>Add Product</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Recipes Tab ─────────────────────────────────────────────────────────────

function RecipesTab() {
  const [productsWithRecipes, setProductsWithRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [recipeForm, setRecipeForm] = useState({});
  const [ingredients, setIngredients] = useState([]);
  const [successMsg, setSuccessMsg] = useState(null);

  async function fetchData() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("products")
      .select("*, recipes(*, recipe_ingredients(*))")
      .order("name");
    if (err) {
      console.error("Error fetching products with recipes:", err);
      setError("Failed to load recipe data.");
    } else {
      setProductsWithRecipes(data || []);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function startRecipeEdit(product, recipe) {
    setEditingProductId(product.id);
    if (recipe) {
      setRecipeForm({
        id: recipe.id,
        difficulty: recipe.difficulty || "",
        cooking_time: recipe.cooking_time || "",
        distill_runs: recipe.distill_runs || "",
        age_requirement: recipe.age_requirement || "",
        barrel_type: recipe.barrel_type || "",
        notes: recipe.notes || "",
      });
      setIngredients(
        (recipe.recipe_ingredients || []).map(ri => ({
          ingredient_name: ri.ingredient_name,
          quantity: ri.quantity,
          unit: ri.unit || "x",
        }))
      );
    } else {
      setRecipeForm({
        id: null,
        difficulty: "",
        cooking_time: "",
        distill_runs: "",
        age_requirement: "",
        barrel_type: "",
        notes: "",
      });
      setIngredients([{ ingredient_name: "", quantity: 1, unit: "x" }]);
    }
  }

  function cancelRecipeEdit() {
    setEditingProductId(null);
    setRecipeForm({});
    setIngredients([]);
  }

  function addIngredientRow() {
    setIngredients([...ingredients, { ingredient_name: "", quantity: 1, unit: "x" }]);
  }

  function removeIngredientRow(idx) {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  }

  function updateIngredient(idx, field, value) {
    const updated = [...ingredients];
    updated[idx] = { ...updated[idx], [field]: value };
    setIngredients(updated);
  }

  async function saveRecipe(productId) {
    let recipeId = recipeForm.id;

    if (recipeId) {
      // Update existing recipe
      const { error: err } = await supabase.from("recipes").update({
        difficulty: parseInt(recipeForm.difficulty) || null,
        cooking_time: recipeForm.cooking_time || null,
        distill_runs: parseInt(recipeForm.distill_runs) || null,
        age_requirement: recipeForm.age_requirement || null,
        barrel_type: recipeForm.barrel_type || null,
        notes: recipeForm.notes || null,
      }).eq("id", recipeId);
      if (err) {
        console.error("Error updating recipe:", err);
        setError("Failed to update recipe.");
        return;
      }
    } else {
      // Insert new recipe
      const { data: newRecipe, error: err } = await supabase.from("recipes").insert({
        product_id: productId,
        difficulty: parseInt(recipeForm.difficulty) || null,
        cooking_time: recipeForm.cooking_time || null,
        distill_runs: parseInt(recipeForm.distill_runs) || null,
        age_requirement: recipeForm.age_requirement || null,
        barrel_type: recipeForm.barrel_type || null,
        notes: recipeForm.notes || null,
      }).select().single();
      if (err) {
        console.error("Error creating recipe:", err);
        setError("Failed to create recipe.");
        return;
      }
      recipeId = newRecipe.id;
    }

    // Delete existing ingredients and re-insert
    const { error: delErr } = await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipeId);
    if (delErr) {
      console.error("Error clearing ingredients:", delErr);
      setError("Failed to update ingredients.");
      return;
    }

    const validIngredients = ingredients.filter(i => i.ingredient_name && i.ingredient_name.trim());
    if (validIngredients.length > 0) {
      const { error: insErr } = await supabase.from("recipe_ingredients").insert(
        validIngredients.map(i => ({
          recipe_id: recipeId,
          ingredient_name: i.ingredient_name.trim(),
          quantity: parseInt(i.quantity) || 1,
          unit: i.unit || "x",
        }))
      );
      if (insErr) {
        console.error("Error inserting ingredients:", insErr);
        setError("Failed to save ingredients.");
        return;
      }
    }

    setEditingProductId(null);
    setRecipeForm({});
    setIngredients([]);
    showSuccess("Recipe saved successfully.");
    fetchData();
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setError(null);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  if (loading) return <div style={{ color: "#8a9a8a", padding: 40, textAlign: "center" }}>Loading recipes…</div>;

  return (
    <div>
      {error && (
        <div style={{ background: "rgba(224,80,80,0.1)", border: "1px solid rgba(224,80,80,0.3)", borderRadius: 3, padding: "10px 16px", marginBottom: 16, color: "#e05050", fontSize: 13 }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ background: "rgba(80,200,96,0.1)", border: "1px solid rgba(80,200,96,0.3)", borderRadius: 3, padding: "10px 16px", marginBottom: 16, color: "#50c860", fontSize: 13 }}>
          {successMsg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 16 }}>
        {productsWithRecipes.map(product => {
          const recipe = product.recipes && product.recipes.length > 0 ? product.recipes[0] : null;
          const isEditing = editingProductId === product.id;

          if (isEditing) {
            return (
              <div key={product.id} style={cardStyle}>
                <div style={{ color: "#c8a820", fontSize: 16, fontWeight: "bold", marginBottom: 16, letterSpacing: 1 }}>
                  {product.name} — {recipeForm.id ? "Edit Recipe" : "New Recipe"}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  <div>
                    <label style={{ color: "#8a9a8a", fontSize: 11, display: "block", marginBottom: 3 }}>Difficulty (1-5)</label>
                    <input type="number" min="1" max="5" style={{ ...inputStyle, width: "100%" }} value={recipeForm.difficulty} onChange={e => setRecipeForm({ ...recipeForm, difficulty: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ color: "#8a9a8a", fontSize: 11, display: "block", marginBottom: 3 }}>Cooking Time</label>
                    <input style={{ ...inputStyle, width: "100%" }} value={recipeForm.cooking_time} onChange={e => setRecipeForm({ ...recipeForm, cooking_time: e.target.value })} placeholder="e.g. 8m" />
                  </div>
                  <div>
                    <label style={{ color: "#8a9a8a", fontSize: 11, display: "block", marginBottom: 3 }}>Distill Runs</label>
                    <input type="number" style={{ ...inputStyle, width: "100%" }} value={recipeForm.distill_runs} onChange={e => setRecipeForm({ ...recipeForm, distill_runs: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ color: "#8a9a8a", fontSize: 11, display: "block", marginBottom: 3 }}>Age Requirement</label>
                    <input style={{ ...inputStyle, width: "100%" }} value={recipeForm.age_requirement} onChange={e => setRecipeForm({ ...recipeForm, age_requirement: e.target.value })} placeholder="e.g. 2yrs" />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: "#8a9a8a", fontSize: 11, display: "block", marginBottom: 3 }}>Barrel Type</label>
                    <input style={{ ...inputStyle, width: "100%" }} value={recipeForm.barrel_type} onChange={e => setRecipeForm({ ...recipeForm, barrel_type: e.target.value })} placeholder="e.g. Oak, Birch, Any" />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: "#8a9a8a", fontSize: 11, display: "block", marginBottom: 3 }}>Notes</label>
                    <textarea style={{ ...inputStyle, width: "100%", minHeight: 60, resize: "vertical" }} value={recipeForm.notes} onChange={e => setRecipeForm({ ...recipeForm, notes: e.target.value })} placeholder="Optional brewing notes…" />
                  </div>
                </div>

                {/* Ingredients */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: "#c8a820", fontSize: 12, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Ingredients</div>
                  {ingredients.map((ing, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                      <input style={{ ...inputStyle, flex: "2 1 140px" }} value={ing.ingredient_name} onChange={e => updateIngredient(idx, "ingredient_name", e.target.value)} placeholder="Ingredient name" />
                      <input type="number" min="1" style={{ ...inputStyle, flex: "0 0 60px", width: 60 }} value={ing.quantity} onChange={e => updateIngredient(idx, "quantity", e.target.value)} />
                      <input style={{ ...inputStyle, flex: "0 0 50px", width: 50 }} value={ing.unit} onChange={e => updateIngredient(idx, "unit", e.target.value)} placeholder="x" />
                      <button onClick={() => removeIngredientRow(idx)} style={{ ...btnRed, padding: "5px 8px", fontSize: 12, flex: "0 0 auto" }}>✗</button>
                    </div>
                  ))}
                  <button onClick={addIngredientRow} style={{ ...btnMuted, marginTop: 4, fontSize: 11 }}>+ Add Ingredient</button>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => saveRecipe(product.id)} style={btnGold}>Save Recipe</button>
                  <button onClick={cancelRecipeEdit} style={btnMuted}>Cancel</button>
                </div>
              </div>
            );
          }

          // View mode
          if (recipe) {
            return (
              <div key={product.id} style={cardStyle}>
                <div style={{ color: "#c8a820", fontSize: 16, fontWeight: "bold", marginBottom: 12, letterSpacing: 1 }}>{product.name}</div>
                <div style={{
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: 3,
                  padding: 16,
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: "#e8e0d0",
                  marginBottom: 12,
                }}>
                  {recipe.difficulty != null && <div><span style={{ color: "#8a9a8a" }}>Difficulty:</span> {recipe.difficulty}</div>}
                  {recipe.cooking_time && <div><span style={{ color: "#8a9a8a" }}>Cooking Time:</span> {recipe.cooking_time}</div>}
                  {recipe.distill_runs != null && <div><span style={{ color: "#8a9a8a" }}>Distill Runs:</span> {recipe.distill_runs}</div>}
                  {recipe.age_requirement && <div><span style={{ color: "#8a9a8a" }}>Age:</span> {recipe.age_requirement}</div>}
                  {recipe.barrel_type && <div><span style={{ color: "#8a9a8a" }}>Barrel Type:</span> {recipe.barrel_type}</div>}
                  {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ color: "#8a9a8a" }}>Ingredients:</span>
                      {recipe.recipe_ingredients.map((ri, i) => (
                        <div key={i} style={{ paddingLeft: 16 }}>{ri.quantity}{ri.unit} {ri.ingredient_name}</div>
                      ))}
                    </div>
                  )}
                </div>
                {recipe.notes && (
                  <div style={{ color: "#8a9a8a", fontSize: 12, fontStyle: "italic", marginBottom: 12, padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 3, borderLeft: "2px solid rgba(180,140,20,0.3)" }}>
                    {recipe.notes}
                  </div>
                )}
                <button onClick={() => startRecipeEdit(product, recipe)} style={{ ...btnMuted, fontSize: 11 }}>Edit Recipe</button>
              </div>
            );
          }

          // No recipe
          return (
            <div key={product.id} style={{ ...cardStyle, borderColor: "rgba(180,140,20,0.1)" }}>
              <div style={{ color: "#5a6a5a", fontSize: 16, fontWeight: "bold", marginBottom: 12, letterSpacing: 1 }}>{product.name}</div>
              <div style={{ color: "#5a6a5a", fontSize: 13, marginBottom: 16, fontStyle: "italic" }}>No recipe on file</div>
              <button onClick={() => startRecipeEdit(product, null)} style={{ ...btnGold, fontSize: 11 }}>Create Recipe</button>
            </div>
          );
        })}
      </div>

      {productsWithRecipes.length === 0 && (
        <div style={{ color: "#5a6a5a", padding: 40, textAlign: "center" }}>No products found. Add products first.</div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProductsRecipesAdmin() {
  const [activeTab, setActiveTab] = useState("products");

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#e8e0d0", fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>Products & Recipes</div>
        <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 4 }}>Manage menu items and brewing knowledge base</div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {[
          { id: "products", label: "Products" },
          { id: "recipes", label: "Recipes" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? "rgba(180,140,20,0.15)" : "rgba(15,10,30,0.8)",
              border: `1px solid ${activeTab === tab.id ? "rgba(180,140,20,0.4)" : "rgba(180,140,20,0.1)"}`,
              borderRadius: 3,
              padding: "10px 20px",
              color: activeTab === tab.id ? "#c8a820" : "#5a6a5a",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "Georgia, serif",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: 28 }}>
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "recipes" && <RecipesTab />}
      </div>
    </div>
  );
}
