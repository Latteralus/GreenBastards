-- ============================================================================
-- Storefront, Orders & Recipes Migration
-- Date: 2026-02-24
-- Purpose: Add products, recipes, orders system for business platform expansion
-- ============================================================================

-- 1. Products table — public menu items
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  in_stock boolean default true,
  stock_qty integer default 0,
  image_url text,
  created_at timestamptz default now()
);

-- 2. Recipes table — production instructions per product
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  difficulty integer,
  cooking_time text,
  distill_runs integer,
  age_requirement text,
  barrel_type text,
  notes text,
  created_at timestamptz default now()
);

-- 3. Recipe ingredients table — ingredients per recipe
create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references public.recipes(id) on delete cascade,
  ingredient_name text not null,
  quantity integer not null,
  unit text default 'x'
);

-- 4. Orders table — customer orders with full lifecycle
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_ic_name text not null,
  customer_discord text,
  delivery_method text check (delivery_method in ('Pickup', 'Delivery')),
  delivery_location text,
  status text default 'Submitted' check (status in (
    'Submitted', 'Awaiting Payment', 'Confirmed',
    'In Production', 'Ready', 'Delivered', 'Cancelled'
  )),
  payment_confirmed boolean default false,
  total_cost numeric(10,2),
  notes text,
  assigned_to text,
  status_updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 5. Order items table — line items per order
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text,
  quantity integer not null,
  unit_price numeric(10,2),
  subtotal numeric(10,2)
);

-- 6. Add a sample Brewer account for testing
insert into public.accounts (username, password, position)
values ('BrewerTest', 'brew1239', 'Brewer')
on conflict (username) do nothing;

-- 7. Seed some sample products for testing
insert into public.products (name, description, price, in_stock, stock_qty) values
  ('Bastard Ale', 'A classic amber ale brewed with the finest in-game hops. Rich malty flavor with a smooth finish.', 15.00, true, 24),
  ('Glow Berry Mead', 'Sweet mead brewed with rare Glow Berries from the Deep Dark. Limited edition.', 35.00, false, 0);
