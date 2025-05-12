-- SQL Script to update jobs table to support multiple inspectors
-- This script modifies the schema to support the SOW requirement of multiple inspectors per job

-- 1. First back up the existing inspector_id and inspector data
CREATE TABLE IF NOT EXISTS public.job_inspector_backup AS
SELECT id, inspector_id, inspector, assignedTo
FROM public.jobs
WHERE inspector_id IS NOT NULL;

-- 2. Add inspector_ids array column to the jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS inspector_ids TEXT[] DEFAULT '{}';

-- 3. Migrate existing single inspector_id data to the new array format
UPDATE public.jobs
SET inspector_ids = ARRAY[inspector_id]
WHERE inspector_id IS NOT NULL 
AND (inspector_ids IS NULL OR array_length(inspector_ids, 1) IS NULL);

-- 4. Add start_date and end_date columns which were missing from the schema
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS job_type TEXT,
ADD COLUMN IF NOT EXISTS quoted_hours NUMERIC,
ADD COLUMN IF NOT EXISTS revised_hours NUMERIC;

-- 5. Migrate estimated_hours to quoted_hours for existing jobs
UPDATE public.jobs
SET quoted_hours = estimated_hours
WHERE quoted_hours IS NULL AND estimated_hours IS NOT NULL;

-- 6. Create or update RLS policies for the inspector_ids array
DROP POLICY IF EXISTS "Inspectors can view jobs assigned to them" ON public.jobs;

CREATE POLICY "Inspectors can view jobs assigned to them" 
ON public.jobs FOR SELECT 
USING (
  auth.uid()::text = ANY(inspector_ids)
  OR inspector_id::text = auth.uid()::text
  OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'manager'))
);

-- 7. Update the notifications table with an inspectors array column for future notifications
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS inspector_ids TEXT[] DEFAULT '{}';

-- 8. Verification query to ensure no data was lost
SELECT 
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN inspector_id IS NOT NULL THEN 1 END) as jobs_with_inspector_id,
  COUNT(CASE WHEN array_length(inspector_ids, 1) > 0 THEN 1 END) as jobs_with_inspector_ids
FROM public.jobs; 