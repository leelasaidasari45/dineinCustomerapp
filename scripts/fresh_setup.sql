-- ============================================================
-- DineIn — COMPLETE DATABASE SETUP + SEED
-- ⚠️ This drops all existing tables and rebuilds them fresh
-- Paste everything into Supabase SQL Editor → Run
-- ============================================================


-- ── STEP 1: Drop everything ───────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS order_status_log CASCADE;
DROP TABLE IF EXISTS order_items      CASCADE;
DROP TABLE IF EXISTS orders           CASCADE;
DROP TABLE IF EXISTS menu_items       CASCADE;
DROP TABLE IF EXISTS customers        CASCADE;
DROP TABLE IF EXISTS restaurants      CASCADE;

DROP TYPE IF EXISTS order_status   CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;


-- ── STEP 2: Create enums ──────────────────────────────────────

CREATE TYPE order_status AS ENUM (
  'pending_payment',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'advance_paid',
  'fully_paid',
  'refunded'
);


-- ── STEP 3: Create tables ─────────────────────────────────────

CREATE TABLE restaurants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL UNIQUE,
  cuisine_tags          TEXT[] DEFAULT '{}',
  address               TEXT,
  photo_url             TEXT,
  avg_prep_time_minutes INTEGER DEFAULT 20,
  rating                DECIMAL(2,1) DEFAULT 4.0,
  is_open               BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE menu_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  price         DECIMAL(10,2) NOT NULL,
  description   TEXT,
  photo_url     TEXT,
  is_veg        BOOLEAN DEFAULT true,
  is_available  BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, name)
);

CREATE TABLE customers (
  id         UUID PRIMARY KEY, -- Maps to auth.users.id
  name       TEXT,
  phone      TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  restaurant_id       UUID NOT NULL REFERENCES restaurants(id),
  status              order_status DEFAULT 'pending_payment',
  arrival_time        TIMESTAMPTZ,
  estimated_ready_time TIMESTAMPTZ,
  total_amount        DECIMAL(10,2) NOT NULL DEFAULT 0,
  advance_paid_amount DECIMAL(10,2) DEFAULT 0,
  remaining_amount    DECIMAL(10,2) DEFAULT 0,
  payment_status      payment_status DEFAULT 'pending',
  payment_reference   TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id   UUID NOT NULL REFERENCES menu_items(id),
  quantity        INTEGER NOT NULL DEFAULT 1,
  notes          TEXT,
  price_at_order DECIMAL(10,2) NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_status_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     order_status NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);


-- ── STEP 4: Auth Trigger for Customers ─────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customers (id, name, email, phone, created_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET
      name  = EXCLUDED.name,
      email = EXCLUDED.email,
      phone = COALESCE(EXCLUDED.phone, customers.phone);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ── STEP 5: Row Level Security ────────────────────────────────

ALTER TABLE restaurants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_log ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active restaurants/items
CREATE POLICY "Public read restaurants" ON restaurants FOR SELECT USING (is_open = true);
CREATE POLICY "Public read menu items" ON menu_items FOR SELECT USING (is_available = true);

-- Customer access
CREATE POLICY "Own profile read"   ON customers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON customers FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON customers FOR UPDATE USING (auth.uid() = id);

-- Order access
CREATE POLICY "Own orders read"   ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Own orders insert" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Order items access
CREATE POLICY "Own order items read" ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()));
CREATE POLICY "Own order items insert" ON order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()));

-- Order status log
CREATE POLICY "Own status log read" ON order_status_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_log.order_id AND orders.customer_id = auth.uid()));
CREATE POLICY "Own status log insert" ON order_status_log FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_log.order_id AND orders.customer_id = auth.uid()));


-- ── STEP 6: Indexes ───────────────────────────────────────────

CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_orders_customer       ON orders(customer_id);
CREATE INDEX idx_orders_restaurant     ON orders(restaurant_id);
CREATE INDEX idx_order_items_order     ON order_items(order_id);
CREATE INDEX idx_status_log_order      ON order_status_log(order_id);


-- ── STEP 7: Realtime ──────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE orders;


-- ── STEP 8: Seed Restaurants ──────────────────────────────────

