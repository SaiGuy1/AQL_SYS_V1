-- Ensure user profile trigger is properly set up
-- This script fixes the automatic profile creation for new users
-- Run this in the Supabase SQL Editor

-- Step 1: Check if user_role type exists and create it if needed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'supervisor', 'inspector', 'hr', 'accounting', 'customer');
  END IF;
END
$$;

-- Step 2: Check if profiles table has timestamp columns
DO $$
DECLARE
  has_created_at BOOLEAN;
  has_updated_at BOOLEAN;
BEGIN
  -- Check if columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'created_at'
  ) INTO has_created_at;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) INTO has_updated_at;
  
  -- Add missing columns if needed
  IF NOT has_created_at THEN
    EXECUTE 'ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT now()';
    RAISE NOTICE 'Added created_at column to profiles table';
  END IF;
  
  IF NOT has_updated_at THEN
    EXECUTE 'ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now()';
    RAISE NOTICE 'Added updated_at column to profiles table';
  END IF;
END
$$;

-- Step 3: Drop existing trigger function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 4: Create an improved trigger function that ensures role is set
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  has_created_at BOOLEAN;
  has_updated_at BOOLEAN;
  insert_columns TEXT;
  insert_values TEXT;
BEGIN
  -- Check if timestamp columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'created_at'
  ) INTO has_created_at;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) INTO has_updated_at;

  -- Check if user already has a profile
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    -- Profile exists, make sure role is set
    IF has_updated_at THEN
      UPDATE public.profiles
      SET 
        role = COALESCE(
          (SELECT role FROM public.profiles WHERE id = NEW.id),
          COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
        ),
        updated_at = now()
      WHERE id = NEW.id AND (role IS NULL OR role = '');
    ELSE
      UPDATE public.profiles
      SET 
        role = COALESCE(
          (SELECT role FROM public.profiles WHERE id = NEW.id),
          COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
        )
      WHERE id = NEW.id AND (role IS NULL OR role = '');
    END IF;
  ELSE
    -- Build dynamic insert statement based on available columns
    insert_columns := 'id, email, name, role';
    insert_values := 'NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>''full_name'', NEW.email), COALESCE(NEW.raw_user_meta_data->>''role'', ''customer'')';
    
    IF has_created_at THEN
      insert_columns := insert_columns || ', created_at';
      insert_values := insert_values || ', now()';
    END IF;
    
    IF has_updated_at THEN
      insert_columns := insert_columns || ', updated_at';
      insert_values := insert_values || ', now()';
    END IF;
    
    -- Insert new profile with role using dynamic SQL
    EXECUTE format('
      INSERT INTO public.profiles (%s)
      VALUES (%s)
    ', insert_columns, insert_values);
  END IF;
  
  -- Log profile creation/update
  RAISE NOTICE 'Profile created/updated for user % with role %', 
    NEW.email, 
    (SELECT role FROM public.profiles WHERE id = NEW.id);
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create the trigger if it doesn't exist or recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Also run when users are updated (for role changes)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Fix any existing users without profiles or roles
DO $$
DECLARE
  has_created_at BOOLEAN;
  has_updated_at BOOLEAN;
  insert_stmt TEXT;
BEGIN
  -- Check if timestamp columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'created_at'
  ) INTO has_created_at;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) INTO has_updated_at;
  
  -- Build dynamic insert statement
  insert_stmt := '
    INSERT INTO public.profiles (id, email, name, role';
  
  IF has_created_at THEN
    insert_stmt := insert_stmt || ', created_at';
  END IF;
  
  IF has_updated_at THEN
    insert_stmt := insert_stmt || ', updated_at';
  END IF;
  
  insert_stmt := insert_stmt || ')
    SELECT 
      id, 
      email, 
      COALESCE(raw_user_meta_data->>''full_name'', email) as name,
      COALESCE(raw_user_meta_data->>''role'', ''customer'') as role';
  
  IF has_created_at THEN
    insert_stmt := insert_stmt || ', now()';
  END IF;
  
  IF has_updated_at THEN
    insert_stmt := insert_stmt || ', now()';
  END IF;
  
  insert_stmt := insert_stmt || '
    FROM auth.users
    WHERE id NOT IN (SELECT id FROM public.profiles)
    ON CONFLICT (id) DO NOTHING';
  
  -- Execute the dynamic statement
  EXECUTE insert_stmt;
END
$$;

-- Step 8: Ensure all existing users have a role set
UPDATE public.profiles
SET role = 'customer'
WHERE role IS NULL OR role = '';

-- Step 9: Verify the trigger exists
SELECT pg_get_triggerdef(oid) 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Step 10: Display count of fixed profiles
SELECT count(*) as profiles_with_role FROM public.profiles WHERE role IS NOT NULL AND role != ''; 