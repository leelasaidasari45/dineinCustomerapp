-- ============================================================
-- Auto-save new users to the customers table
-- Paste in Supabase SQL Editor → Run
-- ============================================================

-- Step 1: Create the trigger function
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
      split_part(NEW.email, '@', 1)   -- fallback: use email prefix as name
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

-- Step 2: Drop old trigger if it exists (safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Attach the trigger to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Verify — show existing customers
SELECT id, name, email, phone, created_at FROM customers ORDER BY created_at DESC;
