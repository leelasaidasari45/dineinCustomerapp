-- Add 'serves' column to menu_items table
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS serves INTEGER DEFAULT NULL;

-- Update existing items with serves values (examples)
-- Adjust these to match your actual restaurant/menu item IDs

-- Shared/larger dishes typically serve 2+
UPDATE menu_items SET serves = 2 WHERE name ILIKE '%biryani%';
UPDATE menu_items SET serves = 2 WHERE name ILIKE '%dal%';
UPDATE menu_items SET serves = 2 WHERE name ILIKE '%paneer tikka%';
UPDATE menu_items SET serves = 2 WHERE name ILIKE '%butter chicken%';
UPDATE menu_items SET serves = 2 WHERE name ILIKE '%fried rice%';
UPDATE menu_items SET serves = 4 WHERE name ILIKE '%family%';
UPDATE menu_items SET serves = 2 WHERE name ILIKE '%platter%';

-- Single-serve items
UPDATE menu_items SET serves = 1 WHERE name ILIKE '%burger%';
UPDATE menu_items SET serves = 1 WHERE name ILIKE '%pizza%' AND name NOT ILIKE '%large%';
UPDATE menu_items SET serves = 1 WHERE name ILIKE '%dosa%';
UPDATE menu_items SET serves = 1 WHERE name ILIKE '%idli%';
UPDATE menu_items SET serves = 1 WHERE name ILIKE '%waffle%';
UPDATE menu_items SET serves = 1 WHERE name ILIKE '%coffee%';
UPDATE menu_items SET serves = 1 WHERE name ILIKE '%lassi%';
UPDATE menu_items SET serves = 1 WHERE name ILIKE '%milkshake%';
UPDATE menu_items SET serves = 1 WHERE name ILIKE '%juice%';
