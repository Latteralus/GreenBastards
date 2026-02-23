-- Migration: Correct Inventory Items
-- Description: Clears existing inventory (Hops, Malt, etc.) and inserts the correct default list as requested.
-- Date: 2026-02-23

-- Clear existing data
TRUNCATE TABLE public.inventory RESTART IDENTITY;

-- Insert correct default items with 0 quantity and 0 value
INSERT INTO public.inventory (item_name, quantity, est_value)
VALUES
  ('Wheat', 0, 0.00),
  ('Sugarcane', 0, 0.00),
  ('Glow Berries', 0, 0.00),
  ('Carrot', 0, 0.00),
  ('Potato', 0, 0.00),
  ('Glowstone dust', 0, 0.00),
  ('Chorus Fruit', 0, 0.00),
  ('Blaze powder', 0, 0.00),
  ('Nether Wart', 0, 0.00),
  ('Melon', 0, 0.00),
  ('Pumpkin', 0, 0.00),
  ('Cactus', 0, 0.00),
  ('Cocoa beans', 0, 0.00),
  ('Apples', 0, 0.00),
  ('Dyes', 0, 0.00),
  ('Ghast Tear', 0, 0.00),
  ('Short Grass', 0, 0.00),
  ('Slime', 0, 0.00),
  ('Sweet Berries', 0, 0.00),
  ('Milk bucket', 0, 0.00),
  ('Glass Bottle', 0, 0.00);
