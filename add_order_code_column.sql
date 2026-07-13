-- 1. Add order_code column if not exists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_code VARCHAR(20) UNIQUE;

-- 2. Populate any existing orders that have null order_code with a generated unique ID
UPDATE orders 
SET order_code = 'DINE' || lpad(floor(random() * 10000)::text, 4, '0') 
WHERE order_code IS NULL;
