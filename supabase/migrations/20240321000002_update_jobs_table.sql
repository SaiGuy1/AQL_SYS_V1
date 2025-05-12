-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON jobs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON jobs;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON jobs;
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

CREATE POLICY "Enable update for job owners and admins" ON jobs
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Enable delete for job owners and admins" ON jobs
  FOR DELETE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS jobs_user_id_idx ON jobs(user_id);
CREATE INDEX IF NOT EXISTS jobs_location_id_idx ON jobs(location_id);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);
CREATE INDEX IF NOT EXISTS jobs_inspector_ids_idx ON jobs USING GIN (inspector_ids);
CREATE INDEX IF NOT EXISTS jobs_supervisor_ids_idx ON jobs USING GIN (supervisor_ids); 