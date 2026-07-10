CREATE TABLE IF NOT EXISTS dining_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, table_number)
);

CREATE TABLE IF NOT EXISTS order_dining_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES dining_tables(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, table_id)
);

ALTER TABLE dining_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_dining_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read dining tables" ON dining_tables;
CREATE POLICY "Public read dining tables" ON dining_tables FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners manage own dining tables" ON dining_tables;
CREATE POLICY "Owners manage own dining tables" ON dining_tables FOR ALL USING (
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE id = dining_tables.restaurant_id AND owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Select order tables" ON order_dining_tables;
CREATE POLICY "Select order tables" ON order_dining_tables FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert order tables" ON order_dining_tables;
CREATE POLICY "Insert order tables" ON order_dining_tables FOR INSERT WITH CHECK (true);

INSERT INTO dining_tables (restaurant_id, table_number, capacity, is_available)
SELECT 
  r.id,
  t.table_number,
  t.capacity,
  true
FROM restaurants r
CROSS JOIN (
  VALUES 
    ('Table 1 (2 Seater)', 2),
    ('Table 2 (2 Seater)', 2),
    ('Table 3 (4 Seater)', 4),
    ('Table 4 (4 Seater)', 4),
    ('Table 5 (6 Seater)', 6),
    ('Table 6 (8 Seater)', 8)
) AS t(table_number, capacity)
ON CONFLICT DO NOTHING;
