-- Fix User Roles with Enum Type Support
-- Run this in the Supabase SQL Editor to fix your role issue

-- Step 1: Helper function to check if a column is an enum type
CREATE OR REPLACE FUNCTION public.is_column_enum(p_table text, p_column text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_enum boolean;
  type_name text;
BEGIN
  SELECT data_type INTO type_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = p_table
    AND column_name = p_column;
    
  IF type_name = 'USER-DEFINED' THEN
    SELECT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      JOIN information_schema.columns c ON t.typname = c.udt_name
        AND c.table_schema = n.nspname
      WHERE c.table_schema = 'public'
        AND c.table_name = p_table
        AND c.column_name = p_column
    ) INTO is_enum;
  ELSE
    is_enum := false;
  END IF;
  
  RETURN is_enum;
END;
$$;

-- Check if the role column is an enum type
DO $$
DECLARE
  is_enum boolean;
  enum_values TEXT;
BEGIN
  -- Check if the role column is an enum
  SELECT public.is_column_enum('profiles', 'role') INTO is_enum;
  
  IF is_enum THEN
    -- Get enum values
    SELECT string_agg(enumlabel, ', ') INTO enum_values
    FROM pg_enum
    WHERE enumtypid = 'user_role'::regtype;
    
    RAISE NOTICE 'ROLE COLUMN IS ENUM TYPE! Available values: %', enum_values;
  ELSE
    RAISE NOTICE 'Role column is not an enum type';
  END IF;
END
$$;

-- Step 2: Create handle_new_user function that works with enum types
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  is_enum boolean;
  role_value text;
BEGIN
  -- Get role value with fallback
  role_value := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
  
  -- Check if role is enum type
  SELECT public.is_column_enum('profiles', 'role') INTO is_enum;
  
  -- Check if user already has a profile
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    -- Profile exists, make sure role is set
    IF is_enum THEN
      -- Use dynamic SQL for enum casting
      EXECUTE format('
        UPDATE public.profiles
        SET role = %L::user_role
        WHERE id = %L AND (role IS NULL)
      ', role_value, NEW.id);
    ELSE
      -- Standard update for text role
      UPDATE public.profiles
      SET role = role_value
      WHERE id = NEW.id AND (role IS NULL);
    END IF;
  ELSE
    -- Insert new profile
    IF is_enum THEN
      -- Use dynamic SQL for enum casting
      EXECUTE format('
        INSERT INTO public.profiles (id, email, name, role)
        VALUES (%L, %L, %L, %L::user_role)
      ', NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), role_value);
    ELSE
      -- Standard insert for text role
      INSERT INTO public.profiles (id, email, name, role)
      VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        role_value
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Fix your specific account - REPLACE 'your.email@example.com' with your email
DO $$
DECLARE
  is_enum boolean;
  user_id uuid;
BEGIN
  -- Check if enum type
  SELECT public.is_column_enum('profiles', 'role') INTO is_enum;
  
  -- Get your user ID - REPLACE 'your.email@example.com' with your email
  SELECT id INTO user_id FROM auth.users WHERE email = 'your.email@example.com';
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Update with correct casting
  IF is_enum THEN
    EXECUTE format('
      UPDATE public.profiles
      SET role = %L::user_role
      WHERE id = %L
    ', 'manager', user_id);
  ELSE
    UPDATE public.profiles
    SET role = 'manager'
    WHERE id = user_id;
  END IF;
  
  RAISE NOTICE 'Updated your role to manager!';
END
$$;

-- Step 5: Fix anyone missing a role
DO $$
DECLARE
  is_enum boolean;
BEGIN
  SELECT public.is_column_enum('profiles', 'role') INTO is_enum;
  
  IF is_enum THEN
    EXECUTE '
      UPDATE public.profiles
      SET role = ''customer''::user_role
      WHERE role IS NULL
    ';
  ELSE
    UPDATE public.profiles
    SET role = 'customer'
    WHERE role IS NULL;
  END IF;
END
$$;

-- Show your updated profile
SELECT p.id, p.email, p.role 
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'your.email@example.com'; 