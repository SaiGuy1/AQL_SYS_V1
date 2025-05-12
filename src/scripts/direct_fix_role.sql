-- Direct Fix for User Role
-- This is a simplified script that directly fixes your user role
-- Run this in the Supabase SQL Editor

-- Start a transaction so we can roll back if there's an issue
BEGIN;

-- First, display the current state for debugging
DO $$
DECLARE
  user_role_value TEXT;
  user_id uuid;
BEGIN
  -- Get your user ID (replace with your actual email)
  SELECT id INTO user_id FROM auth.users WHERE email = 'saiguy@zohomail.com';
  
  IF user_id IS NULL THEN
    RAISE NOTICE 'User not found with email saiguy@zohomail.com';
    RETURN;
  END IF;
  
  -- Get current role value
  EXECUTE 'SELECT role::text FROM profiles WHERE id = $1' INTO user_role_value USING user_id;
  
  RAISE NOTICE 'Current user role for saiguy@zohomail.com: %', user_role_value;
  RAISE NOTICE 'User ID: %', user_id;
END $$;

-- Get the enum values directly
DO $$
DECLARE
  enum_values TEXT;
BEGIN
  SELECT string_agg(enumlabel, ', ') INTO enum_values
  FROM pg_enum 
  WHERE enumtypid = (
    SELECT udt_name::regtype 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  );
  
  RAISE NOTICE 'Available enum values: %', enum_values;
END $$;

-- Now directly set the role with explicit casting to handle enum type
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Get your user ID (replace with your actual email)
  SELECT id INTO user_id FROM auth.users WHERE email = 'saiguy@zohomail.com';
  
  IF user_id IS NULL THEN
    RAISE NOTICE 'User not found with email saiguy@zohomail.com';
    RETURN;
  END IF;
  
  -- Direct update with explicit cast
  EXECUTE format('
    UPDATE profiles
    SET role = %L::user_role
    WHERE id = %L
  ', 'manager', user_id);
  
  RAISE NOTICE 'Role updated to manager for user ID: %', user_id;
END $$;

-- Verify the fix worked
DO $$
DECLARE
  updated_role TEXT;
  user_id uuid;
BEGIN
  -- Get your user ID (replace with your actual email)
  SELECT id INTO user_id FROM auth.users WHERE email = 'saiguy@zohomail.com';
  
  -- Get updated role value
  EXECUTE 'SELECT role::text FROM profiles WHERE id = $1' INTO updated_role USING user_id;
  
  RAISE NOTICE 'Updated role for saiguy@zohomail.com: %', updated_role;
END $$;

-- Commit the transaction
COMMIT; 