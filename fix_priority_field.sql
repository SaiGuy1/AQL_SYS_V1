-- Script to fix the priority field in the jobs table
-- Run this in the Supabase SQL Editor

-- First, check if job_priority enum exists
DO $$ 
BEGIN
    -- Check if job_priority enum exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_priority') THEN
        -- Option 1: Add 'Medium' to the job_priority enum if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_priority')
            AND enumlabel = 'Medium'
        ) THEN
            -- Add 'Medium' to the enum
            ALTER TYPE job_priority ADD VALUE 'Medium';
            RAISE NOTICE 'Added "Medium" to job_priority enum';
        ELSE
            RAISE NOTICE 'Value "Medium" already exists in job_priority enum';
        END IF;
        
        -- Also add other common priority values if they don't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_priority')
            AND enumlabel = 'High'
        ) THEN
            ALTER TYPE job_priority ADD VALUE 'High';
            RAISE NOTICE 'Added "High" to job_priority enum';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_priority')
            AND enumlabel = 'Low'
        ) THEN
            ALTER TYPE job_priority ADD VALUE 'Low';
            RAISE NOTICE 'Added "Low" to job_priority enum';
        END IF;
    ELSE
        -- Option 2: If we don't have an enum, check if priority column exists and its type
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'jobs' 
            AND column_name = 'priority'
        ) THEN
            -- Get the data type
            PERFORM data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'jobs' 
            AND column_name = 'priority';
            
            -- Convert priority field to text if it's currently an enum
            -- This will accept any value instead of being restricted
            ALTER TABLE public.jobs ALTER COLUMN priority TYPE text;
            RAISE NOTICE 'Changed priority column to text type';
        ELSE
            -- If priority column doesn't exist yet, create it as text
            ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS priority text;
            RAISE NOTICE 'Added priority column as text type';
        END IF;
    END IF;
END $$;

-- Return the current state of the priority column
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

-- Show success message
SELECT 'Priority field has been fixed. You can now use "Medium", "High", and "Low" as priority values.' AS message; 