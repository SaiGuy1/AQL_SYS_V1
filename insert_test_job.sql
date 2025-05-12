-- Script to directly insert a test job record

-- First, check the table structure
SELECT 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' 
  AND table_name = 'jobs'
ORDER BY 
  ordinal_position;

-- Insert a test job record
INSERT INTO public.jobs (
  title, 
  status, 
  job_number, 
  location_number, 
  revision, 
  form_data, 
  customer, 
  location, 
  current_tab
)
VALUES (
  'Test Job via SQL', 
  'draft', 
  'TEST-SQL-1234', 
  'LOC-SQL-TEST', 
  0, 
  '{"test": true, "sample": "data", "created_at": "2025-05-06T01:00:00Z"}'::jsonb, 
  '{"name": "Test Customer", "contact": "John Doe"}'::jsonb,
  '{"id": "51458442-097f-4438-a4b8-077d24ae9185", "name": "Romulus MI"}'::jsonb,
  'info'
)
RETURNING *;

-- Verify the inserted record
SELECT * FROM public.jobs 
WHERE title = 'Test Job via SQL'
ORDER BY created_at DESC
LIMIT 1; 