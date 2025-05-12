-- Script to verify and create the jobs table with all required fields and RLS policies

-- Check if the jobs table exists
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
      user_id uuid,
      form_data jsonb DEFAULT '{}',
      customer jsonb DEFAULT '{}',
      location jsonb DEFAULT '{}',
      current_tab text DEFAULT 'info'
    );
    
    RAISE NOTICE 'Created jobs table';
  ELSE
    RAISE NOTICE 'Jobs table already exists';
    
    -- Check for missing columns and add them if needed
    -- created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'created_at') THEN
      ALTER TABLE public.jobs ADD COLUMN created_at timestamp with time zone DEFAULT now();
      RAISE NOTICE 'Added missing column: created_at';
    END IF;
    
    -- updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'updated_at') THEN
      ALTER TABLE public.jobs ADD COLUMN updated_at timestamp with time zone DEFAULT now();
      RAISE NOTICE 'Added missing column: updated_at';
    END IF;
    
    -- title
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'title') THEN
      ALTER TABLE public.jobs ADD COLUMN title text;
      RAISE NOTICE 'Added missing column: title';
    END IF;
    
    -- status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'status') THEN
      ALTER TABLE public.jobs ADD COLUMN status text DEFAULT 'draft';
      RAISE NOTICE 'Added missing column: status';
    END IF;
    
    -- job_number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'job_number') THEN
      ALTER TABLE public.jobs ADD COLUMN job_number text;
      RAISE NOTICE 'Added missing column: job_number';
    END IF;
    
    -- location_number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'location_number') THEN
      ALTER TABLE public.jobs ADD COLUMN location_number text;
      RAISE NOTICE 'Added missing column: location_number';
    END IF;
    
    -- revision
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'revision') THEN
      ALTER TABLE public.jobs ADD COLUMN revision integer DEFAULT 0;
      RAISE NOTICE 'Added missing column: revision';
    END IF;
    
    -- user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'user_id') THEN
      ALTER TABLE public.jobs ADD COLUMN user_id uuid;
      RAISE NOTICE 'Added missing column: user_id';
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
  END IF;
END $$;

-- Enable Row Level Security on the jobs table if not already enabled
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity FROM pg_class WHERE relname = 'jobs' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  INTO rls_enabled;
  
  IF NOT rls_enabled THEN
    ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled Row Level Security for jobs table';
  ELSE
    RAISE NOTICE 'Row Level Security already enabled for jobs table';
  END IF;
END $$;

-- Check for existing policies and create them if they don't exist
DO $$
DECLARE
  select_policy_exists BOOLEAN;
  insert_policy_exists BOOLEAN;
  update_policy_exists BOOLEAN;
BEGIN
  -- Check for select policy
  SELECT EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'jobs' 
    AND operation = 'SELECT'
  ) INTO select_policy_exists;
  
  -- Check for insert policy
  SELECT EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'jobs' 
    AND operation = 'INSERT'
  ) INTO insert_policy_exists;
  
  -- Check for update policy
  SELECT EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'jobs' 
    AND operation = 'UPDATE'
  ) INTO update_policy_exists;
  
  -- Create policies if they don't exist
  IF NOT select_policy_exists THEN
    CREATE POLICY "Enable read access for all users" 
      ON public.jobs FOR SELECT 
      USING (true);
    RAISE NOTICE 'Created read access policy for jobs table';
  END IF;
  
  IF NOT insert_policy_exists THEN
    CREATE POLICY "Enable insert for authenticated users only" 
      ON public.jobs FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Created insert policy for jobs table';
  END IF;
  
  IF NOT update_policy_exists THEN
    CREATE POLICY "Enable update for users based on user_id" 
      ON public.jobs FOR UPDATE 
      USING (auth.uid() = user_id) 
      WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Created update policy for jobs table';
  END IF;
END $$;

-- Verify the table structure and policies
SELECT 'Table Structure' AS check_type, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'jobs'
ORDER BY ordinal_position;

SELECT 'RLS Policies' AS check_type, policyname, permissive, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'jobs'; 