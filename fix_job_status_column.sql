-- Script to fix the jobs table status column

-- First, check the current data type of the status column
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

-- Check if job_status enum exists and see its values
SELECT 
  pg_type.typname AS enum_name,
  pg_enum.enumlabel AS enum_value,
  pg_enum.enumsortorder
FROM 
  pg_type 
  JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
WHERE 
  pg_type.typname = 'job_status'
ORDER BY 
  pg_enum.enumsortorder;

-- OPTION 1: If the table has an enum column but is missing the 'draft' value
-- Add 'draft' to the enum type if it doesn't exist
DO $$
BEGIN
  -- Check if the 'draft' enum value exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_status')
    AND enumlabel = 'draft'
  ) THEN
    -- Add 'draft' value to the enum
    ALTER TYPE job_status ADD VALUE 'draft';
    RAISE NOTICE 'Added "draft" to job_status enum';
  ELSE
    RAISE NOTICE 'The "draft" value already exists in job_status enum';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE 'job_status enum type does not exist';
END $$;

-- OPTION 2: If job_status is an enum but we need to change the column to text
-- This is more drastic but guarantees compatibility
DO $$
BEGIN
  -- Try to alter the column type to text
  BEGIN
    ALTER TABLE public.jobs ALTER COLUMN status TYPE text;
    RAISE NOTICE 'Changed status column from enum to text';
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'Could not change status column type: %', SQLERRM;
  END;
END $$;

-- OPTION 3: Create a job_status enum type if it doesn't exist yet
-- This is the most comprehensive fix - create enum with all values we need
DO $$
BEGIN
  -- First check if job_status enum exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    -- Create the enum with all values we need
    CREATE TYPE job_status AS ENUM ('draft', 'pending', 'assigned', 'in-progress', 'completed', 'cancelled');
    RAISE NOTICE 'Created job_status enum type with required values';
    
    -- If the column exists but is text, try to convert it to the enum
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'jobs'
      AND column_name = 'status'
      AND data_type = 'text'
    ) THEN
      -- Try to convert the column from text to enum
      ALTER TABLE public.jobs ALTER COLUMN status TYPE job_status USING status::job_status;
      RAISE NOTICE 'Converted status column from text to job_status enum';
    END IF;
  ELSE
    RAISE NOTICE 'job_status enum type already exists';
  END;
END $$;

-- Check the current values in the status column
SELECT DISTINCT status, COUNT(*) 
FROM public.jobs 
GROUP BY status 
ORDER BY count DESC;

-- Test that a new job can be created with 'draft' status
-- Comment out the INSERT statements if needed
INSERT INTO public.jobs (
  title, 
  status,
  job_number
)
VALUES (
  'Test Status Column Fix', 
  'draft',
  'TEST-STATUS-' || floor(random() * 10000)::text
)
RETURNING id, title, status, job_number;

-- Test with enum casting if needed
INSERT INTO public.jobs (
  title, 
  status,
  job_number
)
VALUES (
  'Test Status Enum Cast', 
  'pending',
  'TEST-ENUM-' || floor(random() * 10000)::text
)
RETURNING id, title, status, job_number; 