-- Script to directly insert a test job record

-- First, check the job_status enum values
SELECT 
  pg_type.typname AS enum_name,
  pg_enum.enumlabel AS enum_value
FROM 
  pg_type 
  JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
WHERE 
  pg_type.typname = 'job_status'
ORDER BY 
  pg_enum.enumsortorder;

-- Check the table structure focusing on status column
SELECT 
  column_name, 
  data_type, 
  udt_name
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' 
  AND table_name = 'jobs'
  AND column_name = 'status';

-- Insert a test job record using the proper enum value
-- If the status column uses an enum, we'll use both approaches:

-- OPTION 1: Try with the enum casting approach
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
  'Test Job via SQL - Option 1', 
  'pending'::job_status,  -- Cast to enum type
  'TEST-SQL-1235', 
  'LOC-SQL-TEST', 
  0, 
  '{"test": true, "sample": "data", "created_at": "2025-05-06T01:00:00Z"}'::jsonb, 
  '{"name": "Test Customer", "contact": "John Doe"}'::jsonb,
  '{"id": "51458442-097f-4438-a4b8-077d24ae9185", "name": "Romulus MI"}'::jsonb,
  'info'
)
RETURNING *;

-- OPTION 2: If first approach fails, try with direct numeric index
-- Some enums can be accessed by index: 0, 1, 2, etc.
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
  'Test Job via SQL - Option 2', 
  1,  -- Often in enums 0=draft, 1=pending, etc.
  'TEST-SQL-1236', 
  'LOC-SQL-TEST', 
  0, 
  '{"test": true, "sample": "data", "created_at": "2025-05-06T01:00:00Z"}'::jsonb, 
  '{"name": "Test Customer", "contact": "John Doe"}'::jsonb,
  '{"id": "51458442-097f-4438-a4b8-077d24ae9185", "name": "Romulus MI"}'::jsonb,
  'info'
)
RETURNING *;

-- OPTION 3: Try creating with NULL and then updating it
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
  'Test Job via SQL - Option 3', 
  NULL,  -- Set to NULL initially
  'TEST-SQL-1237', 
  'LOC-SQL-TEST', 
  0, 
  '{"test": true, "sample": "data", "created_at": "2025-05-06T01:00:00Z"}'::jsonb, 
  '{"name": "Test Customer", "contact": "John Doe"}'::jsonb,
  '{"id": "51458442-097f-4438-a4b8-077d24ae9185", "name": "Romulus MI"}'::jsonb,
  'info'
)
RETURNING *;

-- Verify the inserted records
SELECT * FROM public.jobs 
WHERE title LIKE 'Test Job via SQL%'
ORDER BY created_at DESC
LIMIT 10; 