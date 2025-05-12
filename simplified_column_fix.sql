-- Simplified script to add only the missing columns
-- This avoids policy errors and focuses just on schema updates

-- Add JSON data columns for complex objects
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS attachments_data jsonb DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS safety_requirements jsonb DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS parts_data jsonb DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS certification_questions jsonb DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS customer_data jsonb DEFAULT '{}';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS location_data jsonb DEFAULT '{}';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS customer_name text;

-- Add text field columns
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS defect_guidelines text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS instructions text;

-- Add other required columns for job creation
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS inspector_id text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS inspector text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS assignedTo text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS estimatedHours numeric DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS location_id text;

-- Note: This script only adds missing columns and does not modify RLS policies
-- If you're having policy-related issues, handle them separately 