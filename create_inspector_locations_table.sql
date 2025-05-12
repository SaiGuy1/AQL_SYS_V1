-- Script to implement inspector/supervisor location assignments and job RLS policies
-- This script will:
-- 1. Create inspector_locations and supervisor_locations tables
-- 2. Add supervisor_ids to the jobs table
-- 3. Set up proper RLS policies for jobs
-- 4. Create functions to easily retrieve inspectors/supervisors by location

-- Check if inspector_locations table exists; if not, create it
CREATE TABLE IF NOT EXISTS public.inspector_locations (
  inspector_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (inspector_id, location_id)
);

-- Create supervisor_locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.supervisor_locations (
  supervisor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (supervisor_id, location_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inspector_locations_inspector_id ON public.inspector_locations(inspector_id);
CREATE INDEX IF NOT EXISTS idx_inspector_locations_location_id ON public.inspector_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_locations_supervisor_id ON public.supervisor_locations(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_locations_location_id ON public.supervisor_locations(location_id);

-- Add RLS to inspector_locations table
ALTER TABLE public.inspector_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage inspector_locations" ON public.inspector_locations;
DROP POLICY IF EXISTS "Managers can manage inspector_locations" ON public.inspector_locations;
DROP POLICY IF EXISTS "Users can view their own location assignments" ON public.inspector_locations;

-- Create policies for inspector_locations table
-- Admins can do everything
CREATE POLICY "Admins can manage inspector_locations" 
ON public.inspector_locations
USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin'
);

-- Managers can do everything
CREATE POLICY "Managers can manage inspector_locations" 
ON public.inspector_locations
USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'manager'
);

-- Inspectors can view their own assignments
CREATE POLICY "Users can view their own location assignments" 
ON public.inspector_locations
FOR SELECT
USING (
    inspector_id = auth.uid()
);

-- Add RLS to supervisor_locations table
ALTER TABLE public.supervisor_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage supervisor_locations" ON public.supervisor_locations;
DROP POLICY IF EXISTS "Managers can manage supervisor_locations" ON public.supervisor_locations;
DROP POLICY IF EXISTS "Users can view their own supervisor assignments" ON public.supervisor_locations;

-- Create policies for supervisor_locations table
-- Admins can do everything
CREATE POLICY "Admins can manage supervisor_locations" 
ON public.supervisor_locations
USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin'
);

-- Managers can do everything
CREATE POLICY "Managers can manage supervisor_locations" 
ON public.supervisor_locations
USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'manager'
);

-- Supervisors can view their own assignments
CREATE POLICY "Users can view their own supervisor assignments" 
ON public.supervisor_locations
FOR SELECT
USING (
    supervisor_id = auth.uid()
);

-- Add supervisor_ids to jobs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'jobs' 
        AND column_name = 'supervisor_ids'
    ) THEN
        ALTER TABLE public.jobs ADD COLUMN supervisor_ids UUID[] DEFAULT '{}';
    END IF;
END $$;

-- Update RLS policies for jobs table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Managers can manage all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Supervisors can view and edit jobs at their locations" ON public.jobs;
DROP POLICY IF EXISTS "Inspectors can view and edit assigned jobs" ON public.jobs;

-- Create new RLS policies for jobs
-- Admins can do everything with all jobs
CREATE POLICY "Admins can manage all jobs" 
ON public.jobs
USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin'
);

-- Managers can do everything with all jobs
CREATE POLICY "Managers can manage all jobs" 
ON public.jobs
USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'manager'
);

-- Supervisors can view and edit jobs at their locations
CREATE POLICY "Supervisors can view and edit jobs at their locations" 
ON public.jobs
USING (
    -- Check if the user is a supervisor
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'supervisor'
    AND (
        -- Check if supervisor is directly assigned to the job
        auth.uid() = ANY(supervisor_ids)
        OR
        -- Check if supervisor is assigned to the job's location
        EXISTS (
            SELECT 1 FROM public.supervisor_locations sl
            WHERE sl.supervisor_id = auth.uid()
            AND sl.location_id = jobs.location_id
        )
    )
);

-- Inspectors can view and edit assigned jobs
CREATE POLICY "Inspectors can view and edit assigned jobs" 
ON public.jobs
USING (
    -- Check if the user is an inspector
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'inspector'
    AND (
        -- Check if inspector is directly assigned to the job
        auth.uid() = ANY(inspector_ids)
        OR
        -- For legacy support - check assignedTo field if it exists
        (jobs.assignedTo IS NOT NULL AND jobs.assignedTo::text LIKE '%' || auth.uid() || '%')
    )
);

-- Create function to get inspectors by location
CREATE OR REPLACE FUNCTION public.get_inspectors_by_location(location_id_param UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT,
    role user_role,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.email, 
        p.name, 
        p.role, 
        p.is_available
    FROM 
        public.profiles p
    JOIN 
        public.inspector_locations il ON p.id = il.inspector_id
    WHERE 
        il.location_id = location_id_param
        AND p.role = 'inspector' 
        AND p.is_available = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get supervisors by location
CREATE OR REPLACE FUNCTION public.get_supervisors_by_location(location_id_param UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT,
    role user_role,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.email, 
        p.name, 
        p.role, 
        p.is_available
    FROM 
        public.profiles p
    JOIN 
        public.supervisor_locations sl ON p.id = sl.supervisor_id
    WHERE 
        sl.location_id = location_id_param
        AND p.role = 'supervisor' 
        AND p.is_available = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helper function to assign inspector to location
CREATE OR REPLACE FUNCTION public.assign_inspector_to_location(inspector_id_param UUID, location_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN;
BEGIN
    -- Check if inspector exists and has inspector role
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = inspector_id_param 
        AND role = 'inspector'
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Insert or ignore if exists
    INSERT INTO public.inspector_locations (inspector_id, location_id)
    VALUES (inspector_id_param, location_id_param)
    ON CONFLICT (inspector_id, location_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helper function to assign supervisor to location
CREATE OR REPLACE FUNCTION public.assign_supervisor_to_location(supervisor_id_param UUID, location_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN;
BEGIN
    -- Check if supervisor exists and has supervisor role
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = supervisor_id_param 
        AND role = 'supervisor'
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Insert or ignore if exists
    INSERT INTO public.supervisor_locations (supervisor_id, location_id)
    VALUES (supervisor_id_param, location_id_param)
    ON CONFLICT (supervisor_id, location_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Final notices
DO $$
BEGIN
    RAISE NOTICE 'Inspector and Supervisor location tables and RLS policies created successfully!';
    RAISE NOTICE 'Jobs table updated with supervisor_ids column if needed.';
    RAISE NOTICE 'Helper functions for assignment and retrieval are now available.';
END $$; 