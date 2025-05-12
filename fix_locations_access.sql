-- Enable RLS but make it more permissive
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Authenticated users can read locations" ON public.locations;
DROP POLICY IF EXISTS "Anonymous users can read locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can manage locations" ON public.locations;
DROP POLICY IF EXISTS "Anyone can read locations" ON public.locations;
DROP POLICY IF EXISTS "Service role can manage locations" ON public.locations;

-- Create a policy that allows ANYONE to read the locations table
-- This includes anon and authenticated roles
CREATE POLICY "Anyone can read locations"
  ON public.locations
  FOR SELECT  -- This is for read operations
  TO public  -- This applies to all roles
  USING (true);  -- This always evaluates to true, meaning no restrictions

-- Create a policy that allows authenticated users to insert locations
CREATE POLICY "Authenticated users can insert locations"
  ON public.locations
  FOR INSERT  -- This is for insert operations
  TO authenticated  -- This applies only to authenticated users
  WITH CHECK (true);  -- This always evaluates to true, meaning no restrictions

-- Create a policy that allows service_role to do anything
CREATE POLICY "Service role can manage locations"
  ON public.locations
  FOR ALL  -- This is for all operations
  TO service_role  -- This applies only to the service role
  USING (true);  -- This always evaluates to true, meaning no restrictions

-- Verify the policies
SELECT
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM
  pg_policies
WHERE
  tablename = 'locations';

-- Count the locations to verify there's data
SELECT COUNT(*) FROM public.locations; 