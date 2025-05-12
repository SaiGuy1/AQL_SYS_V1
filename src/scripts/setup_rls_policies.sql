-- Script to set up RLS policies for all tables in the AQL application
-- This should be executed in the Supabase SQL Editor

-- ======= ENABLE RLS ON ALL TABLES =======
-- Make sure RLS is enabled on each table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- First, let's inspect the column types to understand what we're dealing with
-- Comment out this section after inspecting table structure
/*
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' AND 
  (column_name LIKE '%id' OR column_name = 'role') 
ORDER BY 
  table_name, 
  column_name;
*/

-- ======= POLICIES FOR JOBS TABLE =======
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin and managers can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Inspectors can only view assigned jobs" ON public.jobs;
DROP POLICY IF EXISTS "Customers can only view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin and managers can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin and managers can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin can delete jobs" ON public.jobs;

-- Create policies for jobs table
CREATE POLICY "Admin and managers can view all jobs" 
  ON public.jobs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- For inspectors - detect if inspector_id is UUID or text
CREATE POLICY "Inspectors can only view assigned jobs" 
  ON public.jobs FOR SELECT 
  USING (
    (
      -- If inspector_id is UUID
      (pg_typeof(inspector_id) = 'uuid'::regtype AND inspector_id = auth.uid()) 
      OR 
      -- If inspector_id is TEXT
      (pg_typeof(inspector_id) = 'text'::regtype AND inspector_id = auth.uid()::text)
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'inspector'
    )
  );

-- For customers
CREATE POLICY "Customers can only view their own jobs" 
  ON public.jobs FOR SELECT 
  USING (
    (
      -- If customer_id is UUID
      (pg_typeof(customer_id) = 'uuid'::regtype AND customer_id = auth.uid()) 
      OR 
      -- If customer_id is TEXT
      (pg_typeof(customer_id) = 'text'::regtype AND customer_id = auth.uid()::text)
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'customer'
    )
  );

CREATE POLICY "Admin and managers can insert jobs" 
  ON public.jobs FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin and managers can update jobs" 
  ON public.jobs FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin can delete jobs" 
  ON public.jobs FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ======= POLICIES FOR PROFILES TABLE =======
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (id = auth.uid());

CREATE POLICY "Admin can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (id = auth.uid());

CREATE POLICY "Admin can update all profiles" 
  ON public.profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ======= POLICIES FOR TIMESHEETS TABLE =======
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Inspectors can view their own timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Admin and managers can view all timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Inspectors can insert their own timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Admin and managers can update timesheets" ON public.timesheets;

-- Create policies for timesheets table
CREATE POLICY "Inspectors can view their own timesheets" 
  ON public.timesheets FOR SELECT 
  USING (
    (
      -- If inspector_id is UUID
      (pg_typeof(inspector_id) = 'uuid'::regtype AND inspector_id = auth.uid()) 
      OR 
      -- If inspector_id is TEXT
      (pg_typeof(inspector_id) = 'text'::regtype AND inspector_id = auth.uid()::text)
    )
  );

CREATE POLICY "Admin and managers can view all timesheets" 
  ON public.timesheets FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Inspectors can insert their own timesheets" 
  ON public.timesheets FOR INSERT 
  WITH CHECK (
    (
      -- If inspector_id is UUID
      (pg_typeof(inspector_id) = 'uuid'::regtype AND inspector_id = auth.uid()) 
      OR 
      -- If inspector_id is TEXT
      (pg_typeof(inspector_id) = 'text'::regtype AND inspector_id = auth.uid()::text)
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'inspector'
    )
  );

CREATE POLICY "Admin and managers can update timesheets" 
  ON public.timesheets FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- ======= POLICIES FOR DEFECTS TABLE =======
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Inspectors can view defects for their jobs" ON public.defects;
DROP POLICY IF EXISTS "Admin and managers can view all defects" ON public.defects;
DROP POLICY IF EXISTS "Customers can view defects for their jobs" ON public.defects;
DROP POLICY IF EXISTS "Inspectors can insert defects" ON public.defects;
DROP POLICY IF EXISTS "Admin and managers can update defects" ON public.defects;

