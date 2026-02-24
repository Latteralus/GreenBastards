-- ============================================================================
-- Seed Recipes Migration
-- Date: 2026-02-24
-- Purpose: Seed all 83 recipes from Recipes.md into products, recipes, and
--          recipe_ingredients tables.
-- ============================================================================

-- Add unique constraints for idempotent inserts
ALTER TABLE public.products ADD CONSTRAINT products_name_unique UNIQUE (name);
ALTER TABLE public.recipes ADD CONSTRAINT recipes_product_id_unique UNIQUE (product_id);
ALTER TABLE public.recipe_ingredients
  ADD CONSTRAINT recipe_ingredients_recipe_ingredient_unique UNIQUE (recipe_id, ingredient_name);

-- ============================================================================
-- 1. INSERT PRODUCTS (83 new products from Recipes.md)
-- ============================================================================
INSERT INTO public.products (name, description, price, in_stock, stock_qty) VALUES
  ('Aalborg Jubilaums Akvavit', 'A traditional Scandinavian akvavit with wheat and herbal notes.', 25.00, true, 0),
  ('Absolut Mandrin', 'Wheat-based spirit brightened with glow berries.', 25.00, true, 0),
  ('Amarula Cream Elixir', 'Smooth oak-aged cream elixir with glow berries, sugar, and milk.', 15.00, true, 0),
  ('Amber Elixir', 'A decade-aged oak elixir crafted from sweet berries.', 15.00, true, 0),
  ('Antiqueno Tapa Roja', 'Triple-distilled sugar cane spirit with herbal accents.', 20.00, true, 0),
  ('Apple Cider', 'Refreshing barrel-aged cider made from 14 fresh apples.', 15.00, true, 0),
  ('Arak', 'Potent triple-distilled anise-style spirit with sweet berries and grass.', 30.00, true, 0),
  ('Aromatic Elixir', 'A complex oak-aged blend of berries, herbs, poppy, and sugar.', 15.00, true, 0),
  ('Batavia Arrack', 'Premium oak-aged arrack distilled from sugar cane and sugar.', 30.00, true, 0),
  ('Bayou Elixir', 'Fiery oak-aged wheat spirit with blaze powder and herbs.', 30.00, true, 0),
  ('Becherovka', 'Herbal Czech-style bitters with potato, wheat, and glow berries.', 20.00, true, 0),
  ('Bitter Elixir', 'Long-aged oak sugar cane elixir with deep bitter character.', 20.00, true, 0),
  ('Breitenbrach Dandelion', 'Light dandelion wine with a touch of glow berries.', 12.00, true, 0),
  ('British Tea', 'Classic milky tea brewed with kelp and sugar.', 12.00, true, 0),
  ('Bubble Spice Water', 'Sparkling triple-distilled berry water with glowstone dust.', 12.00, true, 0),
  ('BuffX-Lite', 'High-potency acacia-aged elixir with carrot, sugar, and golden apple.', 30.00, true, 0),
  ('BuffX-Ultra', 'Ultra-premium oak-aged elixir with golden apple, glow berries, and nether wart.', 30.00, true, 0),
  ('Burning Elixir', 'Intense oak-aged wheat spirit ignited with blaze powder.', 30.00, true, 0),
  ('Cacao Elixir', 'Simple cocoa and honey beverage with nether wart undertones.', 10.00, true, 0),
  ('Carrot Shine Elixir', 'Five-run distilled carrot moonshine with sugar.', 30.00, true, 0),
  ('Celebre', 'Aged mixed-berry elixir with sweet and glow berries.', 30.00, true, 0),
  ('Chill Elixir', 'Light potato-based spirit for easy sipping.', 10.00, true, 0),
  ('Chinese Elixir', 'Rare 30-year aged wheat spirit with nether wart and ghast tear.', 30.00, true, 0),
  ('Cognac', 'Double-distilled aged berry cognac with sugar.', 30.00, true, 0),
  ('Cointreau', 'Orange-style liqueur made from glow berries and sugar.', 25.00, true, 0),
  ('Comiteco 9 Guardianes', 'Mexican agave-style spirit distilled from cactus.', 25.00, true, 0),
  ('Crazy Quatro Elixir', 'Five-run distilled wheat and melon elixir, aged to perfection.', 12.00, true, 0),
  ('Crown Royal Apple', 'Oak-aged Canadian-style wheat whisky with apple.', 25.00, true, 0),
  ('Dandelion Elixir', 'Triple-distilled dandelion and potato spirit.', 25.00, true, 0),
  ('Dark Elixir', 'Dark oak-aged wheat elixir with mysterious depth.', 10.00, true, 0),
  ('Dekuyper Blue Curcacao', 'Vibrant blue liqueur with glow berries, sugar, and blue dye.', 12.00, true, 0),
  ('Duvel', 'Belgian-style wheat ale with extended 161-minute brew and barrel aging.', 10.00, true, 0),
  ('Earthy Japanese Elixir', 'Balanced blend of wheat, bamboo, carrot, and potato.', 18.00, true, 0),
  ('Elixir (Standard)', 'The classic 26-year oak-aged wheat elixir. A benchmark spirit.', 25.00, true, 0),
  ('Fireball Elixir', 'Fiery cinnamon-style wheat whisky with blaze powder.', 25.00, true, 0),
  ('Fruity Mexican Elixir', 'Birch-aged cactus spirit with sugar and golden apple.', 25.00, true, 0),
  ('FTGs Legal Cider', 'Premium acacia-aged cider with golden apple, golden carrot, and ghast tear.', 12.00, true, 0),
  ('Golden Apple Elixir', 'Sweet oak-aged elixir made with sugar and golden apples.', 10.00, true, 0),
  ('Golden Elixir', 'Triple-distilled potato spirit with gold nuggets.', 25.00, true, 0),
  ('Green Elixir', 'Six-run distilled grass spirit with poisonous potato. Handle with care.', 30.00, true, 0),
  ('Herbal German Elixir', 'Oak-aged wheat and chorus fruit herbal liqueur.', 25.00, true, 0),
  ('Hirezake', 'Traditional Japanese hot sake with kelp and pufferfish.', 15.00, true, 0),
  ('Honey Elixir', 'Long-aged oak wheat elixir sweetened with honey bottles.', 10.00, true, 0),
  ('Iced Coffee', 'Chilled coffee made from cookies, snowballs, and milk.', 15.00, true, 0),
  ('Irish Shine Elixir', 'Five-run distilled potato and wheat moonshine.', 30.00, true, 0),
  ('Koors Light Elixir', 'Light and easy wheat elixir. The session drink of choice.', 8.00, true, 0),
  ('Lairds 12Year Apple', 'Premium 12-year oak-aged apple brandy with golden apple.', 25.00, true, 0),
  ('Lous Rus Elixir', 'Triple-distilled pure potato spirit.', 25.00, true, 0),
  ('Maple Elixir', 'Five-run dark oak-aged maple spirit with blaze powder heat.', 30.00, true, 0),
  ('Mekhong', 'Thai-style spirit from sugar cane, dried kelp, and grass.', 25.00, true, 0),
  ('Mexican Elixir', 'Long-aged birch cactus tequila-style spirit.', 25.00, true, 0),
  ('Miami Elixir', 'Light tropical elixir with sugar cane, chorus fruit, and berries.', 10.00, true, 0),
  ('Ming Elixir', 'Five-run dark oak-aged wheat and nether wart spirit.', 30.00, true, 0),
  ('Mudslide', 'Creamy oak-aged cocoa and sugar dessert drink with snowball.', 12.00, true, 0),
  ('Pirassununga 51', 'Triple-distilled Brazilian cachaca-style sugar cane spirit.', 25.00, true, 0),
  ('Port Elixir', 'Rich 12-year oak-aged fortified sugar elixir.', 30.00, true, 0),
  ('Pulque', 'Simple Mexican cactus beverage. Fresh and unaged.', 10.00, true, 0),
  ('Pumpkin Elixir', 'Seasonal wheat and pumpkin ale with a blaze powder kick.', 10.00, true, 0),
  ('Red Elixir', 'Deep 20-year oak-aged sweet berry elixir.', 15.00, true, 0),
  ('Red Star Erguotou', 'Potent Chinese baijiu-style nether wart and sugar spirit.', 30.00, true, 0),
  ('Redds Apple Elixir', 'Light fruity wheat and apple session drink.', 10.00, true, 0),
  ('Rhinegeist Zango', 'Easy-drinking oak-aged wheat ale with apple and glow berries.', 8.00, true, 0),
  ('Root Elixir', 'Herbal wheat spirit with blue-flowers and apple.', 25.00, true, 0),
  ('Seedy Soup', 'Hearty seed-based soup with wheat seeds and beetroot seeds.', 12.00, true, 0),
  ('Slime Elixir', 'Six-run distilled pure grass spirit. Green and potent.', 25.00, true, 0),
  ('Slivovitz', 'Traditional Eastern European plum-style brandy aged 10 years in oak.', 30.00, true, 0),
  ('Sour Apple Elixir', 'Long-brewed 8-year oak-aged pure apple spirit.', 25.00, true, 0),
  ('Spirit Shine Elixir', 'Five-run distilled wheat moonshine with sweet berries.', 30.00, true, 0),
  ('Steel Reserve 211', 'Strong wheat malt beverage aged 4 years.', 10.00, true, 0),
  ('Strange Elixir', 'Curious oak-aged sugar cane elixir with odd character.', 10.00, true, 0),
  ('Sweet Apple Elixir', 'Gentle oak-aged sugar cane and apple blend.', 12.00, true, 0),
  ('Sweet Japanese Elixir', 'Delicate 8-year aged kelp-based Japanese spirit.', 12.00, true, 0),
  ('Sweet Mexican Elixir', 'Oak-aged cactus and sugar cane sweet spirit.', 25.00, true, 0),
  ('Tea Recipe', 'Handcrafted tea brewed from oak leaves and sugar.', 18.00, true, 0),
  ('Victoria Bitter', 'Classic Australian-style wheat and sugar bitter.', 8.00, true, 0),
  ('Vesper Martini', 'Sophisticated birch-aged berry and potato martini with glow berries.', 25.00, true, 0),
  ('Warm Irish Cream', 'Comforting wheat, milk, and cocoa cream liqueur.', 15.00, true, 0),
  ('Weekend Elixir', 'Quick and easy glow berry, sugar cane, and wheat session drink.', 8.00, true, 0),
  ('White Elixir', 'Elegant 15-year oak-aged sweet berry elixir with white dye.', 12.00, true, 0),
  ('Wolffer Estate Rose', 'Refined 15-year oak-aged rose made with sweet berries, sugar, and peony.', 12.00, true, 0),
  ('Xifenghiu', 'Legendary 15-year dark oak-aged six-run baijiu with nether wart.', 30.00, true, 0),
  ('Xin Li He Zhu', 'Triple-distilled wheat and bamboo spirit with sugar.', 30.00, true, 0),
  ('Zombie Zin Zinfadel', 'Oak-aged berry zinfandel with sugar cane and rotten flesh.', 12.00, true, 0)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. INSERT RECIPES (one per product)
