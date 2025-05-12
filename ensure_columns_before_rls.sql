-- Script to ensure all necessary columns exist before applying RLS policies
-- Created to fix the "column does not exist" errors

-- Jobs table columns
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS inspector_id text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS customer_id text;

-- Timesheets table columns
ALTER TABLE public.timesheets ADD COLUMN IF NOT EXISTS inspector_id text;

-- Defects table columns
ALTER TABLE public.defects ADD COLUMN IF NOT EXISTS job_id uuid;

-- Reports table columns
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS customer_id text;

-- Confirm table structure after changes
DO $$
DECLARE
  missing_columns text := '';
BEGIN
  -- Check jobs table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'inspector_id') THEN
    missing_columns := missing_columns || 'jobs.inspector_id, ';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'customer_id') THEN
    missing_columns := missing_columns || 'jobs.customer_id, ';
  END IF;
  
  -- Check timesheets table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'timesheets' AND column_name = 'inspector_id') THEN
    missing_columns := missing_columns || 'timesheets.inspector_id, ';
  END IF;
  
  -- Check defects table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'defects' AND column_name = 'job_id') THEN
    missing_columns := missing_columns || 'defects.job_id, ';
  END IF;
  
  -- Check reports table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'customer_id') THEN
    missing_columns := missing_columns || 'reports.customer_id, ';
  END IF;
  
  -- Report results
  IF missing_columns <> '' THEN
    RAISE NOTICE 'The following columns are still missing: %', missing_columns;
  ELSE
    RAISE NOTICE 'All required columns exist.';
  END IF;
END
$$; 