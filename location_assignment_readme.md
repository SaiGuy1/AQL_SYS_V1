# Location-Based Inspector and Supervisor Assignment

This document explains how to use the location-based inspector and supervisor assignment system in the AQL application. The system ensures that jobs are assigned to the appropriate personnel based on their location assignments and controls access to job data through Row Level Security (RLS) policies.

## Table of Contents
1. [Backend Setup](#backend-setup)
2. [Database Tables and Relationships](#database-tables-and-relationships)
3. [Administrator Tools: SQL Functions](#administrator-tools-sql-functions)
4. [Job Creation UI: Inspector and Supervisor Selection](#job-creation-ui-inspector-and-supervisor-selection)
5. [RLS Policies for Job Access Control](#rls-policies-for-job-access-control)
6. [Troubleshooting](#troubleshooting)

## Backend Setup

To set up the backend for location-based assignment, run the following SQL scripts in your Supabase SQL Editor:

1. `create_inspector_locations_table.sql` - Creates the essential tables and functions
2. `location_assignment_manager.sql` - Adds administrator management functions

These scripts will create:
- `inspector_locations` and `supervisor_locations` tables
- RLS policies for these tables
- Helper functions for retrieving and managing location assignments
- RPC functions for the frontend to use

## Database Tables and Relationships

### Core Tables

1. **profiles**
   - Contains user information including role (admin, manager, supervisor, inspector)
   - Primary user identity table

2. **locations**
   - Contains all facility/job locations
   - Referenced by jobs and assignment tables

3. **inspector_locations**
   - Join table connecting inspectors to locations
   - Many-to-many relationship (inspectors can be assigned to multiple locations)

4. **supervisor_locations**
   - Join table connecting supervisors to locations
   - Many-to-many relationship (supervisors can be assigned to multiple locations)

5. **jobs**
   - Contains job details
   - References location_id
   - Contains inspector_ids[] and supervisor_ids[] arrays for direct assignment

### Key Relationships

```
profiles (role='inspector') ←→ inspector_locations ←→ locations
profiles (role='supervisor') ←→ supervisor_locations ←→ locations
locations ←→ jobs
```

## Administrator Tools: SQL Functions

The `location_assignment_manager.sql` script provides several useful functions for administrators to manage inspector and supervisor location assignments:

### Viewing Functions

1. **List all inspector assignments**
   ```sql
   SELECT * FROM list_inspector_assignments();
   ```

2. **List all supervisor assignments**
   ```sql
   SELECT * FROM list_supervisor_assignments();
   ```

3. **List available (unassigned) inspectors**
   ```sql
   SELECT * FROM list_available_inspectors();
   ```

4. **List available (unassigned) supervisors**
   ```sql
   SELECT * FROM list_available_supervisors();
   ```

5. **List locations with assignment counts**
   ```sql
   SELECT * FROM list_locations_with_assignment_counts();
   ```

### Assignment Functions

1. **Assign a single inspector to a location**
   ```sql
   SELECT assign_inspector_to_location('inspector-uuid', 'location-uuid');
   ```

2. **Assign multiple inspectors to a location**
   ```sql
   SELECT * FROM bulk_assign_inspectors_to_location(
     ARRAY['inspector-uuid-1', 'inspector-uuid-2'], 
     'location-uuid'
   );
   ```

3. **Assign a single supervisor to a location**
   ```sql
   SELECT assign_supervisor_to_location('supervisor-uuid', 'location-uuid');
   ```

4. **Assign multiple supervisors to a location**
   ```sql
   SELECT * FROM bulk_assign_supervisors_to_location(
     ARRAY['supervisor-uuid-1', 'supervisor-uuid-2'], 
     'location-uuid'
   );
   ```

### Removal Functions

1. **Remove an inspector from a location**
   ```sql
   SELECT remove_inspector_from_location('inspector-uuid', 'location-uuid');
   ```

2. **Remove a supervisor from a location**
   ```sql
   SELECT remove_supervisor_from_location('supervisor-uuid', 'location-uuid');
   ```

## Job Creation UI: Inspector and Supervisor Selection

During job creation, the system now provides location-based inspector and supervisor selection in the `JobCreationForm` component.

### Process Flow

1. User selects a location in the Location tab
2. System automatically fetches inspectors and supervisors assigned to that location using RPC functions
3. User selects which inspectors and supervisors to assign to the job
4. Selected personnel IDs are stored in inspector_ids[] and supervisor_ids[] arrays in the job record

### UI Elements

The inspector/supervisor selection UI includes:
- Loading indicators while fetching personnel
- Checkboxes for selecting multiple inspectors and supervisors
- Badges showing selected personnel
- Warning messages if no personnel are available for a location

### RPC Functions Used

- `get_inspectors_by_location(location_id)` - Returns inspectors assigned to the location
- `get_supervisors_by_location(location_id)` - Returns supervisors assigned to the location

## RLS Policies for Job Access Control

The system uses Row Level Security (RLS) policies to control access to jobs:

### Job Access Policies

1. **Admin Access**
   - Admins can see and manage all jobs

2. **Manager Access**
   - Managers can see and manage all jobs

3. **Supervisor Access**
   - Can view jobs where:
     - They are directly assigned (auth.uid() = ANY(supervisor_ids))
     - OR the job is at a location they supervise (via the supervisor_locations table)

4. **Inspector Access**
   - Can view jobs where:
     - They are directly assigned (auth.uid() = ANY(inspector_ids))
     - OR they are referenced in the legacy assignedTo field

### Policy Implementation

The RLS policies use JWT claims (stored in user metadata) for role-based checks, making them more efficient and avoiding recursion issues:

```sql
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
```

## Troubleshooting

### Common Issues and Solutions

1. **Inspectors/supervisors not appearing in selection list**
   - Check they have the correct role ('inspector' or 'supervisor')
   - Verify they are assigned to the selected location
   - Use `list_inspector_assignments()` to confirm assignments

2. **Personnel seeing incorrect jobs**
   - Verify job has correct location_id
   - Check inspector_ids[] and supervisor_ids[] arrays
   - Confirm personnel have correct location assignments
   - Verify personnel have the correct user role

3. **RPC functions not working**
   - Check for PSQL errors in browser console
   - Ensure the RPC functions exist and are properly defined
   - Verify that profile roles are set correctly

For additional assistance, contact the system administrator who can directly query the database tables and verify assignments. 