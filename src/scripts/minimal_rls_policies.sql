-- Minimal RLS policies with text-only comparisons
-- This is the most conservative approach to avoid type issues

-- ======= ENABLE RLS ON ALL TABLES =======
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ======= POLICIES FOR PROFILES TABLE (HANDLE FIRST) =======
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "All users can view their own profile" ON public.profiles;

-- Basic policy for profiles - ensure everyone can at least see their own profile
CREATE POLICY "All users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (id::text = auth.uid()::text);

-- ======= BASIC POLICIES FOR OTHER TABLES =======
-- For each table, just create a basic admin policy first to get RLS working

-- JOBS TABLE
DROP POLICY IF EXISTS "Admin access to jobs" ON public.jobs;
CREATE POLICY "Admin access to jobs" 
  ON public.jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

-- TIMESHEETS TABLE
DROP POLICY IF EXISTS "Admin access to timesheets" ON public.timesheets;
CREATE POLICY "Admin access to timesheets" 
  ON public.timesheets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

-- DEFECTS TABLE
DROP POLICY IF EXISTS "Admin access to defects" ON public.defects;
CREATE POLICY "Admin access to defects" 
  ON public.defects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

-- REPORTS TABLE
DROP POLICY IF EXISTS "Admin access to reports" ON public.reports;
CREATE POLICY "Admin access to reports" 
  ON public.reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

-- CUSTOMERS TABLE
DROP POLICY IF EXISTS "Admin access to customers" ON public.customers;
CREATE POLICY "Admin access to customers" 
  ON public.customers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

-- NOTIFICATIONS TABLE
DROP POLICY IF EXISTS "Admin access to notifications" ON public.notifications;
CREATE POLICY "Admin access to notifications" 
  ON public.notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

-- Verify all policies are created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM
  pg_policies
WHERE
  schemaname = 'public'
ORDER BY
  tablename, policyname; 