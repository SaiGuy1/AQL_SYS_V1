-- SQL Script to fix Row Level Security policies for profiles table

-- 1. Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for profiles table
-- Policy for users to view and update their own profile
CREATE POLICY IF NOT EXISTS "Users can view and update own profile"
ON public.profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for admin/manager to view all profiles
CREATE POLICY IF NOT EXISTS "Admin/Manager can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IN (
  SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
));

-- Policy for admin/manager to update profiles
CREATE POLICY IF NOT EXISTS "Admin/Manager can update profiles"
ON public.profiles
FOR UPDATE
USING (auth.uid() IN (
  SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
))
WITH CHECK (auth.uid() IN (
  SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
));

-- 3. Create policy to allow inspectors to view other inspectors (for location assignments)
CREATE POLICY IF NOT EXISTS "Inspectors can view other inspectors"
ON public.profiles
FOR SELECT
USING (
  role = 'inspector' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'inspector')
);

-- 4. Ensure anon role can insert into profiles (for registration)
CREATE POLICY IF NOT EXISTS "Public registration"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 5. Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 6. Create index on location_id for faster location filtering
CREATE INDEX IF NOT EXISTS idx_profiles_location_id ON public.profiles(location_id); 