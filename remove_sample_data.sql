-- 1. Delete order items associated with sample menu items
DELETE FROM order_items 
WHERE menu_item_id IN (
  SELECT id FROM menu_items WHERE restaurant_id IN (
    SELECT id FROM restaurants WHERE name IN ('Spice Garden', 'The Pizza Republic', 'Wok & Roll', 'South Spice', 'Burger Barn', 'Sweet Cravings')
  )
);

-- 2. Delete order status logs associated with sample orders
DELETE FROM order_status_log 
WHERE order_id IN (
  SELECT id FROM orders WHERE restaurant_id IN (
    SELECT id FROM restaurants WHERE name IN ('Spice Garden', 'The Pizza Republic', 'Wok & Roll', 'South Spice', 'Burger Barn', 'Sweet Cravings')
  )
);

-- 3. Delete orders placed at sample restaurants
DELETE FROM orders 
WHERE restaurant_id IN (
  SELECT id FROM restaurants WHERE name IN ('Spice Garden', 'The Pizza Republic', 'Wok & Roll', 'South Spice', 'Burger Barn', 'Sweet Cravings')
);

-- 4. Delete menu items belonging to sample restaurants
DELETE FROM menu_items 
WHERE restaurant_id IN (
  SELECT id FROM restaurants WHERE name IN ('Spice Garden', 'The Pizza Republic', 'Wok & Roll', 'South Spice', 'Burger Barn', 'Sweet Cravings')
);

-- 5. Delete the sample restaurants themselves
DELETE FROM restaurants 
WHERE name IN ('Spice Garden', 'The Pizza Republic', 'Wok & Roll', 'South Spice', 'Burger Barn', 'Sweet Cravings');
