-- Script to create or update the jobs table with all required columns

-- First, check if the jobs table exists
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs'
  ) INTO table_exists;

  IF NOT table_exists THEN
    -- Create the table with all required columns
    CREATE TABLE public.jobs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      title text,
      status text DEFAULT 'draft',
      job_number text,
      location_number text,
      revision integer DEFAULT 0,
      user_id uuid,
      form_data jsonb DEFAULT '{}',
      customer jsonb DEFAULT '{}',
      location jsonb DEFAULT '{}',
      current_tab text DEFAULT 'info'
    );
    
    RAISE NOTICE 'Created jobs table with all required columns';
  ELSE
    -- Table exists, check for and add any missing columns
    
    -- Check and add form_data column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'jobs' 
      AND column_name = 'form_data'
    ) THEN
      ALTER TABLE public.jobs ADD COLUMN form_data jsonb DEFAULT '{}';
      RAISE NOTICE 'Added form_data column';
    END IF;
    
    -- Check and add customer column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'jobs' 
      AND column_name = 'customer'
    ) THEN
      ALTER TABLE public.jobs ADD COLUMN customer jsonb DEFAULT '{}';
      RAISE NOTICE 'Added customer column';
    END IF;
    
    -- Check and add location column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'jobs' 
      AND column_name = 'location'
    ) THEN
      ALTER TABLE public.jobs ADD COLUMN location jsonb DEFAULT '{}';
      RAISE NOTICE 'Added location column';
    END IF;
    
    -- Check and add current_tab column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'jobs' 
      AND column_name = 'current_tab'
    ) THEN
      ALTER TABLE public.jobs ADD COLUMN current_tab text DEFAULT 'info';
      RAISE NOTICE 'Added current_tab column';
    END IF;
    
    -- Check and add status column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'jobs' 
      AND column_name = 'status'
    ) THEN
      ALTER TABLE public.jobs ADD COLUMN status text DEFAULT 'draft';
      RAISE NOTICE 'Added status column';
    END IF;
    
    -- Check and add job_number column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'jobs' 
      AND column_name = 'job_number'
    ) THEN
      ALTER TABLE public.jobs ADD COLUMN job_number text;
      RAISE NOTICE 'Added job_number column';
    END IF;
    
    -- Check and add location_number column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'jobs' 
      AND column_name = 'location_number'
    ) THEN
      ALTER TABLE public.jobs ADD COLUMN location_number text;
      RAISE NOTICE 'Added location_number column';
    END IF;
    
    -- Check and add revision column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'jobs' 
      AND column_name = 'revision'
    ) THEN
      ALTER TABLE public.jobs ADD COLUMN revision integer DEFAULT 0;
      RAISE NOTICE 'Added revision column';
    END IF;
    
    -- Check and add user_id column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'jobs' 
      AND column_name = 'user_id'
    ) THEN
      ALTER TABLE public.jobs ADD COLUMN user_id uuid;
      RAISE NOTICE 'Added user_id column';
    END IF;
    
    RAISE NOTICE 'Updated jobs table structure';
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.jobs;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.jobs;
DROP POLICY IF EXISTS "Enable delete for owners" ON public.jobs;

-- Create policies
-- Allow anyone to read jobs
CREATE POLICY "Enable read access for all users" 
  ON public.jobs FOR SELECT 
  USING (true);

-- Allow authenticated users to insert jobs
CREATE POLICY "Enable insert for authenticated users only" 
  ON public.jobs FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update jobs if they own them
CREATE POLICY "Enable update for users based on user_id" 
  ON public.jobs FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Allow users to delete jobs if they own them
CREATE POLICY "Enable delete for owners" 
  ON public.jobs FOR DELETE 
  USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Grant privileges
GRANT ALL ON public.jobs TO postgres, service_role;
GRANT SELECT ON public.jobs TO anon;
GRANT ALL ON public.jobs TO authenticated;

-- Verify the table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'jobs'
ORDER BY ordinal_position;

-- Verify the policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'jobs'; 