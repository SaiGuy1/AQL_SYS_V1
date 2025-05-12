-- Check if job_status enum type exists and what values it has
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

-- Check the data type of the status column in the jobs table
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

-- Show valid job status values from a sample record if one exists
SELECT 
  DISTINCT status 
FROM 
  public.jobs 
WHERE 
  status IS NOT NULL
LIMIT 10; 