# AQL Job Creation and Assignment: Validation & Access Control

This document provides an overview of field-level validation, inspector assignment logic, location-based access control, notification flow, and error handling for the AQL platform.

## 1. Job Creation: Field-Level Validation Rules

### Required Fields

The following fields are required for job creation:

| Field | Validation Rule | Error Message |
|-------|----------------|---------------|
| Job Title / Contract Number | At least one must be provided | "Job title or contract number is required" |
| Customer Name | Must be provided | "Customer name is required" |
| Location | Valid location_id must be selected | "A valid location must be selected" |
| Part Numbers | At least one part number must be specified | "At least one part number is required" |
| Safety Requirements | At least one safety requirement must be checked | "At least one safety requirement must be selected" |
| Inspector(s) | At least one inspector must be assigned | "At least one inspector must be assigned" |
| Job Type | Must be specified | "Job type is required" |
| Quoted Hours | Must be provided | "Quoted hours are required" |
| Start Date | Must be provided | "Start date is required" |

### Validation Implementation

The validation occurs at three levels:

1. **Frontend Form Validation**: Using the `ValidationUtils.tsx` component with field-level error indicators and a validation summary.
2. **Submission Validation**: In the `handleSubmit` function of `JobCreationForm.tsx`.
3. **Backend Validation**: In the `createJob` function of `aqlService.ts`.

### Code References

- `src/components/aql/ValidationUtils.tsx` - Central validation utilities
- `src/components/aql/JobCreationForm.tsx` - Form handling and UI validation
- `src/services/aqlService.ts` - Backend validation in the `createJob` function

## 2. Inspector Assignment: Logic and Schema

### Database Schema

The database has been updated to support multiple inspectors per job:

```sql
-- Add inspector_ids array column to the jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS inspector_ids TEXT[] DEFAULT '{}';

-- Migrate existing single inspector_id data to the new array format
UPDATE public.jobs
SET inspector_ids = ARRAY[inspector_id]
WHERE inspector_id IS NOT NULL 
AND (inspector_ids IS NULL OR array_length(inspector_ids, 1) IS NULL);
```

### Assignment Logic

1. **Single Inspector Backward Compatibility**: 
   - `inspector_id`, `inspector`, and `assignedTo` fields are maintained for backward compatibility
   - These fields contain the primary inspector (first in the list)

2. **Multiple Inspector Support**:
   - Primary data structure is now the `inspector_ids` array
   - UI supports selecting multiple inspectors via checkboxes
   - All selected inspectors receive notifications

### Code References

- `src/components/aql/jobs/dialogs/StaffAssignmentDialog.tsx` - Multi-inspector selection UI
- `src/services/aqlService.ts` - `assignInspectors` function manages multiple assignments
- `src/scripts/update_jobs_for_multiple_inspectors.sql` - Database schema update

## 3. Location-Based Access Control: Filtering and Enforcement

### RLS Policies

Row Level Security (RLS) policies enforce location-based access control at the database level:

```sql
CREATE POLICY "Inspectors can view jobs assigned to them" 
ON public.jobs FOR SELECT 
USING (
  auth.uid()::text = ANY(inspector_ids)
  OR inspector_id::text = auth.uid()::text
  OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'manager'))
);
```

### Location Binding Logic

1. **Location-Inspector Association**:
   - Inspectors are assigned to locations via the `location_id` field in their profile
   - The `StaffAssignmentDialog` shows a warning when assigning inspectors to jobs at different locations

2. **Access Control Implementation**:
   - Backend: RLS policies filter data based on user role and location
   - Frontend: UI components like `JobList`, `JobDetails`, etc. respect these filters

### Code References

- `src/scripts/simplified_rls_policies.sql` - RLS policies for location-based filtering
- `src/components/aql/jobs/JobTable.tsx` - Location-aware job listing
- `src/pages/InspectorView.tsx` - Inspector-specific job filtering

## 4. Notification Flow: Job Assignment

### Notification Process

When inspectors are assigned to a job, the following process occurs:

1. **Create Notification Records**:
   - A notification record is created for each assigned inspector
   - Primary inspectors receive a "primary" assignment type
   - Secondary inspectors receive a "secondary" assignment type

2. **Notification Content**:
   - Each notification includes the job ID
   - The message contains job title and relevant details
   - Notifications are stored in the `notifications` table with `read=false`

### Code References

- `src/services/aqlService.ts` - Notification creation in `assignInspectors` function
- Database tables: `notifications` with a schema that includes `user_id`, `job_id`, `message`, and `read` status

## 5. Error Handling UX: Validation Summary Pattern

### Validation UX Approach

The form validation implements a user-friendly approach:

1. **Field-Level Error Messages**:
   - Each field displays its specific error message directly beneath it
   - Visual indicators (red text and error icons) highlight problematic fields

2. **Validation Summary**:
   - When multiple errors exist, a validation summary appears at the top of the form
   - Lists all errors in one place for easy reference
   - Helps users identify what needs to be fixed before proceeding

### Code References

- `src/components/aql/ValidationUtils.tsx`:
  - `ValidationSummary` component for displaying multiple errors
  - `FieldError` component for field-level error messages
  - `validateJobForm` function for centralized validation logic

## Conclusion

This validation and access control system ensures that:

1. All jobs contain the required information as specified in the SOW
2. Multiple inspectors can be assigned to jobs as needed
3. Location-based access control is enforced at both the database and UI levels
4. Inspectors are notified of job assignments
5. Users receive clear feedback about validation errors

These improvements align the system with the requirements specified in the Statement of Work (SOW) and improve the overall user experience. 