INSERT INTO restaurants (name, cuisine_tags, address, photo_url, avg_prep_time_minutes, rating, is_open) VALUES
('Spice Garden',       ARRAY['North Indian','Biryani','Curries'],    '12 MG Road, Bangalore',    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', 25, 4.5, true),
('The Pizza Republic', ARRAY['Pizza','Italian','Burgers'],           '45 Indiranagar, Bangalore', 'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=800&q=80', 20, 4.3, true),
('Wok & Roll',         ARRAY['Chinese','Noodles','Asian'],           '7 Koramangala, Bangalore',  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80', 18, 4.1, true),
('South Spice',        ARRAY['South Indian','Dosa','Filter Coffee'], '3 Jayanagar, Bangalore',    'https://images.unsplash.com/photo-1630383249896-483b843e5b89?w=800&q=80', 15, 4.6, true),
('Burger Barn',        ARRAY['Burgers','American','Fries'],          '22 Whitefield, Bangalore',  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', 12, 4.0, true),
('Sweet Cravings',     ARRAY['Desserts','Ice Cream','Cakes'],        '8 HSR Layout, Bangalore',   'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80', 10, 4.7, true);


-- ── STEP 9: Seed Menu Items ───────────────────────────────────

-- Spice Garden
INSERT INTO menu_items (restaurant_id, name, category, price, is_veg, description, photo_url, is_available)
SELECT r.id, v.name, v.category, v.price::numeric, v.is_veg::boolean, v.description, NULLIF(v.photo_url,''), true
FROM restaurants r CROSS JOIN (VALUES
  ('Paneer Tikka',        'Starters',    '280', 'true',  'Marinated cottage cheese grilled to perfection',  'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80'),
  ('Chicken Seekh Kebab', 'Starters',    '340', 'false', 'Minced chicken with aromatic spices',             'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80'),
  ('Samosa (2 pcs)',      'Starters',    '80',  'true',  'Crispy pastry with spiced potato filling',        ''),
  ('Butter Chicken',      'Main Course', '380', 'false', 'Slow-cooked chicken in rich tomato-cream gravy',  'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80'),
  ('Dal Makhani',         'Main Course', '280', 'true',  'Black lentils slow-cooked overnight with butter', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80'),
  ('Chicken Biryani',     'Main Course', '420', 'false', 'Fragrant basmati with juicy chicken pieces',      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80'),
  ('Paneer Butter Masala','Main Course', '320', 'true',  'Rich and creamy paneer in tomato gravy',          ''),
  ('Garlic Naan',         'Breads',      '60',  'true',  'Soft naan with garlic butter',                    ''),
  ('Tandoori Roti',       'Breads',      '40',  'true',  'Whole wheat bread baked in tandoor',              ''),
  ('Gulab Jamun',         'Desserts',    '120', 'true',  'Soft milk dumplings in rose syrup',               'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400&q=80'),
  ('Mango Lassi',         'Beverages',   '120', 'true',  'Chilled yogurt smoothie with Alphonso mango',     '')
) AS v(name, category, price, is_veg, description, photo_url)
WHERE r.name = 'Spice Garden';

-- The Pizza Republic
INSERT INTO menu_items (restaurant_id, name, category, price, is_veg, description, photo_url, is_available)
SELECT r.id, v.name, v.category, v.price::numeric, v.is_veg::boolean, v.description, NULLIF(v.photo_url,''), true
FROM restaurants r CROSS JOIN (VALUES
  ('Garlic Bread',        'Starters',  '150', 'true',  'Toasted baguette with herb garlic butter',        ''),
  ('Chicken Wings',       'Starters',  '320', 'false', 'Crispy wings with choice of sauce',               'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=80'),
  ('Margherita',          'Pizzas',    '350', 'true',  'Classic tomato mozzarella fresh basil',           'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80'),
  ('BBQ Chicken Pizza',   'Pizzas',    '450', 'false', 'Smoky BBQ sauce chicken onions peppers',          'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80'),
  ('Veggie Supreme',      'Pizzas',    '400', 'true',  'Loaded with seasonal vegetables',                 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&q=80'),
  ('Classic Smash Burger','Burgers',   '280', 'false', 'Double smashed beef patty cheese special sauce',  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80'),
  ('Crispy Veg Burger',   'Burgers',   '220', 'true',  'Crispy veggie patty lettuce tomato',              ''),
  ('Tiramisu',            'Desserts',  '220', 'true',  'Classic Italian dessert with espresso',           'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80'),
  ('Fresh Lime Soda',     'Beverages', '80',  'true',  'Sweet salt or masala your choice',                '')
) AS v(name, category, price, is_veg, description, photo_url)
WHERE r.name = 'The Pizza Republic';

-- Wok & Roll
INSERT INTO menu_items (restaurant_id, name, category, price, is_veg, description, photo_url, is_available)
SELECT r.id, v.name, v.category, v.price::numeric, v.is_veg::boolean, v.description, NULLIF(v.photo_url,''), true
FROM restaurants r CROSS JOIN (VALUES
  ('Spring Rolls (4 pcs)',   'Starters',  '220', 'true',  'Crispy rolls with vegetable filling',             ''),
  ('Chicken Dumplings',      'Starters',  '280', 'false', 'Steamed or fried with soy dipping sauce',         'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80'),
  ('Hakka Noodles',          'Noodles',   '240', 'true',  'Stir-fried noodles with veggies and soy sauce',   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80'),
  ('Chilli Chicken Noodles', 'Noodles',   '310', 'false', 'Spicy noodles tossed with chilli chicken',        ''),
  ('Vegetable Fried Rice',   'Rice',      '220', 'true',  'Wok-tossed rice with fresh vegetables',           'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80'),
  ('Egg Fried Rice',         'Rice',      '260', 'false', 'Classic fried rice with scrambled eggs',          ''),
  ('Chilli Paneer',          'Mains',     '290', 'true',  'Indo-Chinese crispy paneer in spicy sauce',       ''),
  ('Iced Green Tea',         'Beverages', '90',  'true',  'Chilled Japanese green tea with lemon',           '')
) AS v(name, category, price, is_veg, description, photo_url)
WHERE r.name = 'Wok & Roll';

-- South Spice
INSERT INTO menu_items (restaurant_id, name, category, price, is_veg, description, photo_url, is_available)
SELECT r.id, v.name, v.category, v.price::numeric, v.is_veg::boolean, v.description, NULLIF(v.photo_url,''), true
FROM restaurants r CROSS JOIN (VALUES
  ('Masala Dosa',        'Dosas',     '160', 'true', 'Crispy dosa with spiced potato filling',  'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80'),
  ('Onion Rava Dosa',    'Dosas',     '180', 'true', 'Crispy semolina dosa with onions',        ''),
  ('Ghee Roast Dosa',    'Dosas',     '200', 'true', 'Roasted crispy dosa with generous ghee',  ''),
  ('Curd Rice',          'Rice',      '120', 'true', 'Tempered curd rice with culinary leaves',  ''),
  ('Lemon Rice',         'Rice',      '130', 'true', 'Tangy rice with peanuts and turmeric',    ''),
  ('Idli Sambar (3 pcs)','Tiffin',    '100', 'true', 'Soft idlis with sambar and chutneys',     'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80'),
  ('Medu Vada (2 pcs)',  'Tiffin',    '90',  'true', 'Crispy lentil donuts with sambar',        ''),
  ('Filter Coffee',      'Beverages', '60',  'true', 'Authentic South Indian filter coffee',    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80'),
  ('Buttermilk (Chaas)', 'Beverages', '50',  'true', 'Chilled spiced buttermilk',               '')
) AS v(name, category, price, is_veg, description, photo_url)
WHERE r.name = 'South Spice';

-- Burger Barn
INSERT INTO menu_items (restaurant_id, name, category, price, is_veg, description, photo_url, is_available)
SELECT r.id, v.name, v.category, v.price::numeric, v.is_veg::boolean, v.description, NULLIF(v.photo_url,''), true
FROM restaurants r CROSS JOIN (VALUES
  ('Classic Cheeseburger',  'Burgers',   '250', 'false', 'Beef patty cheddar lettuce tomato pickles',       'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80'),
  ('Mushroom Swiss Burger', 'Burgers',   '280', 'true',  'Grilled mushrooms with melted Swiss cheese',      ''),
  ('Spicy Chicken Burger',  'Burgers',   '270', 'false', 'Crispy spiced chicken fillet jalapenos',          'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&q=80'),
  ('Loaded Fries',          'Sides',     '180', 'true',  'Fries with cheese sauce jalapenos sour cream',    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80'),
  ('Onion Rings',           'Sides',     '150', 'true',  'Crispy battered onion rings',                     ''),
  ('Chocolate Milkshake',   'Beverages', '180', 'true',  'Thick and creamy chocolate shake',                ''),
  ('Coca-Cola',             'Beverages', '80',  'true',  '330ml can',                                       '')
) AS v(name, category, price, is_veg, description, photo_url)
WHERE r.name = 'Burger Barn';

-- Sweet Cravings
INSERT INTO menu_items (restaurant_id, name, category, price, is_veg, description, photo_url, is_available)
SELECT r.id, v.name, v.category, v.price::numeric, v.is_veg::boolean, v.description, NULLIF(v.photo_url,''), true
FROM restaurants r CROSS JOIN (VALUES
  ('Belgian Chocolate Sundae', 'Ice Cream', '220', 'true', 'Rich dark chocolate ice cream with hot fudge',     'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80'),
  ('Mango Sorbet',             'Ice Cream', '160', 'true', 'Refreshing Alphonso mango sorbet',                 ''),
  ('Red Velvet Slice',         'Cakes',     '180', 'true', 'Classic red velvet with cream cheese frosting',    'https://images.unsplash.com/photo-1586788224331-947f68671cf1?w=400&q=80'),
  ('New York Cheesecake',      'Cakes',     '200', 'true', 'Creamy New York style cheesecake',                 ''),
  ('Nutella Waffle',           'Waffles',   '240', 'true', 'Crispy waffle with Nutella and fresh berries',     'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&q=80'),
  ('Strawberry Cream Waffle',  'Waffles',   '220', 'true', 'Waffle with whipped cream and fresh strawberries', ''),
  ('Hot Chocolate',            'Beverages', '140', 'true', 'Rich velvety hot chocolate with marshmallows',     'https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=400&q=80')
) AS v(name, category, price, is_veg, description, photo_url)
WHERE r.name = 'Sweet Cravings';


-- ── STEP 10: Verify ───────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM restaurants) AS restaurants_count,
  (SELECT COUNT(*) FROM menu_items)  AS menu_items_count,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created') AS trigger_active;
