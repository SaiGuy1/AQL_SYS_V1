-- Simplified RLS policies with explicit type casting
-- Run the check_column_types.sql script first to understand your column types

-- ======= ENABLE RLS ON ALL TABLES =======
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ======= SIMPLIFY USER ROLE CHECKING =======
-- First, drop the existing function and all dependencies
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;

-- Now create the function to get the current user's role safely
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======= POLICIES FOR JOBS TABLE =======
-- Drop existing policies
DROP POLICY IF EXISTS "Admin and managers can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Inspectors can only view assigned jobs" ON public.jobs;
DROP POLICY IF EXISTS "Customers can only view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin and managers can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin and managers can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin can delete jobs" ON public.jobs;

-- Simplified policies with explicit casting
CREATE POLICY "Admin and managers can view all jobs" 
  ON public.jobs FOR SELECT 
  USING (public.get_user_role() IN ('admin', 'manager'));

CREATE POLICY "Inspectors can only view assigned jobs" 
  ON public.jobs FOR SELECT 
  USING (
    inspector_id::text = auth.uid()::text
    AND public.get_user_role() = 'inspector'
  );

CREATE POLICY "Customers can only view their own jobs" 
  ON public.jobs FOR SELECT 
  USING (
    customer_id::text = auth.uid()::text
    AND public.get_user_role() = 'customer'
  );

CREATE POLICY "Admin and managers can insert jobs" 
  ON public.jobs FOR INSERT 
  WITH CHECK (public.get_user_role() IN ('admin', 'manager'));

CREATE POLICY "Admin and managers can update jobs" 
  ON public.jobs FOR UPDATE 
  USING (public.get_user_role() IN ('admin', 'manager'));

CREATE POLICY "Admin can delete jobs" 
  ON public.jobs FOR DELETE 
  USING (public.get_user_role() = 'admin');

-- ======= POLICIES FOR PROFILES TABLE =======
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (id::text = auth.uid()::text);

CREATE POLICY "Admin can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (id::text = auth.uid()::text);

CREATE POLICY "Admin can update all profiles" 
  ON public.profiles FOR UPDATE 
  USING (public.get_user_role() = 'admin');

-- ======= POLICIES FOR TIMESHEETS TABLE =======
-- Drop existing policies
DROP POLICY IF EXISTS "Inspectors can view their own timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Admin and managers can view all timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Inspectors can insert their own timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Admin and managers can update timesheets" ON public.timesheets;

-- Create policies for timesheets table
CREATE POLICY "Inspectors can view their own timesheets" 
  ON public.timesheets FOR SELECT 
  USING (inspector_id::text = auth.uid()::text);

CREATE POLICY "Admin and managers can view all timesheets" 
  ON public.timesheets FOR SELECT 
  USING (public.get_user_role() IN ('admin', 'manager'));

CREATE POLICY "Inspectors can insert their own timesheets" 
  ON public.timesheets FOR INSERT 
  WITH CHECK (
    inspector_id::text = auth.uid()::text
    AND public.get_user_role() = 'inspector'
  );

CREATE POLICY "Admin and managers can update timesheets" 
  ON public.timesheets FOR UPDATE 
  USING (public.get_user_role() IN ('admin', 'manager'));

-- ======= POLICIES FOR DEFECTS TABLE =======
-- Drop existing policies
DROP POLICY IF EXISTS "Inspectors can view defects for their jobs" ON public.defects;
DROP POLICY IF EXISTS "Admin and managers can view all defects" ON public.defects;
DROP POLICY IF EXISTS "Customers can view defects for their jobs" ON public.defects;
DROP POLICY IF EXISTS "Inspectors can insert defects" ON public.defects;
DROP POLICY IF EXISTS "Admin and managers can update defects" ON public.defects;

-- Create policies for defects table
CREATE POLICY "Inspectors can view defects for their jobs" 
  ON public.defects FOR SELECT 
  USING (
    job_id IN (
      SELECT id FROM public.jobs 
      WHERE inspector_id::text = auth.uid()::text
    )
    AND public.get_user_role() = 'inspector'
  );

CREATE POLICY "Admin and managers can view all defects" 
  ON public.defects FOR SELECT 
  USING (public.get_user_role() IN ('admin', 'manager'));

CREATE POLICY "Customers can view defects for their jobs" 
  ON public.defects FOR SELECT 
  USING (
    job_id IN (
      SELECT id FROM public.jobs 
      WHERE customer_id::text = auth.uid()::text
    )
    AND public.get_user_role() = 'customer'
  );

CREATE POLICY "Inspectors can insert defects" 
  ON public.defects FOR INSERT 
  WITH CHECK (
    job_id IN (
      SELECT id FROM public.jobs 
      WHERE inspector_id::text = auth.uid()::text
    )
    AND public.get_user_role() = 'inspector'
  );

CREATE POLICY "Admin and managers can update defects" 
  ON public.defects FOR UPDATE 
  USING (public.get_user_role() IN ('admin', 'manager'));

-- ======= POLICIES FOR REPORTS TABLE =======
-- Drop existing policies
DROP POLICY IF EXISTS "Admin and managers can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Customers can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Admin and managers can insert reports" ON public.reports;
DROP POLICY IF EXISTS "Admin and managers can update reports" ON public.reports;

-- Create policies for reports table
CREATE POLICY "Admin and managers can view all reports" 
  ON public.reports FOR SELECT 
  USING (public.get_user_role() IN ('admin', 'manager'));

CREATE POLICY "Customers can view their own reports" 
  ON public.reports FOR SELECT 
  USING (
    customer_id::text = auth.uid()::text
    AND public.get_user_role() = 'customer'
  );

CREATE POLICY "Admin and managers can insert reports" 
  ON public.reports FOR INSERT 
  WITH CHECK (public.get_user_role() IN ('admin', 'manager'));

CREATE POLICY "Admin and managers can update reports" 
  ON public.reports FOR UPDATE 
  USING (public.get_user_role() IN ('admin', 'manager'));

-- ======= POLICIES FOR CUSTOMERS TABLE =======
-- Drop existing policies
DROP POLICY IF EXISTS "Admin and managers can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Customers can view their own record" ON public.customers;
DROP POLICY IF EXISTS "Admin and managers can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Admin and managers can update customers" ON public.customers;

-- Create policies for customers table
CREATE POLICY "Admin and managers can view all customers" 
  ON public.customers FOR SELECT 
  USING (public.get_user_role() IN ('admin', 'manager'));

CREATE POLICY "Customers can view their own record" 
  ON public.customers FOR SELECT 
  USING (
    id::text = auth.uid()::text
    AND public.get_user_role() = 'customer'
  );

CREATE POLICY "Admin and managers can insert customers" 
  ON public.customers FOR INSERT 
  WITH CHECK (public.get_user_role() IN ('admin', 'manager'));

CREATE POLICY "Admin and managers can update customers" 
  ON public.customers FOR UPDATE 
  USING (public.get_user_role() IN ('admin', 'manager'));

-- ======= POLICIES FOR NOTIFICATIONS TABLE =======
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Create policies for notifications table
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id::text = auth.uid()::text);
  
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

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