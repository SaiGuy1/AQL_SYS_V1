-- Script to fix the column case mismatch in the jobs table
-- Run this in the Supabase SQL Editor

-- First check if we have an 'assignedto' column (lowercase)
DO $$
DECLARE
    has_lowercase_column BOOLEAN;
    has_camelcase_column BOOLEAN;
BEGIN
    -- Check if lowercase 'assignedto' column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'jobs' 
        AND column_name = 'assignedto'
    ) INTO has_lowercase_column;
    
    -- Check if camelCase 'assignedTo' column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'jobs' 
        AND column_name = 'assignedTo'
    ) INTO has_camelcase_column;
    
    -- Different fixes based on what we find
    IF has_lowercase_column AND NOT has_camelcase_column THEN
        -- We have only lowercase column, let's rename it to camelCase
        EXECUTE 'ALTER TABLE public.jobs RENAME COLUMN assignedto TO "assignedTo"';
        RAISE NOTICE 'Renamed assignedto to assignedTo (camelCase)';
    ELSIF has_camelcase_column AND NOT has_lowercase_column THEN
        -- We already have a camelCase column, no need to do anything
        RAISE NOTICE 'Column assignedTo (camelCase) already exists';
    ELSIF has_lowercase_column AND has_camelcase_column THEN
        -- We have both columns, need to copy data and drop one
        RAISE NOTICE 'Both assignedto and assignedTo exist. Merging into assignedTo';
        
        -- Copy data from lowercase to camelCase where camelCase is null
        EXECUTE 'UPDATE public.jobs SET "assignedTo" = assignedto WHERE "assignedTo" IS NULL AND assignedto IS NOT NULL';
        
        -- Drop the lowercase column
        EXECUTE 'ALTER TABLE public.jobs DROP COLUMN assignedto';
        RAISE NOTICE 'Merged data and dropped assignedto column';
    ELSE
        -- Neither column exists, create the camelCase version
        EXECUTE 'ALTER TABLE public.jobs ADD COLUMN "assignedTo" TEXT';
        RAISE NOTICE 'Created new assignedTo column';
    END IF;
END $$;

-- Also ensure the inspector_id exists and is correctly named
DO $$
BEGIN
    -- Check if inspector_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'jobs' 
        AND column_name = 'inspector_id'
    ) THEN
        -- Add inspector_id column if it doesn't exist
        ALTER TABLE public.jobs ADD COLUMN inspector_id UUID;
        RAISE NOTICE 'Added missing inspector_id column';
    END IF;
END $$;

-- Update the inspector_id with data to match the assignedTo
-- This helps with RLS policies and ensures proper job visibility
UPDATE public.jobs 
SET inspector_id = "assignedTo"::UUID 
WHERE inspector_id IS NULL AND "assignedTo" IS NOT NULL AND "assignedTo" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Check the current column structure
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'jobs'
    AND column_name IN ('assignedto', 'assignedTo', 'inspector_id', 'inspector');

-- Display success message
SELECT 'Column case issue has been fixed. The assignedTo column is now properly named in camelCase.' AS message; 