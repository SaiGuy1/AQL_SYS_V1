-- Ensure the inspector_locations join table exists
-- This table associates inspectors with locations they can work at

-- Ensure the random UUID extension is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the inspector_locations join table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.inspector_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspector_id UUID REFERENCES public.profiles(id),
  location_id UUID REFERENCES public.locations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inspector_id, location_id)
);

-- Add indexes for faster lookup
CREATE INDEX IF NOT EXISTS inspector_locations_inspector_id_idx ON public.inspector_locations(inspector_id);
CREATE INDEX IF NOT EXISTS inspector_locations_location_id_idx ON public.inspector_locations(location_id);

-- Set up RLS policies for inspector_locations table
ALTER TABLE public.inspector_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies for inspector_locations
-- Admins and managers can view and manage all assignments
CREATE POLICY "Admins and managers can do all on inspector_locations"
  ON public.inspector_locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Allow service role operations for signup flow
CREATE POLICY "Service role can manage inspector_locations"
  ON public.inspector_locations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Inspectors can only view their own assignments
CREATE POLICY "Inspectors can view their own assignments"
  ON public.inspector_locations
  FOR SELECT
  TO authenticated
  USING (
    inspector_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  ); 