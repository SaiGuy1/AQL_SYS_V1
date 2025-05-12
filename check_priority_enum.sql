-- Script to check the allowed values in the job_priority enum
-- Run this in the Supabase SQL Editor

-- Check if job_priority enum type exists
SELECT EXISTS (
    SELECT 1 
    FROM pg_type 
    WHERE typname = 'job_priority'
) AS job_priority_enum_exists;

-- If it exists, show the allowed values
SELECT
    pg_enum.enumlabel
FROM
    pg_type
JOIN
    pg_enum ON pg_enum.enumtypid = pg_type.oid
WHERE
    pg_type.typname = 'job_priority'
ORDER BY
    pg_enum.enumsortorder;

-- Check priority column in jobs table
SELECT 
    column_name, 
    data_type, 
    udt_name
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'jobs'
    AND column_name = 'priority'; 