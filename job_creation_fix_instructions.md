# Job Creation Fix - Using Supabase Instead of localStorage

This document provides instructions to ensure jobs are properly created and saved in Supabase instead of falling back to localStorage.

## Changes Made

1. Updated `createJob` function in `src/services/aqlService.ts`:
   - Removed localStorage fallback mechanism
   - Added proper error handling
   - Enhanced user_id retrieval from Supabase Auth
   - Improved object reconstruction from JSON strings

2. Updated `handleSubmit` in `JobCreationForm.tsx`:
   - Added enhanced validation for required fields
   - Added user_id association with created jobs
   - Improved error handling with detailed error messages
   - Added additional debugging log statements

3. Added script to update jobs table schema:
   - Created `src/scripts/update_jobs_table.js` to check and add missing columns
   - Ensures all required fields like `inspector_id`, `location_id`, etc. exist
   - Updates RLS policies for proper access control

4. Created direct Supabase testing script:
   - Added `src/scripts/test_job_creation_supabase.js` to test job creation directly
   - Verifies that jobs are being properly saved to the database

## Updated Job Creation Fix Instructions

The job creation process is now encountering a new error related to the `certificationQuestions` column:

```
Error message: Could not find the 'certificationQuestions' column of 'jobs' in the schema cache
```

This is similar to the previous issue with the `attachments` column. We've updated the code to address both issues.

### Steps to Fix the Issue:

#### 1. Update the Database Schema

Run the updated SQL script in your Supabase dashboard:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query
4. Paste the contents of the `updated_fix_jobs_table.sql` file
5. Run the query to add all required columns

Here's the SQL you need to run:

```sql
-- Add JSON data columns for complex objects
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS attachments_data jsonb DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS safety_requirements jsonb DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS parts_data jsonb DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS certification_questions jsonb DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS customer_data jsonb DEFAULT '{}';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS location_data jsonb DEFAULT '{}';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS customer_name text;

-- Fix any issue with RLS policies
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.jobs;

-- Create a simpler policy that avoids recursion
CREATE POLICY "Enable update for all authenticated users" 
  ON public.jobs 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Add any other columns that might be missing but required
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS inspector_id text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS inspector text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS assignedTo text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS estimatedHours numeric DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS location_id text;
```

#### 2. Code Changes

We've updated the `sanitizeJobForStorage` function in `aqlService.ts` to:

1. Remove the `certificationQuestions` field after converting it to `certification_questions`
2. Remove the `parts` field after converting it to `parts_data`
3. Remove the `attachments` field after converting it to `attachments_data`
4. Add other fields to the removal list that might cause issues with Supabase

Here's what the updated function looks like:

```javascript
const sanitizeJobForStorage = (jobData: any): any => {
  // Clone the job to avoid modifying the original
  const sanitized = { ...jobData };
  
  // Convert complex nested objects to strings
  if (sanitized.customer && typeof sanitized.customer === 'object') {
    sanitized.customer_data = JSON.stringify(sanitized.customer);
    // Keep customer.name directly accessible for filtering
    sanitized.customer_name = sanitized.customer.name;
  }

  // Handle parts array
  if (Array.isArray(sanitized.parts)) {
    sanitized.parts_data = JSON.stringify(sanitized.parts);
    // Remove original parts field
    delete sanitized.parts;
  }
  
  // Handle attachments array
  if (Array.isArray(sanitized.attachments)) {
    // Filter out any problematic properties from attachments
    const cleanAttachments = sanitized.attachments.map(att => {
      const { _content, ...cleanAtt } = att;
      return cleanAtt;
    });
    sanitized.attachments_data = JSON.stringify(cleanAttachments);
    // Remove original attachments field
    delete sanitized.attachments;
  }
  
  // Handle certification questions
  if (Array.isArray(sanitized.certificationQuestions)) {
    sanitized.certification_questions = JSON.stringify(sanitized.certificationQuestions);
    // Remove original certificationQuestions field
    delete sanitized.certificationQuestions;
  }
  
  // Handle other complex objects...
  
  // Remove any properties that might cause issues
  const keysToRemove = ['form_data', 'createdAt', 'updatedAt', 'safetyRequirements', 'location'];
  keysToRemove.forEach(key => {
    if (key in sanitized) {
      delete sanitized[key];
    }
  });
  
  return sanitized;
};
```

#### 3. Test the Fix

After applying these changes:

