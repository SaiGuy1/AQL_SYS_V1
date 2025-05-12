-- Quick fix for safety_requirements column
-- This script drops the problematic column and adds it back as JSONB
-- Run this in the Supabase SQL Editor if the other script fails

-- First backup any existing data
CREATE TEMP TABLE IF NOT EXISTS temp_safety_backup AS
SELECT id, safety_requirements::text AS safety_requirements_text
FROM public.jobs
WHERE safety_requirements IS NOT NULL;

-- Drop the problematic column
ALTER TABLE public.jobs DROP COLUMN IF EXISTS safety_requirements;

-- Add back as JSONB type
ALTER TABLE public.jobs ADD COLUMN safety_requirements JSONB;

-- Show results
SELECT 'safety_requirements column has been recreated as JSONB type' AS message;

-- Optional: Display backup data that would need to be manually restored
SELECT * FROM temp_safety_backup;

-- Note: After running this script, you'll need to recreate any safety requirements
-- data that was previously stored. The backup is temporary and will be lost
-- when your SQL session ends. 