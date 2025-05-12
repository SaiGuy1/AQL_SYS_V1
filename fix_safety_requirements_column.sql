-- Script to fix the safety_requirements column in the jobs table
-- Run this in the Supabase SQL Editor

-- First, check if safety_requirements column exists and its type
DO $$ 
BEGIN
    -- Check column type
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'jobs' 
        AND column_name = 'safety_requirements'
    ) THEN
        -- Get the column type
        PERFORM data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'jobs' 
        AND column_name = 'safety_requirements';
        
        -- Convert safety_requirements to JSONB type which can properly store JSON arrays
        EXECUTE 'ALTER TABLE public.jobs ALTER COLUMN safety_requirements TYPE JSONB USING safety_requirements::JSONB';
        RAISE NOTICE 'Changed safety_requirements column to JSONB type';
    ELSE
        -- If column doesn't exist, create it as JSONB
        ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS safety_requirements JSONB;
        RAISE NOTICE 'Added safety_requirements column as JSONB type';
    END IF;
END $$;

-- Check all array-like columns and convert to JSONB for consistency
DO $$ 
BEGIN
    -- List of columns that might be storing JSON arrays
    DECLARE 
        array_columns TEXT[] := ARRAY['attachments_data', 'certification_questions', 'parts_data'];
        column_name TEXT;
    BEGIN
        FOREACH column_name IN ARRAY array_columns
        LOOP
            IF EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'jobs' 
                AND column_name = column_name
            ) THEN
                -- Convert column to JSONB if it exists
                EXECUTE format('ALTER TABLE public.jobs ALTER COLUMN %I TYPE JSONB USING %I::JSONB', 
                               column_name, column_name);
                RAISE NOTICE 'Changed % column to JSONB type', column_name;
            END IF;
        END LOOP;
    END;
END $$;

-- Return the current state of the safety_requirements column
SELECT 
    column_name, 
    data_type, 
    udt_name
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'jobs'
    AND column_name = 'safety_requirements';

-- Show success message
SELECT 'Safety requirements column has been fixed to properly handle arrays as JSON data.' AS message; 