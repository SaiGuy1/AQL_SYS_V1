-- Script to add location_id column to jobs table if it doesn't exist

-- Add location_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'location_id'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN location_id uuid;
    RAISE NOTICE 'Added location_id column to jobs table';
  ELSE
    RAISE NOTICE 'location_id column already exists in jobs table';
  END IF;
END $$; 