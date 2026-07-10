-- SQL Migration: Add restaurant_owners table, cascade delete constraints, and update the auth user trigger

-- 1. Create restaurant_owners table
CREATE TABLE IF NOT EXISTS restaurant_owners (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add owner_id to restaurants table referencing restaurant_owners
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES restaurant_owners(id) ON DELETE CASCADE;

-- 3. Update orders foreign key to restaurants to use ON DELETE CASCADE
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_restaurant_id_fkey;

ALTER TABLE orders
ADD CONSTRAINT orders_restaurant_id_fkey
FOREIGN KEY (restaurant_id)
REFERENCES restaurants(id)
ON DELETE CASCADE;

-- 4. Re-create the handle_new_user trigger function to be role-aware
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Read role from user metadata (default to 'customer')
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');

  IF user_role = 'restaurant_owner' THEN
    -- Insert into restaurant_owners
    INSERT INTO public.restaurant_owners (id, name, email, phone, created_at)
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
        phone = COALESCE(EXCLUDED.phone, restaurant_owners.phone);

    -- Automatically seed a default restaurant linked to this owner
    INSERT INTO public.restaurants (name, cuisine_tags, address, photo_url, owner_id, is_open, created_at)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || 's Restaurant',
      ARRAY['North Indian', 'Biryani'],
      'TBD',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      NEW.id,
      true,
      NOW()
    )
    ON CONFLICT DO NOTHING;

  ELSE
    -- Insert into customers
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
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Attach the trigger to auth.users (re-creating it)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
