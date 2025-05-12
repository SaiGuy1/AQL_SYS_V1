-- Comprehensive SQL script to add ALL potentially needed columns for job creation
-- Run this in the Supabase SQL Editor

-- Standard table columns
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS user_id uuid;

-- Identifiers
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS job_number text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS location_number numeric;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS revision integer DEFAULT 0;

-- Complex objects stored as JSON
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS attachments_data jsonb DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS safety_requirements jsonb DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS parts_data jsonb DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS certification_questions jsonb DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS customer_data jsonb DEFAULT '{}';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS location_data jsonb DEFAULT '{}';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS form_data jsonb DEFAULT '{}';

-- Text fields
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS defect_guidelines text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS instructions text;

-- Assignment fields
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS inspector_id text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS inspector text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS assignedTo text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS location_id text;

-- Metadata
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS estimated_hours numeric DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_batch_job boolean DEFAULT false;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS current_tab text DEFAULT 'info';

-- Migration: Rename any existing camelCase columns to snake_case
DO $$ 
BEGIN
    -- Check if estimatedHours exists and convert it to estimated_hours
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'jobs' 
               AND column_name = 'estimatedHours') THEN
        
        -- First, add the new column if it doesn't exist
        ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS estimated_hours numeric DEFAULT 0;
        
        -- Copy data from old column to new column
        UPDATE public.jobs 
        SET estimated_hours = "estimatedHours"
        WHERE "estimatedHours" IS NOT NULL;
        
        -- Drop the old column (optional, might keep for backward compatibility)
        -- ALTER TABLE public.jobs DROP COLUMN "estimatedHours";
        
        RAISE NOTICE 'Migrated data from estimatedHours to estimated_hours';
    END IF;
END $$;

-- Inform about success
SELECT 'Jobs table columns have been updated. Please restart your application server.' AS message;

-- Note: This script only adds missing columns and does not modify RLS policies
-- If you're having policy-related issues, handle them separately 