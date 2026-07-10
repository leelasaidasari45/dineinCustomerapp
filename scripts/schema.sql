-- ============================================================
-- DineIn — Shared Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

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

-- ============================================================
-- TABLES
-- ============================================================

-- Restaurant Owners (mirrors auth.users)
CREATE TABLE IF NOT EXISTS restaurant_owners (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurants
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cuisine_tags TEXT[] DEFAULT '{}',
  address TEXT,
  photo_url TEXT,
  avg_prep_time_minutes INTEGER DEFAULT 20,
  rating DECIMAL(2,1) DEFAULT 4.0,
  is_open BOOLEAN DEFAULT true,
  owner_id UUID REFERENCES restaurant_owners(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  photo_url TEXT,
  is_veg BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, name)
);

-- Customers (mirrors auth.users)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  status order_status DEFAULT 'pending_payment',
  arrival_time TIMESTAMPTZ,
  estimated_ready_time TIMESTAMPTZ,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  advance_paid_amount DECIMAL(10,2) DEFAULT 0,
  remaining_amount DECIMAL(10,2) DEFAULT 0,
  payment_status payment_status DEFAULT 'pending',
  payment_reference TEXT,
  num_guests INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  price_at_order DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Status Log
CREATE TABLE IF NOT EXISTS order_status_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant Tables
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, table_number)
);

-- Order Tables (junction table)
CREATE TABLE IF NOT EXISTS order_tables (
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (order_id, table_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tables ENABLE ROW LEVEL SECURITY;

-- Restaurants: anyone can read open restaurants
CREATE POLICY "Public read open restaurants"
  ON restaurants FOR SELECT
  USING (is_open = true);

-- Menu items: anyone can read available items
CREATE POLICY "Public read available menu items"
  ON menu_items FOR SELECT
  USING (is_available = true);

-- Customers: can only read/write their own profile
CREATE POLICY "Customers read own profile"
  ON customers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Customers insert own profile"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Customers update own profile"
  ON customers FOR UPDATE
  USING (auth.uid() = id);

-- Orders: customers can only read/insert their own orders
CREATE POLICY "Customers read own orders"
  ON orders FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers insert own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Order items: customers can read/insert via order ownership
CREATE POLICY "Customers read own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Customers insert own order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Order status log: customers can read their own
CREATE POLICY "Customers read own status log"
  ON order_status_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_log.order_id
      AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Customers insert status log"
  ON order_status_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_log.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- ============================================================
-- REALTIME
-- Enable realtime on the orders table for live tracking
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_status_log_order ON order_status_log(order_id);
