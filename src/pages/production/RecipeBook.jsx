import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

export default function RecipeBook() {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("recipes")
        .select("*, product:products(*), recipe_ingredients(*)")
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching recipes:", error);
      else setRecipes(data || []);
      setLoading(false);
    };

    fetchRecipes();
  }, []);

  const renderStars = (difficulty) => {
    const d = difficulty || 0;
    return (
      <span style={{ color: "#c8a820", fontSize: 16 }}>
        {"★".repeat(d)}
        <span style={{ color: "#5a6a5a" }}>{"☆".repeat(5 - d)}</span>
      </span>
    );
  };

  const filteredRecipes = recipes.filter(r => 
    r.product && r.product.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div style={{ color: "#5a6a5a", padding: "40px", textAlign: "center" }}>Loading recipe book...</div>;
  }

  return (
    <div style={{ color: "#e8e0d0" }}>
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>Recipe Book</div>
          <div style={{ color: "#5a6a5a", fontSize: 13, marginTop: 4 }}>Company-approved production formulas</div>
        </div>
        <input 
          type="text" 
          placeholder="Search recipes..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,140,20,0.3)", 
            color: "#e8e0d0", padding: "8px 16px", borderRadius: 20, outline: "none",
            fontFamily: "Georgia, serif", width: 250
          }} 
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
        {filteredRecipes.length === 0 ? (
          <div style={{ color: "#5a6a5a", gridColumn: "1 / -1", padding: "40px 0", textAlign: "center" }}>
            No recipes found matching "{search}".
          </div>
        ) : (
          filteredRecipes.map(recipe => (
            <div key={recipe.id} style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: 20 }}>
              <div style={{ color: "#c8a820", fontSize: 16, fontWeight: "bold", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                {recipe.product ? recipe.product.name : "Unknown Product"}
              </div>
              <div style={{ color: "#5a6a5a", marginBottom: 12 }}>─────────────────────</div>
              
              <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "8px 12px", fontSize: 13, color: "#8a9a8a", marginBottom: 16 }}>
                <div>Difficulty:</div><div>{renderStars(recipe.difficulty)}</div>
                <div>Cooking Time:</div><div style={{ color: "#e8e0d0" }}>{recipe.cooking_time || "—"}</div>
                <div>Distill Runs:</div><div style={{ color: "#e8e0d0" }}>{recipe.distill_runs != null ? recipe.distill_runs : "—"}</div>
                <div>Age:</div><div style={{ color: "#e8e0d0" }}>{recipe.age_requirement || "—"}</div>
                <div>Barrel Type:</div><div style={{ color: "#e8e0d0" }}>{recipe.barrel_type || "—"}</div>
              </div>

              <div style={{ color: "#8a9a8a", fontSize: 12, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Ingredients:</div>
              {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 ? (
                <div style={{ paddingLeft: 12, borderLeft: "2px solid rgba(180,140,20,0.2)", marginBottom: 16 }}>
                  {recipe.recipe_ingredients.map(ing => (
                    <div key={ing.id} style={{ color: "#e8e0d0", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "#c8a820" }}>{ing.quantity}x</span> {ing.unit || ""} {ing.ingredient_name}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#5a6a5a", fontStyle: "italic", fontSize: 13, marginBottom: 16 }}>No ingredients listed.</div>
              )}

              {recipe.notes && (
                <div>
                  <div style={{ color: "#8a9a8a", fontSize: 12, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Notes:</div>
                  <div style={{ color: "#e8e0d0", fontSize: 13, whiteSpace: "pre-wrap", fontStyle: "italic", padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: 3 }}>
                    {recipe.notes}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
