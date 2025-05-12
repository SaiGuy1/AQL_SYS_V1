-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON jobs;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON jobs;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON jobs;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON jobs;

-- Update jobs table structure
ALTER TABLE jobs
  -- Drop old columns
  DROP COLUMN IF EXISTS inspector_id,
  DROP COLUMN IF EXISTS assignedTo,
  DROP COLUMN IF EXISTS status_old;

-- Add new columns if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'inspector_ids') THEN
    ALTER TABLE jobs ADD COLUMN inspector_ids UUID[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'supervisor_ids') THEN
    ALTER TABLE jobs ADD COLUMN supervisor_ids UUID[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'status') THEN
    ALTER TABLE jobs ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Add check constraint for status values
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
  CHECK (status IN ('assigned', 'in-progress', 'completed', 'pending', 'scheduled', 'cancelled'));

-- Create new RLS policies
CREATE POLICY "Enable read access for authenticated users" ON jobs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for job inspectors" ON jobs
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = ANY(inspector_ids) OR
    auth.uid() = ANY(supervisor_ids) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    auth.uid() = ANY(inspector_ids) OR
    auth.uid() = ANY(supervisor_ids) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Enable delete for admins and managers" ON jobs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Create function to validate job status updates
CREATE OR REPLACE FUNCTION validate_job_status_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow specific status transitions
  IF OLD.status = 'pending' AND NEW.status NOT IN ('assigned', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status transition from pending';
  END IF;
  
  IF OLD.status = 'assigned' AND NEW.status NOT IN ('in-progress', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status transition from assigned';
  END IF;
  
  IF OLD.status = 'in-progress' AND NEW.status NOT IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status transition from in-progress';
  END IF;
  
  IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    RAISE EXCEPTION 'Cannot change status of completed job';
  END IF;
  
  IF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
    RAISE EXCEPTION 'Cannot change status of cancelled job';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for job status validation
DROP TRIGGER IF EXISTS validate_job_status ON jobs;
CREATE TRIGGER validate_job_status
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION validate_job_status_update(); 