1. Restart your development server
2. Try creating a job through the job creation form
3. Verify in the console that there are no errors
4. Check in Supabase that the job was created successfully

If you still encounter issues, check:
1. The browser console for specific error messages
2. The Network tab to see what data is being sent to Supabase
3. Confirm all the columns exist in your Supabase database

### Why This Works

The issue occurs because our JavaScript code uses camelCase property names (like `certificationQuestions`), but PostgreSQL columns typically use snake_case (`certification_questions`). Our `sanitizeJobForStorage` function converts between these formats, but we need to:

1. Convert camelCase JavaScript properties to snake_case column names
2. Remove the original camelCase properties to avoid errors
3. Make sure all necessary columns exist in the database

With these changes, the job creation process should work correctly.

## Fix for Job Creation Error: Missing Attachments Column

You're encountering the following error when trying to create a job:

```
Error message: Could not find the 'attachments' column of 'jobs' in the schema cache
```

This error occurs because the code is trying to save job data to an `attachments` column that doesn't exist in the database. The proper column name should be `attachments_data`.

### How to Fix the Issue

#### Step 1: Update the database schema

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of the `fix_jobs_table.sql` file that was created for you
5. Run the SQL query to add the missing columns and fix RLS policies

Alternatively, you can run these SQL statements directly:

```sql
-- Add attachments_data column
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS attachments_data jsonb DEFAULT '[]';

-- Add other important columns
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS safety_requirements jsonb DEFAULT '[]';

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS parts_data jsonb DEFAULT '[]';

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS certification_questions jsonb DEFAULT '[]';

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS customer_data jsonb DEFAULT '{}';

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS location_data jsonb DEFAULT '{}';

-- Fix any issue with RLS policies
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.jobs;

-- Create a simpler policy that avoids recursion
CREATE POLICY "Enable update for all authenticated users" 
  ON public.jobs 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);
```

#### Step 2: Verify your code changes are in place

The `sanitizeJobForStorage` function in `aqlService.ts` has been updated to:
1. Properly convert attachments to the `attachments_data` field
2. Remove the original `attachments` field to prevent errors
3. Add other necessary removals of fields that might cause issues with Supabase

After making these changes and running the SQL above, the job creation should work correctly.

### Testing the Fix

1. After applying the database changes, restart your development server
2. Try creating a job through the job creation form
3. Check the browser console for any remaining errors
4. Verify in Supabase that the job was properly created with attachments stored in the `attachments_data` column

If you continue to encounter issues, please check:
1. The Supabase dashboard to confirm the columns were added successfully
2. Make sure the code changes in `aqlService.ts` have been properly deployed
3. Look for any additional errors in the browser console that might point to other issues

## Testing the Fix

Follow these steps to verify the job creation process is correctly using Supabase:

### 1. Update the Jobs Table Schema

Run the following command to ensure your jobs table has all required columns:

```
npm run update-jobs-table
```

This will:
- Check if the jobs table exists and create it if needed
- Add any missing columns required for proper job storage
- Set up Row Level Security policies

### 2. Test Direct Job Creation in Supabase

Run the following command to test creating a job directly in Supabase:

```
npm run test-supabase-job
```

This will:
- Display any existing jobs in the database
- Create a test job directly in Supabase
- Verify the job was successfully created

### 3. Test the Full Application Flow

1. Start the application:
   ```
   npm run dev
   ```

2. Navigate to the job creation form in the application

3. Fill out the required fields:
   - Customer name
   - Location
   - Job details

4. Submit the form to create a job

5. Look for confirmation in the browser console:
   - You should see logs like "Successfully created job in Supabase"
   - You should NOT see "Falling back to localStorage"

6. Verify the job appears in the jobs list after creation

## Troubleshooting

If jobs still aren't being saved to Supabase:

1. Check browser console for errors during job creation

2. Verify Supabase credentials:
   ```
   npm run debug-database
   ```

3. Check RLS policies in Supabase dashboard:
   - Ensure the authenticated user can insert into the jobs table
   - Verify that the jobs table allows inserts with the current user's auth.uid()

4. Try running the test script with proper authentication:
   ```
   # First login through the app, then:
   npm run test-supabase-job
   ```

## Additional Information

- The fallback to localStorage has been completely removed
- All job creation now requires a valid Supabase connection
- Jobs created will be associated with the current authenticated user
- The application will show clear error messages if job creation fails 