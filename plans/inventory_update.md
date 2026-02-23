# Inventory Update Plan

## 1. Database Migration
Create a new migration file `supabase/migrations/20260223120000_add_drinks_inventory.sql` to insert the drinks/elixirs.

```sql
-- Insert Drinks and Elixirs as Output Inventory
INSERT INTO public.inventory (item_name, quantity, est_value, category)
VALUES
  ('Aalborg Jubilaums Akvavit', 0, 18.00, 'Output'),
  ('Absolut Mandrin', 0, 17.00, 'Output'),
  ('Amarula Cream Elixir', 0, 18.00, 'Output'),
  ('Amber Elixir', 0, 23.00, 'Output'),
  ('Antioqueno Tapa Roja', 0, 18.00, 'Output'),
  ('Anything But normal Elixir', 0, 22.00, 'Output'),
  ('Apple Cider', 0, 18.00, 'Output'),
  ('Arak', 0, 18.00, 'Output'),
  ('Batavia arrack', 0, 19.00, 'Output'),
  ('Bayou Elixir', 0, 18.00, 'Output'),
  ('Becherovka', 0, 18.00, 'Output'),
  ('Bitter Elixir', 0, 28.00, 'Output'),
  ('British Tea*', 0, 15.00, 'Output'),
  ('Bubble Spice water', 0, 18.00, 'Output'),
  ('BuffXultra', 0, 39.00, 'Output'),
  ('Burning Elixir', 0, 29.00, 'Output'),
  ('Cascade kriek Elixir', 0, 19.00, 'Output'),
  ('Celebre', 0, 17.00, 'Output'),
  ('Chill Elixir', 0, 10.00, 'Output'),
  ('Chinese Elixir', 0, 60.00, 'Output'),
  ('Cognac', 0, 18.00, 'Output'),
  ('Cointreau', 0, 16.00, 'Output'),
  ('Comiteco 9 Guardianes', 0, 17.00, 'Output'),
  ('Crazy Quatro Elixir', 0, 17.00, 'Output'),
  ('Crown Royal Regal Apple', 0, 17.00, 'Output'),
  ('Dark Elixir', 0, 11.00, 'Output'),
  ('Duvel', 0, 16.00, 'Output'),
  ('Earthy Japanese Elixir', 0, 13.00, 'Output'),
  ('Fireball Elixir', 0, 18.00, 'Output'),
  ('German Herbal Tea', 0, 22.00, 'Output'),
  ('Golden Apple Elixir', 0, 30.00, 'Output'),
  ('Green Elixir', 0, 19.00, 'Output'),
  ('Hangover Cure', 0, 35.00, 'Output'),
  ('Hot Chocolate*', 0, 9.00, 'Output'),
  ('Koors Light Elixir', 0, 11.00, 'Output'),
  ('Lairds 12year apple Elixir', 0, 27.00, 'Output'),
  ('Lemonade*', 0, 9.00, 'Output'),
  ('Maple Elixir', 0, 24.00, 'Output'),
  ('Melon elixir', 0, 17.00, 'Output'),
  ('Ming Elixir', 0, 24.00, 'Output'),
  ('Pirassununga 51 Cachaca', 0, 15.00, 'Output'),
  ('Port Elixir', 0, 21.00, 'Output'),
  ('Pulque', 0, 14.00, 'Output'),
  ('Red Elixir', 0, 21.00, 'Output'),
  ('Russian Elixir', 0, 19.00, 'Output'),
  ('Salmiakki Koskenkorva', 0, 16.00, 'Output'),
  ('Slivovitz', 0, 21.00, 'Output'),
  ('Smoothie*', 0, 16.00, 'Output'),
  ('Sour Apple Elixir', 0, 18.00, 'Output'),
  ('Spicy eggnog', 0, 18.00, 'Output'),
  ('Steel Reserve 211', 0, 16.00, 'Output'),
  ('Strangerous Elixir', 0, 14.00, 'Output'),
  ('Sweet apple Elixir', 0, 16.00, 'Output'),
  ('Sweet Japanese Elixir', 0, 12.00, 'Output'),
  ('Sweet Mexican Elixir', 0, 17.00, 'Output'),
  ('Tea*', 0, 8.00, 'Output'),
  ('Tullamore Dew', 0, 22.00, 'Output'),
  ('Victoria Bitter', 0, 15.00, 'Output'),
  ('Vocna Rakija', 0, 23.00, 'Output'),
  ('Watermelon Elixir', 0, 22.00, 'Output'),
  ('Weekend Elixir', 0, 14.00, 'Output'),
  ('White Elixir', 0, 23.00, 'Output'),
  ('Wu Liang Ye Baijiu', 0, 21.00, 'Output'),
  ('Xifengjiu', 0, 24.00, 'Output'),
  ('Xin Li He Zhu', 0, 17.00, 'Output'),
  ('Zombie Zin Zinfadel', 0, 16.00, 'Output')
ON CONFLICT (item_name) DO UPDATE 
SET 
  est_value = EXCLUDED.est_value,
  category = 'Output';
```

## 2. Frontend Updates (`src/App.jsx`)

### Update `Inventory` Component
- Filter `inventory` into `inputs`, `outputs`, and `equipment`.
- Create a reusable `InventoryTable` sub-component (or function inside `Inventory`) to render each list.
- Render separate sections for "Inputs (Ingredients)", "Outputs (Products)", and "Equipment".
- Keep the "Add New Item" form as is, or maybe default to the category of the last clicked section (optional, keeping it simple is better).

#### Proposed Structure for `Inventory` Component:

```jsx
function Inventory({ inventory, onInventoryUpdate }) {
  // ... existing state ...

  // Filter items
  const inputs = inventory.filter(i => i.category === 'Input' || !i.category);
  const outputs = inventory.filter(i => i.category === 'Output');
  const equipment = inventory.filter(i => i.category === 'Equipment');

  // Helper to render table
  const renderTable = (items, title) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>{title}</div>
      {/* ... table header and rows ... */}
    </div>
  );

  return (
    <div>
      {/* ... Header ... */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div style={{ background: "rgba(15,10,30,0.8)", border: "1px solid rgba(180,140,20,0.15)", borderRadius: 4, padding: "24px" }}>
           {/* Summary Header */}
           
           {/* Render Tables */}
           {renderTable(inputs, "Inputs (Ingredients)")}
           {renderTable(outputs, "Outputs (Products)")}
           {renderTable(equipment, "Equipment")}
        </div>
        
        {/* Add Item Form */}
      </div>
    </div>
  );
}
```
