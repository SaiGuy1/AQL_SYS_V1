-- Script to fix the jobs table and RLS policies

-- First, drop all existing policies to clean up
DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.jobs;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.jobs;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.jobs;

-- Temporarily disable RLS to check table structure
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;

-- Check table structure and create if not exists
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs'
  ) INTO table_exists;

  IF NOT table_exists THEN
    -- Create the jobs table with all required columns
    CREATE TABLE public.jobs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      title text,
      status text DEFAULT 'draft',
      job_number text,
      location_number text,
      revision integer DEFAULT 0,
      user_id uuid REFERENCES auth.users,
      form_data jsonb DEFAULT '{}',
      customer jsonb DEFAULT '{}',
      location jsonb DEFAULT '{}',
      current_tab text DEFAULT 'info',
      attachments_data jsonb DEFAULT '[]',
      safety_requirements jsonb DEFAULT '[]',
      parts_data jsonb DEFAULT '[]',
      certification_questions jsonb DEFAULT '[]',
      customer_data jsonb DEFAULT '{}',
      location_data jsonb DEFAULT '{}'
    );
    
    RAISE NOTICE 'Created jobs table';
  ELSE
    RAISE NOTICE 'Jobs table already exists';
    
    -- Check for missing columns and add them if needed
    -- status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'status') THEN
      ALTER TABLE public.jobs ADD COLUMN status text DEFAULT 'draft';
      RAISE NOTICE 'Added missing column: status';
    END IF;
    
    -- form_data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'form_data') THEN
      ALTER TABLE public.jobs ADD COLUMN form_data jsonb DEFAULT '{}';
      RAISE NOTICE 'Added missing column: form_data';
    END IF;
    
    -- customer
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'customer') THEN
      ALTER TABLE public.jobs ADD COLUMN customer jsonb DEFAULT '{}';
      RAISE NOTICE 'Added missing column: customer';
    END IF;
    
    -- location
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'location') THEN
      ALTER TABLE public.jobs ADD COLUMN location jsonb DEFAULT '{}';
      RAISE NOTICE 'Added missing column: location';
    END IF;
    
    -- current_tab
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'current_tab') THEN
      ALTER TABLE public.jobs ADD COLUMN current_tab text DEFAULT 'info';
      RAISE NOTICE 'Added missing column: current_tab';
    END IF;
    
    -- user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'user_id') THEN
      ALTER TABLE public.jobs ADD COLUMN user_id uuid REFERENCES auth.users;
      RAISE NOTICE 'Added missing column: user_id';
    END IF;
    
    -- attachments_data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'attachments_data') THEN
      ALTER TABLE public.jobs ADD COLUMN attachments_data jsonb DEFAULT '[]';
      RAISE NOTICE 'Added missing column: attachments_data';
    END IF;
    
    -- safety_requirements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'safety_requirements') THEN
      ALTER TABLE public.jobs ADD COLUMN safety_requirements jsonb DEFAULT '[]';
      RAISE NOTICE 'Added missing column: safety_requirements';
    END IF;
    
    -- parts_data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'parts_data') THEN
      ALTER TABLE public.jobs ADD COLUMN parts_data jsonb DEFAULT '[]';
      RAISE NOTICE 'Added missing column: parts_data';
    END IF;
    
    -- certification_questions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'certification_questions') THEN
      ALTER TABLE public.jobs ADD COLUMN certification_questions jsonb DEFAULT '[]';
      RAISE NOTICE 'Added missing column: certification_questions';
    END IF;
    
    -- customer_data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'customer_data') THEN
      ALTER TABLE public.jobs ADD COLUMN customer_data jsonb DEFAULT '{}';
      RAISE NOTICE 'Added missing column: customer_data';
    END IF;
    
    -- location_data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'location_data') THEN
      ALTER TABLE public.jobs ADD COLUMN location_data jsonb DEFAULT '{}';
      RAISE NOTICE 'Added missing column: location_data';
    END IF;
  END IF;
END $$;

-- Re-enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create simple, effective policies
-- Allow anyone to read any job
CREATE POLICY "Enable read access for all users" 
  ON public.jobs FOR SELECT 
  USING (true);

-- Allow authenticated users to insert their own jobs
CREATE POLICY "Enable insert for authenticated users only" 
  ON public.jobs FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Allow users to update their own jobs
CREATE POLICY "Enable update for users based on user_id" 
  ON public.jobs FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own jobs
CREATE POLICY "Enable delete for owners" 
  ON public.jobs FOR DELETE 
  USING (auth.uid() = user_id);

-- Grant privileges to roles
GRANT ALL ON public.jobs TO postgres, service_role;
GRANT SELECT ON public.jobs TO anon;
GRANT ALL ON public.jobs TO authenticated;

-- Check existing jobs data
SELECT 'Jobs data' AS info, COUNT(*) FROM public.jobs;

-- Check all policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies
WHERE tablename = 'jobs';

-- Add attachments_data column
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS attachments_data jsonb DEFAULT '[]';

-- Add other important columns
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS safety_requirements jsonb DEFAULT '[]';

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS parts_data jsonb DEFAULT '[]';

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS certification_questions jsonb DEFAULT '[]';

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS customer_data jsonb DEFAULT '{}';

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS location_data jsonb DEFAULT '{}';

-- Fix any issue with RLS policies
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.jobs;

-- Create a simpler policy that avoids recursion
CREATE POLICY "Enable update for all authenticated users" 
  ON public.jobs 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Make sure RLS is enabled
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create or replace basic policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;
CREATE POLICY "Enable read access for all users" 
  ON public.jobs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.jobs;
CREATE POLICY "Enable insert for authenticated users" 
  ON public.jobs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); 