CREATE TABLE IF NOT EXISTS restaurant_owners (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES restaurant_owners(id) ON DELETE CASCADE;

ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_restaurant_id_fkey;

ALTER TABLE orders
ADD CONSTRAINT orders_restaurant_id_fkey
FOREIGN KEY (restaurant_id)
REFERENCES restaurants(id)
ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');

  IF user_role = 'restaurant_owner' THEN
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
