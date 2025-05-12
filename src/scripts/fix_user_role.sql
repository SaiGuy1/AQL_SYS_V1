-- Fix User Role - Sets a user's role to manager in the profiles table
-- Replace 'user@example.com' with the actual user email
-- Run this SQL script in the Supabase SQL editor

-- Step 1: Check if the user_role type exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    -- Create the enum type if it doesn't exist
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'supervisor', 'inspector', 'hr', 'accounting', 'customer');
  END IF;
END
$$;

-- Step 2: Display current user info
SELECT id, email, role 
FROM public.profiles 
WHERE email = 'user@example.com'; -- REPLACE WITH ACTUAL EMAIL

-- Step 3: Update the user's role to manager
UPDATE public.profiles
SET role = 'manager'
WHERE email = 'user@example.com'; -- REPLACE WITH ACTUAL EMAIL

-- Step 4: Verify the update
SELECT id, email, role 
FROM public.profiles 
WHERE email = 'user@example.com'; -- REPLACE WITH ACTUAL EMAIL

-- Step 5: Update all role-specific policies to allow access
-- This ensures the user can access data according to the new role
-- If there are any specific policies for managers in your database that
-- need to be adjusted, add them below.

-- Note: After running this script, the user should log out and log back in
-- for the role change to take effect. 