-- Quick fix script for the estimatedHours column issue
-- Run this in the Supabase SQL Editor

-- Add the correct snake_case column if it doesn't exist
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS estimated_hours numeric DEFAULT 0;

-- If there's data in the camelCase column, migrate it to the snake_case column
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'jobs' 
               AND column_name = 'estimatedHours') THEN
        
        -- Copy data from old column to new column
        UPDATE public.jobs 
        SET estimated_hours = "estimatedHours"
        WHERE "estimatedHours" IS NOT NULL;
        
        RAISE NOTICE 'Migrated data from estimatedHours to estimated_hours';
    ELSE
        RAISE NOTICE 'No estimatedHours column found, only snake_case column exists';
    END IF;
END $$;

-- Confirm the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'jobs' 
AND column_name = 'estimated_hours'; 