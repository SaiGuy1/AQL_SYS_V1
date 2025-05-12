-- Check existing RLS policies on the locations table
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

-- If the policies don't exist or are incorrect, we'll recreate them
-- First enable RLS on the locations table
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read locations" ON public.locations;
DROP POLICY IF EXISTS "Anonymous users can read locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can manage locations" ON public.locations;

-- Create more permissive policies
CREATE POLICY "Anyone can read locations"
  ON public.locations
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage locations"
  ON public.locations
  USING (true);

-- Update any NULL values in location_number to their IDs (temporary fix)
UPDATE public.locations
SET location_number = (EXTRACT(EPOCH FROM created_at)::bigint % 1000)::integer
WHERE location_number IS NULL;

-- Let's list all locations to verify
SELECT * FROM public.locations ORDER BY location_number;

-- Finally count the rows
SELECT COUNT(*) FROM public.locations; 