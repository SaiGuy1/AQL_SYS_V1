-- Quick fix for user roles
-- This is a simplified version for immediate use
-- Run this in the Supabase SQL Editor

-- Step 1: Create check_column_exists function if it doesn't exist
CREATE OR REPLACE FUNCTION public.check_column_exists(
  table_name text,
  column_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.check_column_exists(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_column_exists(text, text) TO authenticated;

-- Step 2: Create or replace the user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has a profile
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    -- Profile exists, make sure role is set
    UPDATE public.profiles
    SET role = COALESCE(
      (SELECT role FROM public.profiles WHERE id = NEW.id),
      COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    )
    WHERE id = NEW.id AND (role IS NULL OR role = '');
  ELSE
    -- Insert new profile with role - only use essential fields
    INSERT INTO public.profiles (
      id, 
      email, 
      name, 
      role
    )
    VALUES (
      NEW.id, 
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the user trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Fix your specific user - Replace 'your.email@example.com' with your actual email
UPDATE public.profiles
SET role = 'manager'
WHERE email = 'your.email@example.com';

-- Step 5: Ensure all existing users have a role
UPDATE public.profiles
SET role = 'customer'
WHERE role IS NULL OR role = '';

-- Show users with roles
SELECT id, email, role FROM public.profiles ORDER BY email; 