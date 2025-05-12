-- Script to check the structure of the jobs table

-- Check if the jobs table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'jobs'
    ) THEN 'Jobs table exists'
    ELSE 'Jobs table does not exist'
  END AS table_check;

-- Get column information
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'jobs'
ORDER BY 
  ordinal_position;

-- Check row level security status
SELECT 
  relname AS table_name, 
  relrowsecurity AS rls_enabled
FROM 
  pg_class
WHERE 
  relname = 'jobs' 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check RLS policies
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
  tablename = 'jobs';

-- Count records
SELECT COUNT(*) AS job_count FROM public.jobs;

-- Sample data (first 5 records)
SELECT * FROM public.jobs LIMIT 5; 