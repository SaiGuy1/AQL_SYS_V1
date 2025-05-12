-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON jobs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON jobs;
DROP POLICY IF EXISTS "Enable update for users based on role" ON jobs;
DROP POLICY IF EXISTS "Enable delete for users based on role" ON jobs;

-- Drop existing table
DROP TABLE IF EXISTS jobs;

-- Create jobs table with exact schema matching JobCreationForm
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  job_number TEXT,
  location_id UUID REFERENCES locations(id),
  inspector_ids UUID[] DEFAULT '{}',
  supervisor_ids UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'assigned', 'in-progress', 'completed', 'cancelled')),
  form_data JSONB DEFAULT '{}'::jsonb,
  customer JSONB DEFAULT '{}'::jsonb,
  location JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create access policies
CREATE POLICY "Enable read access for all authenticated users" ON jobs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON jobs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for job owners and admins" ON jobs
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Create indexes for better performance
CREATE INDEX jobs_user_id_idx ON jobs(user_id);
CREATE INDEX jobs_location_id_idx ON jobs(location_id);
CREATE INDEX jobs_status_idx ON jobs(status);
CREATE INDEX jobs_inspector_ids_idx ON jobs USING GIN (inspector_ids);
CREATE INDEX jobs_supervisor_ids_idx ON jobs USING GIN (supervisor_ids);

-- Grant necessary permissions
GRANT ALL ON jobs TO authenticated;
GRANT ALL ON jobs TO service_role;

-- Create or update inspector_locations table
CREATE TABLE IF NOT EXISTS inspector_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inspector_id UUID REFERENCES profiles(id) NOT NULL,
  location_id UUID REFERENCES locations(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(inspector_id, location_id)
);

-- Enable RLS on inspector_locations
ALTER TABLE inspector_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for inspector_locations
CREATE POLICY "Enable read access for all authenticated users" ON inspector_locations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for admins and managers" ON inspector_locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Create indexes for inspector_locations
CREATE INDEX inspector_locations_inspector_id_idx ON inspector_locations(inspector_id);
CREATE INDEX inspector_locations_location_id_idx ON inspector_locations(location_id);

-- Grant permissions for inspector_locations
GRANT ALL ON inspector_locations TO authenticated;
GRANT ALL ON inspector_locations TO service_role; 