-- Create policies for defects table
CREATE POLICY "Inspectors can view defects for their jobs" 
  ON public.defects FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE 
        (
          (pg_typeof(inspector_id) = 'uuid'::regtype AND inspector_id = auth.uid())
          OR
          (pg_typeof(inspector_id) = 'text'::regtype AND inspector_id = auth.uid()::text)
        )
        AND jobs.id = defects.job_id
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'inspector'
    )
  );

CREATE POLICY "Admin and managers can view all defects" 
  ON public.defects FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Customers can view defects for their jobs" 
  ON public.defects FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE 
        (
          (pg_typeof(customer_id) = 'uuid'::regtype AND customer_id = auth.uid())
          OR
          (pg_typeof(customer_id) = 'text'::regtype AND customer_id = auth.uid()::text)
        )
        AND jobs.id = defects.job_id
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'customer'
    )
  );

CREATE POLICY "Inspectors can insert defects" 
  ON public.defects FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE 
        (
          (pg_typeof(inspector_id) = 'uuid'::regtype AND inspector_id = auth.uid())
          OR
          (pg_typeof(inspector_id) = 'text'::regtype AND inspector_id = auth.uid()::text)
        )
        AND jobs.id = defects.job_id
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'inspector'
    )
  );

CREATE POLICY "Admin and managers can update defects" 
  ON public.defects FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- ======= POLICIES FOR REPORTS TABLE =======
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin and managers can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Customers can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Admin and managers can insert reports" ON public.reports;
DROP POLICY IF EXISTS "Admin and managers can update reports" ON public.reports;

-- Create policies for reports table
CREATE POLICY "Admin and managers can view all reports" 
  ON public.reports FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Customers can view their own reports" 
  ON public.reports FOR SELECT 
  USING (
    (
      -- If customer_id is UUID
      (pg_typeof(customer_id) = 'uuid'::regtype AND customer_id = auth.uid()) 
      OR 
      -- If customer_id is TEXT
      (pg_typeof(customer_id) = 'text'::regtype AND customer_id = auth.uid()::text)
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'customer'
    )
  );

CREATE POLICY "Admin and managers can insert reports" 
  ON public.reports FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin and managers can update reports" 
  ON public.reports FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- ======= POLICIES FOR CUSTOMERS TABLE =======
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin and managers can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Customers can view their own record" ON public.customers;
DROP POLICY IF EXISTS "Admin and managers can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Admin and managers can update customers" ON public.customers;

-- Create policies for customers table
CREATE POLICY "Admin and managers can view all customers" 
  ON public.customers FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Customers can view their own record" 
  ON public.customers FOR SELECT 
  USING (
    id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'customer'
    )
  );

CREATE POLICY "Admin and managers can insert customers" 
  ON public.customers FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin and managers can update customers" 
  ON public.customers FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- ======= POLICIES FOR NOTIFICATIONS TABLE =======
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Create policies for notifications table
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (
    (
      -- If user_id is UUID
      (pg_typeof(user_id) = 'uuid'::regtype AND user_id = auth.uid()) 
      OR 
      -- If user_id is TEXT
      (pg_typeof(user_id) = 'text'::regtype AND user_id = auth.uid()::text)
    )
  );
  
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (
    (
      -- If user_id is UUID
      (pg_typeof(user_id) = 'uuid'::regtype AND user_id = auth.uid()) 
      OR 
      -- If user_id is TEXT
      (pg_typeof(user_id) = 'text'::regtype AND user_id = auth.uid()::text)
    )
  )
  WITH CHECK (
    (
      -- If user_id is UUID
      (pg_typeof(user_id) = 'uuid'::regtype AND user_id = auth.uid()) 
      OR 
      -- If user_id is TEXT
      (pg_typeof(user_id) = 'text'::regtype AND user_id = auth.uid()::text)
    )
  );

-- Check RLS status for tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM
  pg_tables
WHERE
  schemaname = 'public'
ORDER BY
  tablename;

-- For each table show policies
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
  schemaname = 'public'
ORDER BY
  tablename, policyname; 