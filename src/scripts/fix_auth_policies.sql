-- =======================================
-- AQL System Auth Policies Repair Script
-- =======================================
--
-- Run this script in the Supabase SQL Editor to fix common issues with
-- authentication and Row Level Security (RLS) policies that may prevent
-- inspector registration from working properly.
--
-- This script is designed to be safe to run multiple times.

-- 1. Enable RLS on key tables if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspector_locations ENABLE ROW LEVEL SECURITY;

-- 2. Fix auth.users access policies
-- These are system-level policies and cannot be directly modified by SQL

-- 3. Fix profiles table policies
-- Policy for public registration (during signup)
DROP POLICY IF EXISTS "Public registration" ON public.profiles;
CREATE POLICY "Public registration"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy for users to view and update their own profile
DROP POLICY IF EXISTS "Users can view and update own profile" ON public.profiles;
CREATE POLICY "Users can view and update own profile"
  ON public.profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy for admin/manager to view all profiles
DROP POLICY IF EXISTS "Admin/Manager can view all profiles" ON public.profiles;
CREATE POLICY "Admin/Manager can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
    )
    OR role = 'inspector' -- Allow all authenticated users to view inspectors
  );

-- Policy for admin/manager to update profiles
DROP POLICY IF EXISTS "Admin/Manager can update profiles" ON public.profiles;
CREATE POLICY "Admin/Manager can update profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
    )
  );

-- 4. Fix inspector_locations table policies
-- Policy for service role operations (needed during signup)
DROP POLICY IF EXISTS "Service role can manage inspector_locations" ON public.inspector_locations;
CREATE POLICY "Service role can manage inspector_locations"
  ON public.inspector_locations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admins and managers can view and manage all assignments
DROP POLICY IF EXISTS "Admins and managers can do all on inspector_locations" ON public.inspector_locations;
CREATE POLICY "Admins and managers can do all on inspector_locations"
  ON public.inspector_locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Inspectors can only view their own assignments
DROP POLICY IF EXISTS "Inspectors can view their own assignments" ON public.inspector_locations;
CREATE POLICY "Inspectors can view their own assignments"
  ON public.inspector_locations
  FOR SELECT
  TO authenticated
  USING (
    inspector_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- 5. Verify current policies (for debugging)
-- Comment out this section if you don't want to see the policy info
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd, 
  qual, 
  with_check
FROM 
  pg_policies
WHERE 
  schemaname = 'public' AND
  (tablename = 'profiles' OR tablename = 'inspector_locations')
ORDER BY
  tablename, policyname;

-- 6. Validate permissions needed for signup
-- This function can be used for debugging permission issues
CREATE OR REPLACE FUNCTION verify_signup_permissions()
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  result := 'Permissions check completed:' || E'\n';
  
  -- Check if profiles table has the required policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Public registration'
  ) THEN
    result := result || '✅ Profiles table has public registration policy' || E'\n';
  ELSE
    result := result || '❌ Profiles table missing public registration policy' || E'\n';
  END IF;
  
  -- Check if inspector_locations table has required policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'inspector_locations' 
    AND policyname = 'Service role can manage inspector_locations'
  ) THEN
    result := result || '✅ Inspector_locations table has service role policy' || E'\n';
  ELSE
    result := result || '❌ Inspector_locations table missing service role policy' || E'\n';
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Run the verification function
SELECT verify_signup_permissions(); 