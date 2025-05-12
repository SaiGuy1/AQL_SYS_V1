-- Script to check profiles table structure and constraints
-- Run this in the Supabase SQL Editor to diagnose signup issues

-- Check if profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
) AS profiles_table_exists;

-- Get detailed information about profiles table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY 
  ordinal_position;

-- Check constraints on the profiles table
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM 
  pg_constraint
WHERE 
  conrelid = 'public.profiles'::regclass;

-- Check for triggers on the profiles table
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM 
  information_schema.triggers
WHERE 
  event_object_schema = 'public'
  AND event_object_table = 'profiles';

-- Check if id column in profiles table is correctly set up for auth users
SELECT 
  usename AS role_name,
  has_table_privilege('public.profiles', 'INSERT') AS can_insert,
  has_table_privilege('public.profiles', 'SELECT') AS can_select,
  has_table_privilege('public.profiles', 'UPDATE') AS can_update
FROM 
  pg_user
WHERE 
  usename = 'authenticated' OR usename = 'anon' OR usename = 'service_role';

-- Check if inspector_locations table exists and has correct structure
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'inspector_locations'
) AS inspector_locations_table_exists;

-- Get detailed information about inspector_locations table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'inspector_locations'
ORDER BY 
  ordinal_position;

-- Check if auth schema exists and is accessible
SELECT EXISTS (
  SELECT FROM information_schema.schemata
  WHERE schema_name = 'auth'
) AS auth_schema_exists;

-- Try to verify one auth user exists (this may fail due to permissions)
DO $$
BEGIN
  BEGIN
    PERFORM COUNT(*) FROM auth.users LIMIT 1;
    RAISE NOTICE 'Auth users table is accessible';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot access auth.users due to permissions (this is normal)';
    WHEN undefined_table THEN
      RAISE NOTICE 'Auth users table does not exist or is not accessible';
    WHEN others THEN
      RAISE NOTICE 'Unknown error accessing auth.users: %', SQLERRM;
  END;
END $$; 