INSERT INTO public.inventory (item_name, quantity, est_value) VALUES
('Hops', 50, 12.50),
('Malt', 100, 8.00),
('Barley', 200, 5.00),
('Yeast', 20, 15.00),
('Bottles', 500, 0.50),
('Barrels', 10, 120.00)
ON CONFLICT (item_name) DO NOTHING;
