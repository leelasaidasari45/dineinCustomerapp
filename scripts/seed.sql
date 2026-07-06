-- ============================================================
-- DineIn — Fix Schema + Seed Data
-- Paste this in Supabase SQL Editor → Run
-- ============================================================

-- Step 1: Add missing columns if they don't exist
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS avg_prep_time_minutes INTEGER DEFAULT 20;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 4.0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Step 2: Add unique constraints (safe — skips if already exists)
DO $$ BEGIN
  ALTER TABLE restaurants ADD CONSTRAINT restaurants_name_key UNIQUE (name);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE menu_items ADD CONSTRAINT menu_items_restaurant_id_name_key UNIQUE (restaurant_id, name);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Step 3: Insert Restaurants ───────────────────────────────
INSERT INTO restaurants (name, cuisine_tags, address, photo_url, avg_prep_time_minutes, rating, is_open) VALUES
('Spice Garden',       ARRAY['North Indian','Biryani','Curries'],        '12 MG Road, Bangalore',     'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', 25, 4.5, true),
('The Pizza Republic', ARRAY['Pizza','Italian','Burgers'],               '45 Indiranagar, Bangalore',  'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=800&q=80', 20, 4.3, true),
('Wok & Roll',         ARRAY['Chinese','Noodles','Asian'],               '7 Koramangala, Bangalore',   'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80', 18, 4.1, true),
('South Spice',        ARRAY['South Indian','Dosa','Filter Coffee'],     '3 Jayanagar, Bangalore',     'https://images.unsplash.com/photo-1630383249896-483b843e5b89?w=800&q=80', 15, 4.6, true),
('Burger Barn',        ARRAY['Burgers','American','Fries'],              '22 Whitefield, Bangalore',   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', 12, 4.0, true),
('Sweet Cravings',     ARRAY['Desserts','Ice Cream','Cakes'],            '8 HSR Layout, Bangalore',    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80', 10, 4.7, true)
ON CONFLICT (name) DO UPDATE SET
  cuisine_tags = EXCLUDED.cuisine_tags,
  photo_url    = EXCLUDED.photo_url,
  rating       = EXCLUDED.rating;

-- ── Step 4: Insert Menu Items ────────────────────────────────

-- Spice Garden
INSERT INTO menu_items (restaurant_id, name, category, price, is_veg, description, photo_url, is_available)
SELECT r.id, v.name, v.category, v.price::numeric, v.is_veg::boolean, v.description, NULLIF(v.photo_url,''), true
FROM restaurants r CROSS JOIN (VALUES
  ('Paneer Tikka',        'Starters',    '280', 'true',  'Marinated cottage cheese grilled to perfection',   'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80'),
  ('Chicken Seekh Kebab', 'Starters',    '340', 'false', 'Minced chicken with aromatic spices',              'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80'),
  ('Samosa (2 pcs)',      'Starters',    '80',  'true',  'Crispy pastry with spiced potato filling',         ''),
  ('Butter Chicken',      'Main Course', '380', 'false', 'Slow-cooked chicken in rich tomato-cream gravy',   'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80'),
  ('Dal Makhani',         'Main Course', '280', 'true',  'Black lentils slow-cooked overnight with butter',  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80'),
  ('Chicken Biryani',     'Main Course', '420', 'false', 'Fragrant basmati with juicy chicken pieces',       'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80'),
  ('Paneer Butter Masala','Main Course', '320', 'true',  'Rich and creamy paneer in tomato gravy',           ''),
  ('Garlic Naan',         'Breads',      '60',  'true',  'Soft naan with garlic butter',                     ''),
  ('Tandoori Roti',       'Breads',      '40',  'true',  'Whole wheat bread baked in tandoor',               ''),
  ('Gulab Jamun',         'Desserts',    '120', 'true',  'Soft milk dumplings in rose syrup',                'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400&q=80'),
  ('Mango Lassi',         'Beverages',   '120', 'true',  'Chilled yogurt smoothie with Alphonso mango',      '')
) AS v(name, category, price, is_veg, description, photo_url)
WHERE r.name = 'Spice Garden'
ON CONFLICT (restaurant_id, name) DO NOTHING;

-- The Pizza Republic
INSERT INTO menu_items (restaurant_id, name, category, price, is_veg, description, photo_url, is_available)
SELECT r.id, v.name, v.category, v.price::numeric, v.is_veg::boolean, v.description, NULLIF(v.photo_url,''), true
FROM restaurants r CROSS JOIN (VALUES
  ('Garlic Bread',        'Starters',  '150', 'true',  'Toasted baguette with herb garlic butter',           ''),
  ('Chicken Wings',       'Starters',  '320', 'false', 'Crispy wings with choice of sauce',                  'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=80'),
  ('Margherita',          'Pizzas',    '350', 'true',  'Classic tomato, mozzarella, fresh basil',            'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80'),
  ('BBQ Chicken Pizza',   'Pizzas',    '450', 'false', 'Smoky BBQ sauce, chicken, onions, peppers',          'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80'),
  ('Veggie Supreme',      'Pizzas',    '400', 'true',  'Loaded with seasonal vegetables',                    'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&q=80'),
  ('Classic Smash Burger','Burgers',   '280', 'false', 'Double smashed beef patty, cheese, special sauce',   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80'),
  ('Crispy Veg Burger',   'Burgers',   '220', 'true',  'Crispy veggie patty, lettuce, tomato',               ''),
  ('Tiramisu',            'Desserts',  '220', 'true',  'Classic Italian dessert with espresso',              'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80'),
  ('Fresh Lime Soda',     'Beverages', '80',  'true',  'Sweet, salt, or masala your choice',                 '')
) AS v(name, category, price, is_veg, description, photo_url)
WHERE r.name = 'The Pizza Republic'
ON CONFLICT (restaurant_id, name) DO NOTHING;

-- Wok & Roll
INSERT INTO menu_items (restaurant_id, name, category, price, is_veg, description, photo_url, is_available)
SELECT r.id, v.name, v.category, v.price::numeric, v.is_veg::boolean, v.description, NULLIF(v.photo_url,''), true
FROM restaurants r CROSS JOIN (VALUES
  ('Spring Rolls (4 pcs)',   'Starters',  '220', 'true',  'Crispy rolls with vegetable filling',               ''),
  ('Chicken Dumplings',      'Starters',  '280', 'false', 'Steamed or fried with soy dipping sauce',           'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80'),
  ('Hakka Noodles',          'Noodles',   '240', 'true',  'Stir-fried noodles with veggies and soy sauce',     'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80'),
  ('Chilli Chicken Noodles', 'Noodles',   '310', 'false', 'Spicy noodles tossed with chilli chicken',          ''),
  ('Vegetable Fried Rice',   'Rice',      '220', 'true',  'Wok-tossed rice with fresh vegetables',             'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80'),
  ('Egg Fried Rice',         'Rice',      '260', 'false', 'Classic fried rice with scrambled eggs',            ''),
  ('Chilli Paneer',          'Mains',     '290', 'true',  'Indo-Chinese crispy paneer in spicy sauce',         ''),
  ('Iced Green Tea',         'Beverages', '90',  'true',  'Chilled Japanese green tea with lemon',             '')
) AS v(name, category, price, is_veg, description, photo_url)
WHERE r.name = 'Wok & Roll'
ON CONFLICT (restaurant_id, name) DO NOTHING;

-- South Spice
INSERT INTO menu_items (restaurant_id, name, category, price, is_veg, description, photo_url, is_available)
SELECT r.id, v.name, v.category, v.price::numeric, v.is_veg::boolean, v.description, NULLIF(v.photo_url,''), true
FROM restaurants r CROSS JOIN (VALUES
  ('Masala Dosa',        'Dosas',     '160', 'true', 'Crispy dosa with spiced potato filling',   'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80'),
  ('Onion Rava Dosa',    'Dosas',     '180', 'true', 'Crispy semolina dosa with onions',         ''),
  ('Ghee Roast Dosa',    'Dosas',     '200', 'true', 'Roasted crispy dosa with generous ghee',   ''),
  ('Curd Rice',          'Rice',      '120', 'true', 'Tempered curd rice with curry leaves',     ''),
  ('Lemon Rice',         'Rice',      '130', 'true', 'Tangy rice with peanuts and turmeric',     ''),
  ('Idli Sambar (3 pcs)','Tiffin',    '100', 'true', 'Soft idlis with sambar and chutneys',      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80'),
  ('Medu Vada (2 pcs)',  'Tiffin',    '90',  'true', 'Crispy lentil donuts with sambar',         ''),
  ('Filter Coffee',      'Beverages', '60',  'true', 'Authentic South Indian filter coffee',     'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80'),
  ('Buttermilk (Chaas)', 'Beverages', '50',  'true', 'Chilled spiced buttermilk',                '')
) AS v(name, category, price, is_veg, description, photo_url)
WHERE r.name = 'South Spice'
ON CONFLICT (restaurant_id, name) DO NOTHING;

-- Burger Barn
INSERT INTO menu_items (restaurant_id, name, category, price, is_veg, description, photo_url, is_available)
SELECT r.id, v.name, v.category, v.price::numeric, v.is_veg::boolean, v.description, NULLIF(v.photo_url,''), true
FROM restaurants r CROSS JOIN (VALUES
  ('Classic Cheeseburger',  'Burgers',   '250', 'false', 'Beef patty, cheddar, lettuce, tomato, pickles',   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80'),
  ('Mushroom Swiss Burger', 'Burgers',   '280', 'true',  'Grilled mushrooms with melted Swiss cheese',      ''),
  ('Spicy Chicken Burger',  'Burgers',   '270', 'false', 'Crispy spiced chicken fillet jalapenos',          'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&q=80'),
  ('Loaded Fries',          'Sides',     '180', 'true',  'Fries with cheese sauce jalapenos sour cream',    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80'),
  ('Onion Rings',           'Sides',     '150', 'true',  'Crispy battered onion rings',                     ''),
  ('Chocolate Milkshake',   'Beverages', '180', 'true',  'Thick and creamy chocolate shake',                ''),
  ('Coca-Cola',             'Beverages', '80',  'true',  '330ml can',                                       '')
) AS v(name, category, price, is_veg, description, photo_url)
WHERE r.name = 'Burger Barn'
ON CONFLICT (restaurant_id, name) DO NOTHING;

-- Sweet Cravings
INSERT INTO menu_items (restaurant_id, name, category, price, is_veg, description, photo_url, is_available)
SELECT r.id, v.name, v.category, v.price::numeric, v.is_veg::boolean, v.description, NULLIF(v.photo_url,''), true
FROM restaurants r CROSS JOIN (VALUES
  ('Belgian Chocolate Sundae', 'Ice Cream', '220', 'true', 'Rich dark chocolate ice cream with hot fudge',      'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80'),
  ('Mango Sorbet',             'Ice Cream', '160', 'true', 'Refreshing Alphonso mango sorbet',                  ''),
  ('Red Velvet Slice',         'Cakes',     '180', 'true', 'Classic red velvet with cream cheese frosting',     'https://images.unsplash.com/photo-1586788224331-947f68671cf1?w=400&q=80'),
  ('New York Cheesecake',      'Cakes',     '200', 'true', 'Creamy New York style cheesecake',                  ''),
  ('Nutella Waffle',           'Waffles',   '240', 'true', 'Crispy waffle with Nutella and fresh berries',      'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&q=80'),
  ('Strawberry Cream Waffle',  'Waffles',   '220', 'true', 'Waffle with whipped cream and fresh strawberries',  ''),
  ('Hot Chocolate',            'Beverages', '140', 'true', 'Rich velvety hot chocolate with marshmallows',      'https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=400&q=80')
) AS v(name, category, price, is_veg, description, photo_url)
WHERE r.name = 'Sweet Cravings'
ON CONFLICT (restaurant_id, name) DO NOTHING;

-- ── Verify ───────────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM restaurants) AS total_restaurants,
  (SELECT COUNT(*) FROM menu_items)  AS total_menu_items;
