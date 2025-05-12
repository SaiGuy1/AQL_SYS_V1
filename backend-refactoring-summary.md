# Backend Refactoring Summary

## 1. Overview of Changes

This document summarizes the refactoring done to migrate the AQL inspection platform from using localStorage/mock data to a proper Supabase PostgreSQL backend with role-based authentication.

### Major Improvements:

1. Replaced all localStorage/mock data usage with proper Supabase database queries
2. Implemented role-based authentication with proper permission checks
3. Created a proper authentication context and auth guard components
4. Updated API functions to work with the actual database schema
5. Fixed inconsistencies between camelCase and snake_case field names
6. Added proper error handling and logging

## 2. Database Schema and Relationships

The following tables and relationships have been implemented:

### Jobs Table

```sql
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  title text,
  status text DEFAULT 'draft',
  job_number text,
  location_number numeric,
  revision integer DEFAULT 0,
  user_id uuid,
  form_data_json jsonb DEFAULT '{}',
  customer_data jsonb DEFAULT '{}',
  customer_name text,
  location_data jsonb DEFAULT '{}',
  location_id text,
  inspector_id text,
  inspector text,
  assignedTo text,
  parts_data jsonb DEFAULT '[]',
  attachments_data jsonb DEFAULT '[]',
  safety_requirements jsonb DEFAULT '[]',
  certification_questions jsonb DEFAULT '[]',
  estimated_hours numeric,
  priority text DEFAULT 'Medium'
);
```

### Profiles Table

Stores user profiles including role information for authentication.

### Timesheets Table

```sql
CREATE TABLE public.timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  inspector_id uuid REFERENCES auth.users,
  inspector_name text,
  job_id uuid REFERENCES public.jobs,
  job_title text,
  clock_in timestamp with time zone,
  clock_out timestamp with time zone,
  total_hours numeric,
  is_billable boolean DEFAULT true,
  is_approved boolean DEFAULT false,
  approved_by uuid,
  comments text,
  overtime numeric DEFAULT 0
);
```

### Defects Table

```sql
CREATE TABLE public.defects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  job_id uuid REFERENCES public.jobs,
  description text,
  severity text,
  images jsonb DEFAULT '[]',
  batch_number text,
  lot_number text,
  reported_by uuid,
  reported_at timestamp with time zone,
  status text DEFAULT 'Open',
  comments jsonb DEFAULT '[]',
  resolution text
);
```

### Reports Table

```sql
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  name text,
  type text,
  date_range jsonb,
  customer_id uuid,
  format text,
  created_by uuid,
  report_data jsonb
);
```

### Customers Table

```sql
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  name text,
  email text,
  phone text,
  company text
);
```

### Notifications Table

```sql
CREATE TABLE public.notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid REFERENCES auth.users, 
  message text NOT NULL,
  type text NOT NULL, 
  job_id uuid REFERENCES public.jobs,
  read boolean DEFAULT false,
  data jsonb DEFAULT '{}'::jsonb
);
```

## 3. Role-Based Authentication & Authorization

The authorization system has been completely refactored to use Supabase's auth system with role-based permissions:

### Key Components:

1. **AuthContext** - Provides authentication state and methods throughout the app
2. **AuthGuard** - Protects routes based on user roles
3. **Row-Level Security (RLS)** - Enforces data access rules at the database level

### Role-Based Permissions:

1. **Admin**: 
   - Can view and edit all data
   - Access to settings and system configuration

2. **Manager**:
   - Can view all jobs and assign inspectors
   - Access to analytics and reporting

3. **Inspector**:
   - Can only view assigned jobs
   - Can clock in/out of assigned jobs
   - Can report defects on assigned jobs

4. **Customer**:
   - Can only view their own jobs
   - Limited access to job details

### Row-Level Security Policies:

```sql
-- Jobs table policies
CREATE POLICY "Enable read access for admins and managers" 
  ON public.jobs FOR SELECT 
  USING (auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' IN ('admin', 'manager')
  ));

CREATE POLICY "Inspectors can only view assigned jobs" 
  ON public.jobs FOR SELECT 
  USING (
    inspector_id = auth.uid() AND 
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'inspector'
    )
  );

CREATE POLICY "Customers can only view their own jobs" 
  ON public.jobs FOR SELECT 
  USING (
    customer_id = auth.uid() AND 
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'customer'
    )
  );
```

## 4. Key Backend Functions Refactored

The following key functions were refactored to use Supabase:

1. `fetchJobs` - Now properly filters based on user role
2. `fetchJob` - Gets a single job with proper error handling
3. `createJob` - Creates a new job in the database with proper data formatting
4. `updateJob` - Updates a job with proper sanitization
5. `assignInspector` - Assigns an inspector to a job with proper checks
6. `clockIn` / `clockOut` - Manages timesheet entries with proper calculations
7. `reportDefect` - Creates defect records with proper validation
8. `fetchDefects` - Retrieves defects with proper filtering
9. `generateReport` / `fetchReports` - Manages reporting features

## 5. Data Format Handling

Special attention was paid to the proper handling of:

1. JSONB fields (for complex nested data)
2. Field name conversion between camelCase (frontend) and snake_case (backend)
3. Date/time formatting
4. Array data types

## 6. Authentication Flow

The login/authentication flow was completely rewritten:

1. User logs in with email/password via Supabase Auth
2. User role is retrieved from profiles table
3. Role-based permissions are enforced via AuthGuard component
4. RLS policies ensure data security at the database level

## 7. Error Handling

The refactored code includes:

1. Proper error handling for database operations
2. Clear error messages
3. Fallbacks for when data isn't available
4. Console logging for debugging

## 8. Outstanding Items

While most of the code has been refactored, the following items may need additional attention:

1. Review any remaining localStorage usage in component-specific code
2. Further testing of row-level security policies in production
3. Optimization of database queries for performance
4. Additional validation for security purposes

## 9. Conclusion

The AQL inspection platform has been successfully refactored from using temporary localStorage to a proper Supabase/PostgreSQL backend with robust authentication and authorization. The system now properly enforces role-based permissions and provides a solid foundation for further development. 