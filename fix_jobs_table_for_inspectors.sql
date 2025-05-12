-- SQL Script to fix jobs table structure for inspector assignment

-- 1. Add inspector_id and inspector columns to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS inspector_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS inspector TEXT,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- 2. Create index for faster lookups by inspector_id
CREATE INDEX IF NOT EXISTS idx_jobs_inspector_id ON public.jobs(inspector_id);

-- 3. Update existing RLS policy or create new one for inspectors to view assigned jobs
CREATE POLICY IF NOT EXISTS "Inspectors can view assigned jobs"
ON public.jobs
FOR SELECT
USING (
  auth.uid() = inspector_id 
  OR 
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'manager'))
);

-- 4. Ensure profiles table has the required columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id),
ADD COLUMN IF NOT EXISTS isAvailable BOOLEAN DEFAULT true;

-- 5. Create notification trigger for job assignments (if notifications table exists)
DO $$ 
BEGIN
  -- Check if notifications table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    -- Create the notification function
    CREATE OR REPLACE FUNCTION public.notify_inspector_assigned()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.notifications (user_id, message, type, job_id, read, data)
      VALUES (
        NEW.inspector_id, 
        'You have been assigned to a new job', 
        'job_assignment', 
        NEW.id, 
        false,
        jsonb_build_object('job_title', NEW.title, 'job_id', NEW.id)
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create the trigger if it doesn't exist
    DROP TRIGGER IF EXISTS inspector_assignment_notification ON public.jobs;
    CREATE TRIGGER inspector_assignment_notification
    AFTER UPDATE OF inspector_id ON public.jobs
    FOR EACH ROW
    WHEN (OLD.inspector_id IS DISTINCT FROM NEW.inspector_id AND NEW.inspector_id IS NOT NULL)
    EXECUTE FUNCTION public.notify_inspector_assigned();
  
    RAISE NOTICE 'Notification trigger created successfully';
  ELSE
    RAISE NOTICE 'Notifications table does not exist, skipping trigger creation';
  END IF;
END $$; 