-- ============================================================================

-- Aalborg Jubilaums Akvavit
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Aalborg Jubilaums Akvavit'), 7, '16m', 1, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Absolut Mandrin
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Absolut Mandrin'), 7, '16m', 1, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Amarula Cream Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Amarula Cream Elixir'), 4, '1m', 1, '2 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Amber Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Amber Elixir'), 4, '8m', 1, '10 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Antiqueno Tapa Roja
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Antiqueno Tapa Roja'), 6, '12m', 3, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Apple Cider
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Apple Cider'), 4, '7m', 0, '2 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Arak
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Arak'), 8, '22m', 3, '1 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Aromatic Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Aromatic Elixir'), 4, '8m', 3, '1 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Batavia Arrack
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Batavia Arrack'), 8, '20m', 1, '8 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Bayou Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Bayou Elixir'), 8, '20m', 3, '4 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Becherovka
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Becherovka'), 6, '2m', 2, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Bitter Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Bitter Elixir'), 6, '8m', 0, '18 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Breitenbrach Dandelion
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Breitenbrach Dandelion'), 3, '6m', 0, '3 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- British Tea
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'British Tea'), 3, '2m', 0, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Bubble Spice Water
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Bubble Spice Water'), 3, '3m', 3, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- BuffX-Lite
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'BuffX-Lite'), 8, '15m', 5, '6 yrs', 'Acacia', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- BuffX-Ultra
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'BuffX-Ultra'), 8, '16m', 4, '15 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Burning Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Burning Elixir'), 8, '14m', 1, '5 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Cacao Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Cacao Elixir'), 2, '4m', 0, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Carrot Shine Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Carrot Shine Elixir'), 8, '24m', 5, '5 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Celebre
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Celebre'), 8, '4m', 0, '5 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Chill Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Chill Elixir'), 2, '4m', 1, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Chinese Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Chinese Elixir'), 8, '20m', 6, '30 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Cognac
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Cognac'), 8, '16m', 2, '8 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Cointreau
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Cointreau'), 7, '10m', 2, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Comiteco 9 Guardianes
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Comiteco 9 Guardianes'), 7, '18m', 2, '1 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Crazy Quatro Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Crazy Quatro Elixir'), 3, '13m', 5, '5 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Crown Royal Apple
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Crown Royal Apple'), 7, '14m', 1, '3 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Dandelion Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Dandelion Elixir'), 7, '25m', 3, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Dark Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Dark Elixir'), 2, '7m', 1, '7 yrs', 'Dark Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Dekuyper Blue Curcacao
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Dekuyper Blue Curcacao'), 3, '6m', 1, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Duvel
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Duvel'), 2, '161m', 0, '5 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Earthy Japanese Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Earthy Japanese Elixir'), 5, '2m', 1, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Elixir (Standard)
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Elixir (Standard)'), 7, '14m', 2, '26 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Fireball Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Fireball Elixir'), 7, '14m', 3, '3 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Fruity Mexican Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Fruity Mexican Elixir'), 7, '16m', 2, '20 yrs', 'Birch', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- FTGs Legal Cider
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'FTGs Legal Cider'), 3, '6m', 0, '5 yrs', 'Acacia', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Golden Apple Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Golden Apple Elixir'), 2, '4m', 0, '4 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Golden Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Golden Elixir'), 7, '25m', 3, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Green Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Green Elixir'), 8, '6m', 6, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Herbal German Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Herbal German Elixir'), 7, '14m', 0, '1 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Hirezake
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Hirezake'), 4, '4m', 0, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Honey Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Honey Elixir'), 2, '12m', 1, '23 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Iced Coffee
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Iced Coffee'), 4, '1m', 0, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Irish Shine Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Irish Shine Elixir'), 8, '24m', 5, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Koors Light Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Koors Light Elixir'), 1, '5m', 0, '2 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Lairds 12Year Apple
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Lairds 12Year Apple'), 7, '18m', 2, '12 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Lous Rus Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Lous Rus Elixir'), 7, '25m', 3, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Maple Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Maple Elixir'), 8, '24m', 5, '16 yrs', 'Dark Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Mekhong
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Mekhong'), 7, '14m', 2, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Mexican Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Mexican Elixir'), 7, '25m', 3, '20 yrs', 'Birch', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Miami Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Miami Elixir'), 2, '4m', 1, '1 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Ming Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Ming Elixir'), 8, '18m', 5, '16 yrs', 'Dark Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Mudslide
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Mudslide'), 3, '6m', 0, '1 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Pirassununga 51
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Pirassununga 51'), 7, '16m', 3, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Port Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Port Elixir'), 8, '24m', 1, '12 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Pulque
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Pulque'), 2, '4m', 0, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Pumpkin Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Pumpkin Elixir'), 2, '7m', 0, '3 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Red Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Red Elixir'), 4, '6m', 0, '20 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Red Star Erguotou
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Red Star Erguotou'), 8, '22m', 2, '8 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Redds Apple Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Redds Apple Elixir'), 2, '2m', 0, '2 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Rhinegeist Zango
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Rhinegeist Zango'), 1, '2m', 0, '1 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Root Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Root Elixir'), 7, '10m', 2, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Seedy Soup
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Seedy Soup'), 3, '2m', 0, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Slime Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Slime Elixir'), 7, '2m', 6, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Slivovitz
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Slivovitz'), 8, '27m', 2, '10 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Sour Apple Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Sour Apple Elixir'), 7, '30m', 1, '8 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Spirit Shine Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Spirit Shine Elixir'), 8, '24m', 5, '7 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Steel Reserve 211
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Steel Reserve 211'), 2, '12m', 0, '4 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Strange Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Strange Elixir'), 2, '4m', 0, '3 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Sweet Apple Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Sweet Apple Elixir'), 3, '7m', 0, '4 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Sweet Japanese Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Sweet Japanese Elixir'), 3, '3m', 0, '8 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Sweet Mexican Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Sweet Mexican Elixir'), 7, '18m', 0, '1 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Tea Recipe
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Tea Recipe'), 5, '2m', 0, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Victoria Bitter
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Victoria Bitter'), 1, '7m', 0, '5 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Vesper Martini
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Vesper Martini'), 7, '10m', 4, '5 yrs', 'Birch', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Warm Irish Cream
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Warm Irish Cream'), 4, '8m', 1, '3 yrs', 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Weekend Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Weekend Elixir'), 1, '2m', 0, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- White Elixir
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'White Elixir'), 3, '6m', 0, '15 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Wolffer Estate Rose
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Wolffer Estate Rose'), 3, '6m', 0, '15 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Xifenghiu
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Xifenghiu'), 8, '30m', 6, '15 yrs', 'Dark Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Xin Li He Zhu
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Xin Li He Zhu'), 8, '25m', 3, NULL, 'Any', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- Zombie Zin Zinfadel
INSERT INTO public.recipes (product_id, difficulty, cooking_time, distill_runs, age_requirement, barrel_type, notes)
VALUES ((SELECT id FROM products WHERE name = 'Zombie Zin Zinfadel'), 3, '6m', 0, '2 yrs', 'Oak', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- ============================================================================
-- 3. INSERT RECIPE INGREDIENTS
-- ============================================================================

-- Aalborg Jubilaums Akvavit: 15x Wheat, 5x Glow Berries, 5x Short Grass
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Aalborg Jubilaums Akvavit')), 'Wheat', 15, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Aalborg Jubilaums Akvavit')), 'Glow Berries', 5, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Aalborg Jubilaums Akvavit')), 'Short Grass', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Absolut Mandrin: 15x Wheat, 10x Glow Berries
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Absolut Mandrin')), 'Wheat', 15, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Absolut Mandrin')), 'Glow Berries', 10, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Amarula Cream Elixir: 5x Glow Berries, 4x Sugar, 1x Milk Bucket
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Amarula Cream Elixir')), 'Glow Berries', 5, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Amarula Cream Elixir')), 'Sugar', 4, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Amarula Cream Elixir')), 'Milk Bucket', 1, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Amber Elixir: 10x Sweet Berries
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Amber Elixir')), 'Sweet Berries', 10, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Antiqueno Tapa Roja: 10x Sugar Cane, 5x Short Grass
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Antiqueno Tapa Roja')), 'Sugar Cane', 10, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Antiqueno Tapa Roja')), 'Short Grass', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Apple Cider: 14x Apple
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Apple Cider')), 'Apple', 14, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Arak: 15x Sweet Berries, 15x Short Grass
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Arak')), 'Sweet Berries', 15, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Arak')), 'Short Grass', 15, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Aromatic Elixir: 3x Sweet Berries, 3x Glow Berries, 2x Short Grass, 1x Poppy, 1x Sugar
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Aromatic Elixir')), 'Sweet Berries', 3, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Aromatic Elixir')), 'Glow Berries', 3, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Aromatic Elixir')), 'Short Grass', 2, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Aromatic Elixir')), 'Poppy', 1, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Aromatic Elixir')), 'Sugar', 1, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Batavia Arrack: 10x Sugar Cane, 15x Sugar
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Batavia Arrack')), 'Sugar Cane', 10, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Batavia Arrack')), 'Sugar', 15, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Bayou Elixir: 15x Wheat, 10x Blaze Powder, 5x Short Grass
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Bayou Elixir')), 'Wheat', 15, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Bayou Elixir')), 'Blaze Powder', 10, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Bayou Elixir')), 'Short Grass', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Becherovka: 5x Potato, 5x Short Grass, 5x Wheat, 2x Glow Berries
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Becherovka')), 'Potato', 5, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Becherovka')), 'Short Grass', 5, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Becherovka')), 'Wheat', 5, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Becherovka')), 'Glow Berries', 2, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Bitter Elixir: 24x Sugar Cane
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Bitter Elixir')), 'Sugar Cane', 24, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Breitenbrach Dandelion: 8x Dandelion, 2x Glow Berries
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Breitenbrach Dandelion')), 'Dandelion', 8, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Breitenbrach Dandelion')), 'Glow Berries', 2, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- British Tea: 2x Milk Bucket, 4x Sugar, 5x Kelp
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'British Tea')), 'Milk Bucket', 2, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'British Tea')), 'Sugar', 4, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'British Tea')), 'Kelp', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Bubble Spice Water: 5x Sweet Berries, 3x Glowstone Dust
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Bubble Spice Water')), 'Sweet Berries', 5, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Bubble Spice Water')), 'Glowstone Dust', 3, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- BuffX-Lite: 6x Carrot, 3x Sugar, 2x Golden Apple
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'BuffX-Lite')), 'Carrot', 6, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'BuffX-Lite')), 'Sugar', 3, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'BuffX-Lite')), 'Golden Apple', 2, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- BuffX-Ultra: 2x Golden Apple, 2x Glow Berries, 2x Nether Wart
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'BuffX-Ultra')), 'Golden Apple', 2, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'BuffX-Ultra')), 'Glow Berries', 2, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'BuffX-Ultra')), 'Nether Wart', 2, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Burning Elixir: 12x Wheat, 2x Blaze Powder
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Burning Elixir')), 'Wheat', 12, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Burning Elixir')), 'Blaze Powder', 2, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Cacao Elixir: 6x Cocoa Beans, 1x Honey Bottle, 1x Nether Wart
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Cacao Elixir')), 'Cocoa Beans', 6, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Cacao Elixir')), 'Honey Bottle', 1, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Cacao Elixir')), 'Nether Wart', 1, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Carrot Shine Elixir: 30x Carrot, 5x Sugar
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Carrot Shine Elixir')), 'Carrot', 30, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Carrot Shine Elixir')), 'Sugar', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Celebre: 6x Sweet Berries, 6x Glow Berries
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Celebre')), 'Sweet Berries', 6, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Celebre')), 'Glow Berries', 6, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Chill Elixir: 3x Potato
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Chill Elixir')), 'Potato', 3, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Chinese Elixir: 15x Wheat, 8x Nether Wart, 2x Ghast Tear
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Chinese Elixir')), 'Wheat', 15, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Chinese Elixir')), 'Nether Wart', 8, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Chinese Elixir')), 'Ghast Tear', 2, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Cognac: 15x Sweet Berries, 5x Glow Berries, 5x Sugar
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Cognac')), 'Sweet Berries', 15, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Cognac')), 'Glow Berries', 5, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Cognac')), 'Sugar', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Cointreau: 15x Glow Berries, 2x Sugar
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Cointreau')), 'Glow Berries', 15, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Cointreau')), 'Sugar', 2, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Comiteco 9 Guardianes: 25x Cactus
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Comiteco 9 Guardianes')), 'Cactus', 25, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Crazy Quatro Elixir: 9x Wheat, 3x Melon Slice, 1x Sugar
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Crazy Quatro Elixir')), 'Wheat', 9, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Crazy Quatro Elixir')), 'Melon Slice', 3, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Crazy Quatro Elixir')), 'Sugar', 1, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Crown Royal Apple: 15x Wheat, 5x Apple
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Crown Royal Apple')), 'Wheat', 15, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Crown Royal Apple')), 'Apple', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Dandelion Elixir: 9x Dandelion, 9x Potato
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Dandelion Elixir')), 'Dandelion', 9, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Dandelion Elixir')), 'Potato', 9, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Dark Elixir: 6x Wheat
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Dark Elixir')), 'Wheat', 6, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Dekuyper Blue Curcacao: 5x Glow Berries, 5x Sugar, 1x Blue Dye
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Dekuyper Blue Curcacao')), 'Glow Berries', 5, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Dekuyper Blue Curcacao')), 'Sugar', 5, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Dekuyper Blue Curcacao')), 'Blue Dye', 1, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Duvel: 9x Wheat
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Duvel')), 'Wheat', 9, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Earthy Japanese Elixir: 3x Wheat, 3x Bamboo, 3x Carrot, 3x Potato
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Earthy Japanese Elixir')), 'Wheat', 3, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Earthy Japanese Elixir')), 'Bamboo', 3, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Earthy Japanese Elixir')), 'Carrot', 3, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Earthy Japanese Elixir')), 'Potato', 3, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Elixir (Standard): 14x Wheat
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Elixir (Standard)')), 'Wheat', 14, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Fireball Elixir: 15x Wheat, 5x Blaze Powder
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Fireball Elixir')), 'Wheat', 15, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Fireball Elixir')), 'Blaze Powder', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Fruity Mexican Elixir: 20x Cactus, 3x Sugar, 2x Golden Apple
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Fruity Mexican Elixir')), 'Cactus', 20, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Fruity Mexican Elixir')), 'Sugar', 3, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Fruity Mexican Elixir')), 'Golden Apple', 2, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- FTGs Legal Cider: 4x Golden Apple, 6x Golden Carrot, 4x Ghast Tear
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'FTGs Legal Cider')), 'Golden Apple', 4, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'FTGs Legal Cider')), 'Golden Carrot', 6, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'FTGs Legal Cider')), 'Ghast Tear', 4, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Golden Apple Elixir: 6x Sugar, 2x Golden Apple
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Golden Apple Elixir')), 'Sugar', 6, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Golden Apple Elixir')), 'Golden Apple', 2, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Golden Elixir: 12x Potato, 6x Gold Nugget
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Golden Elixir')), 'Potato', 12, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Golden Elixir')), 'Gold Nugget', 6, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Green Elixir: 15x Short Grass, 2x Poisonous Potato
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Green Elixir')), 'Short Grass', 15, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Green Elixir')), 'Poisonous Potato', 2, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Herbal German Elixir: 5x Wheat, 5x Sugar, 4x Glow Berries, 4x Chorus Fruit
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Herbal German Elixir')), 'Wheat', 5, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Herbal German Elixir')), 'Sugar', 5, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Herbal German Elixir')), 'Glow Berries', 4, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Herbal German Elixir')), 'Chorus Fruit', 4, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Hirezake: 4x Kelp, 3x Pufferfish
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Hirezake')), 'Kelp', 4, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Hirezake')), 'Pufferfish', 3, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Honey Elixir: 11x Wheat, 3x Honey Bottle
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Honey Elixir')), 'Wheat', 11, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Honey Elixir')), 'Honey Bottle', 3, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Iced Coffee: 8x Cookie, 4x Snowball, 1x Milk Bucket
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Iced Coffee')), 'Cookie', 8, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Iced Coffee')), 'Snowball', 4, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Iced Coffee')), 'Milk Bucket', 1, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Irish Shine Elixir: 15x Potato, 15x Wheat, 5x Sugar
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Irish Shine Elixir')), 'Potato', 15, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Irish Shine Elixir')), 'Wheat', 15, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Irish Shine Elixir')), 'Sugar', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Koors Light Elixir: 5x Wheat
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Koors Light Elixir')), 'Wheat', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Lairds 12Year Apple: 23x Apple, 2x Golden Apple
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Lairds 12Year Apple')), 'Apple', 23, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Lairds 12Year Apple')), 'Golden Apple', 2, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Lous Rus Elixir: 18x Potato
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Lous Rus Elixir')), 'Potato', 18, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Maple Elixir: 25x Sugar, 5x Blaze Powder
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Maple Elixir')), 'Sugar', 25, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Maple Elixir')), 'Blaze Powder', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Mekhong: 10x Sugar Cane, 3x Dried Kelp, 3x Short Grass
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Mekhong')), 'Sugar Cane', 10, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Mekhong')), 'Dried Kelp', 3, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Mekhong')), 'Short Grass', 3, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Mexican Elixir: 14x Cactus
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Mexican Elixir')), 'Cactus', 14, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Miami Elixir: 2x Sugar Cane, 1x Chorus Fruit, 1x Sweet Berries
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Miami Elixir')), 'Sugar Cane', 2, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Miami Elixir')), 'Chorus Fruit', 1, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Miami Elixir')), 'Sweet Berries', 1, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Ming Elixir: 10x Wheat, 10x Nether Wart, 5x Short Grass
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Ming Elixir')), 'Wheat', 10, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Ming Elixir')), 'Nether Wart', 10, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Ming Elixir')), 'Short Grass', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Mudslide: 4x Cocoa Beans, 4x Sugar, 2x Snowball
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Mudslide')), 'Cocoa Beans', 4, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Mudslide')), 'Sugar', 4, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Mudslide')), 'Snowball', 2, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Pirassununga 51: 25x Sugar Cane
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Pirassununga 51')), 'Sugar Cane', 25, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Port Elixir: 30x Sugar
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Port Elixir')), 'Sugar', 30, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Pulque: 5x Cactus
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Pulque')), 'Cactus', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Pumpkin Elixir: 6x Wheat, 6x Pumpkin, 3x Blaze Powder
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Pumpkin Elixir')), 'Wheat', 6, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Pumpkin Elixir')), 'Pumpkin', 6, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Pumpkin Elixir')), 'Blaze Powder', 3, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Red Elixir: 8x Sweet Berries
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Red Elixir')), 'Sweet Berries', 8, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Red Star Erguotou: 20x Nether Wart, 10x Sugar
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Red Star Erguotou')), 'Nether Wart', 20, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Red Star Erguotou')), 'Sugar', 10, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Redds Apple Elixir: 2x Wheat, 2x Apple, 1x Sugar
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Redds Apple Elixir')), 'Wheat', 2, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Redds Apple Elixir')), 'Apple', 2, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Redds Apple Elixir')), 'Sugar', 1, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Rhinegeist Zango: 2x Wheat, 1x Apple, 1x Glow Berries
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Rhinegeist Zango')), 'Wheat', 2, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Rhinegeist Zango')), 'Apple', 1, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Rhinegeist Zango')), 'Glow Berries', 1, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Root Elixir: 10x Wheat, 7x Blue-flowers, 3x Apple
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Root Elixir')), 'Wheat', 10, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Root Elixir')), 'Blue-flowers', 7, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Root Elixir')), 'Apple', 3, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Seedy Soup: 20x Wheat Seeds, 20x Beetroot Seeds
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Seedy Soup')), 'Wheat Seeds', 20, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Seedy Soup')), 'Beetroot Seeds', 20, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Slime Elixir: 15x Short Grass
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Slime Elixir')), 'Short Grass', 15, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Slivovitz: 10x Sweet Berries, 5x Wheat, 5x Sugar
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Slivovitz')), 'Sweet Berries', 10, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Slivovitz')), 'Wheat', 5, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Slivovitz')), 'Sugar', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Sour Apple Elixir: 24x Apple
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Sour Apple Elixir')), 'Apple', 24, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Spirit Shine Elixir: 30x Wheat, 5x Sweet Berries
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Spirit Shine Elixir')), 'Wheat', 30, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Spirit Shine Elixir')), 'Sweet Berries', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Steel Reserve 211: 10x Wheat
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Steel Reserve 211')), 'Wheat', 10, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Strange Elixir: 8x Sugar Cane
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Strange Elixir')), 'Sugar Cane', 8, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Sweet Apple Elixir: 7x Sugar Cane, 2x Apple
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Sweet Apple Elixir')), 'Sugar Cane', 7, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Sweet Apple Elixir')), 'Apple', 2, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Sweet Japanese Elixir: 6x Kelp
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Sweet Japanese Elixir')), 'Kelp', 6, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Sweet Mexican Elixir: 20x Cactus, 5x Sugar Cane
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Sweet Mexican Elixir')), 'Cactus', 20, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Sweet Mexican Elixir')), 'Sugar Cane', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Tea Recipe: 5x Oak Leaves, 6x Sugar
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Tea Recipe')), 'Oak Leaves', 5, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Tea Recipe')), 'Sugar', 6, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Victoria Bitter: 3x Wheat, 2x Sugar
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Victoria Bitter')), 'Wheat', 3, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Victoria Bitter')), 'Sugar', 2, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Vesper Martini: 10x Sweet Berries, 5x Potato, 5x Glow Berries
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Vesper Martini')), 'Sweet Berries', 10, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Vesper Martini')), 'Potato', 5, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Vesper Martini')), 'Glow Berries', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Warm Irish Cream: 5x Wheat, 2x Milk Bucket, 2x Cocoa Beans
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Warm Irish Cream')), 'Wheat', 5, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Warm Irish Cream')), 'Milk Bucket', 2, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Warm Irish Cream')), 'Cocoa Beans', 2, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Weekend Elixir: 2x Glow Berries, 2x Sugar Cane, 1x Wheat
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Weekend Elixir')), 'Glow Berries', 2, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Weekend Elixir')), 'Sugar Cane', 2, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Weekend Elixir')), 'Wheat', 1, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- White Elixir: 8x Sweet Berries, 2x White Dye
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'White Elixir')), 'Sweet Berries', 8, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'White Elixir')), 'White Dye', 2, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Wolffer Estate Rose: 7x Sweet Berries, 2x Sugar, 1x Peony
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Wolffer Estate Rose')), 'Sweet Berries', 7, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Wolffer Estate Rose')), 'Sugar', 2, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Wolffer Estate Rose')), 'Peony', 1, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Xifenghiu: 11x Nether Wart, 7x Wheat, 4x Short Grass
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Xifenghiu')), 'Nether Wart', 11, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Xifenghiu')), 'Wheat', 7, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Xifenghiu')), 'Short Grass', 4, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Xin Li He Zhu: 12x Wheat, 8x Bamboo, 5x Sugar
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Xin Li He Zhu')), 'Wheat', 12, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Xin Li He Zhu')), 'Bamboo', 8, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Xin Li He Zhu')), 'Sugar', 5, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;

-- Zombie Zin Zinfadel: 5x Sweet Berries, 4x Sugar Cane, 1x Rotten Flesh
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Zombie Zin Zinfadel')), 'Sweet Berries', 5, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Zombie Zin Zinfadel')), 'Sugar Cane', 4, 'x'),
  ((SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Zombie Zin Zinfadel')), 'Rotten Flesh', 1, 'x')
ON CONFLICT (recipe_id, ingredient_name) DO NOTHING;
