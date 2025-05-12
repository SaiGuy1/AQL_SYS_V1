-- Location Assignment Manager Script
-- This script provides functions to help administrators manage location assignments
-- for inspectors and supervisors more efficiently.

-- Create a function to list all inspectors with their current location assignments
CREATE OR REPLACE FUNCTION public.list_inspector_assignments()
RETURNS TABLE (
    inspector_id UUID,
    inspector_name TEXT,
    inspector_email TEXT,
    location_id UUID,
    location_name TEXT,
    location_address TEXT,
    assigned_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS inspector_id,
        p.name AS inspector_name,
        p.email AS inspector_email,
        l.id AS location_id,
        l.name AS location_name,
        l.address AS location_address,
        il.assigned_date
    FROM 
        public.profiles p
    JOIN 
        public.inspector_locations il ON p.id = il.inspector_id
    JOIN 
        public.locations l ON il.location_id = l.id
    WHERE 
        p.role = 'inspector'
    ORDER BY 
        p.name, l.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to list all supervisors with their current location assignments
CREATE OR REPLACE FUNCTION public.list_supervisor_assignments()
RETURNS TABLE (
    supervisor_id UUID,
    supervisor_name TEXT,
    supervisor_email TEXT,
    location_id UUID,
    location_name TEXT,
    location_address TEXT,
    assigned_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS supervisor_id,
        p.name AS supervisor_name,
        p.email AS supervisor_email,
        l.id AS location_id,
        l.name AS location_name,
        l.address AS location_address,
        sl.assigned_date
    FROM 
        public.profiles p
    JOIN 
        public.supervisor_locations sl ON p.id = sl.supervisor_id
    JOIN 
        public.locations l ON sl.location_id = l.id
    WHERE 
        p.role = 'supervisor'
    ORDER BY 
        p.name, l.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to list all available inspectors (not assigned to any location)
CREATE OR REPLACE FUNCTION public.list_available_inspectors()
RETURNS TABLE (
    inspector_id UUID,
    inspector_name TEXT,
    inspector_email TEXT,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS inspector_id,
        p.name AS inspector_name,
        p.email AS inspector_email,
        p.is_available
    FROM 
        public.profiles p
    WHERE 
        p.role = 'inspector'
        AND p.id NOT IN (
            SELECT DISTINCT inspector_id 
            FROM public.inspector_locations
        )
    ORDER BY 
        p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to list all available supervisors (not assigned to any location)
CREATE OR REPLACE FUNCTION public.list_available_supervisors()
RETURNS TABLE (
    supervisor_id UUID,
    supervisor_name TEXT,
    supervisor_email TEXT,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS supervisor_id,
        p.name AS supervisor_name,
        p.email AS supervisor_email,
        p.is_available
    FROM 
        public.profiles p
    WHERE 
        p.role = 'supervisor'
        AND p.id NOT IN (
            SELECT DISTINCT supervisor_id 
            FROM public.supervisor_locations
        )
    ORDER BY 
        p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to list all locations with counts of assigned inspectors and supervisors
CREATE OR REPLACE FUNCTION public.list_locations_with_assignment_counts()
RETURNS TABLE (
    location_id UUID,
    location_name TEXT,
    location_address TEXT,
    inspector_count INTEGER,
    supervisor_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id AS location_id,
        l.name AS location_name,
        l.address AS location_address,
        COALESCE(i.inspector_count, 0) AS inspector_count,
        COALESCE(s.supervisor_count, 0) AS supervisor_count
    FROM 
        public.locations l
    LEFT JOIN (
        SELECT 
            location_id, 
            COUNT(*) AS inspector_count
        FROM 
            public.inspector_locations
        GROUP BY 
            location_id
    ) i ON l.id = i.location_id
    LEFT JOIN (
        SELECT 
            location_id, 
            COUNT(*) AS supervisor_count
        FROM 
            public.supervisor_locations
        GROUP BY 
            location_id
    ) s ON l.id = s.location_id
    ORDER BY 
        l.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk assignment function for inspectors
CREATE OR REPLACE FUNCTION public.bulk_assign_inspectors_to_location(
    inspector_ids UUID[],
    location_id_param UUID
)
RETURNS TABLE (
    inspector_id UUID,
    success BOOLEAN
) AS $$
DECLARE
    inspector_id UUID;
    success_result BOOLEAN;
    result_row RECORD;
BEGIN
    CREATE TEMP TABLE temp_results (
        inspector_id UUID,
        success BOOLEAN
    ) ON COMMIT DROP;
    
    -- Process each inspector
    FOREACH inspector_id IN ARRAY inspector_ids LOOP
        -- Use our existing assignment function
        SELECT public.assign_inspector_to_location(inspector_id, location_id_param) INTO success_result;
        
        -- Store result
        INSERT INTO temp_results (inspector_id, success)
        VALUES (inspector_id, success_result);
    END LOOP;
    
    -- Return results
    RETURN QUERY SELECT * FROM temp_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk assignment function for supervisors
CREATE OR REPLACE FUNCTION public.bulk_assign_supervisors_to_location(
    supervisor_ids UUID[],
    location_id_param UUID
)
RETURNS TABLE (
    supervisor_id UUID,
    success BOOLEAN
) AS $$
DECLARE
    supervisor_id UUID;
    success_result BOOLEAN;
    result_row RECORD;
BEGIN
    CREATE TEMP TABLE temp_results (
        supervisor_id UUID,
        success BOOLEAN
    ) ON COMMIT DROP;
    
    -- Process each supervisor
    FOREACH supervisor_id IN ARRAY supervisor_ids LOOP
        -- Use our existing assignment function
        SELECT public.assign_supervisor_to_location(supervisor_id, location_id_param) INTO success_result;
        
        -- Store result
        INSERT INTO temp_results (supervisor_id, success)
        VALUES (supervisor_id, success_result);
    END LOOP;
    
    -- Return results
    RETURN QUERY SELECT * FROM temp_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove inspector from a location
CREATE OR REPLACE FUNCTION public.remove_inspector_from_location(
    inspector_id_param UUID,
    location_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    rows_deleted INTEGER;
BEGIN
    DELETE FROM public.inspector_locations
    WHERE inspector_id = inspector_id_param
    AND location_id = location_id_param
    RETURNING 1 INTO rows_deleted;
    
    -- Return true if a row was deleted
    RETURN rows_deleted IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove supervisor from a location
CREATE OR REPLACE FUNCTION public.remove_supervisor_from_location(
    supervisor_id_param UUID,
    location_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    rows_deleted INTEGER;
BEGIN
    DELETE FROM public.supervisor_locations
    WHERE supervisor_id = supervisor_id_param
    AND location_id = location_id_param
    RETURNING 1 INTO rows_deleted;
    
    -- Return true if a row was deleted
    RETURN rows_deleted IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Provide sample usage
DO $$
BEGIN
    RAISE NOTICE 'Location Assignment Manager Script has been installed';
    RAISE NOTICE 'Available functions:';
    RAISE NOTICE '- list_inspector_assignments() - List all inspectors with their location assignments';
    RAISE NOTICE '- list_supervisor_assignments() - List all supervisors with their location assignments';
    RAISE NOTICE '- list_available_inspectors() - List inspectors not assigned to any location';
    RAISE NOTICE '- list_available_supervisors() - List supervisors not assigned to any location';
    RAISE NOTICE '- list_locations_with_assignment_counts() - List all locations with counts of assigned personnel';
    RAISE NOTICE '- bulk_assign_inspectors_to_location(inspector_ids UUID[], location_id UUID) - Bulk assign inspectors';
    RAISE NOTICE '- bulk_assign_supervisors_to_location(supervisor_ids UUID[], location_id UUID) - Bulk assign supervisors';
    RAISE NOTICE '- remove_inspector_from_location(inspector_id UUID, location_id UUID) - Remove an inspector from a location';
    RAISE NOTICE '- remove_supervisor_from_location(supervisor_id UUID, location_id UUID) - Remove a supervisor from a location';
    RAISE NOTICE '';
    RAISE NOTICE 'Sample usage:';
    RAISE NOTICE 'SELECT * FROM list_locations_with_assignment_counts();';
    RAISE NOTICE 'SELECT * FROM list_available_inspectors();';
    RAISE NOTICE 'SELECT * FROM bulk_assign_inspectors_to_location(ARRAY[''inspector-uuid-1'', ''inspector-uuid-2''], ''location-uuid'');';
END;
$$; 