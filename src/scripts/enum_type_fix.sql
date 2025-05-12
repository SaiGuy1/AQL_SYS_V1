-- Enum Type Fix for User Roles
-- This script fixes issues with the profiles table and role management
-- Run this in the Supabase SQL Editor

-- First, let's verify the user_role type and values
DO $$
DECLARE
  enum_values TEXT;
BEGIN
  SELECT string_agg(enumlabel, ', ') INTO enum_values
  FROM pg_enum
  WHERE enumtypid = 'user_role'::regtype;
  
  RAISE NOTICE 'Current user_role enum values: %', enum_values;
END
$$;

-- Create check_column_exists function if it doesn't exist
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

-- Create the user trigger function that correctly casts values to user_role
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has a profile
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    -- Profile exists, make sure role is set
    UPDATE public.profiles
    SET role = COALESCE(
      (SELECT role FROM public.profiles WHERE id = NEW.id),
      COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::user_role
    )
    WHERE id = NEW.id AND (role IS NULL);
  ELSE
    -- Insert new profile with role - casting to user_role enum
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
      COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::user_role
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create update trigger for user changes
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix existing users without profiles - properly casting the role
DO $$
BEGIN
  -- Insert users that don't have profiles yet
  EXECUTE '
    INSERT INTO public.profiles (id, email, name, role)
    SELECT 
      id, 
      email, 
      COALESCE(raw_user_meta_data->>''full_name'', email) as name,
      COALESCE(raw_user_meta_data->>''role'', ''customer'')::user_role as role
    FROM auth.users
    WHERE id NOT IN (SELECT id FROM public.profiles)
    ON CONFLICT (id) DO NOTHING';
  
  -- Fix any missing roles
  EXECUTE '
    UPDATE public.profiles
    SET role = ''customer''::user_role
    WHERE role IS NULL';
END;
$$;

-- Fix your specific user - Replace 'your.email@example.com' with your actual email
UPDATE public.profiles
SET role = 'manager'::user_role
WHERE email = 'your.email@example.com';

-- Show users with roles
SELECT id, email, role FROM public.profiles ORDER BY email; 