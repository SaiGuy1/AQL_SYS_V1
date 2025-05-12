-- Script to create a proper job draft record for testing the job creation flow

-- First, check the job_status enum values to confirm available status options
SELECT 
  pg_type.typname AS enum_name,
  pg_enum.enumlabel AS enum_value
FROM 
  pg_type 
  JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
WHERE 
  pg_type.typname = 'job_status'
ORDER BY 
  pg_enum.enumsortorder;

-- Then check if any sample user exists to use as owner
SELECT id FROM auth.users LIMIT 1;

-- If no user exists in above query, we'll use a placeholder UUID
-- In real scenario, replace NULL with actual user_id from auth.users

-- Create a complete job draft record with all necessary fields
INSERT INTO public.jobs (
  title,
  status,
  job_number,
  location_number,
  revision,
  user_id,
  form_data,
  customer,
  location,
  current_tab,
  created_at,
  updated_at
)
VALUES (
  'Draft Job for Testing',
  -- Try different approaches for status, depending on the schema:
  'draft',  -- Option 1: Try as text if column type is text
  -- 'draft'::job_status,  -- Option 2: Uncomment if column type is enum
  -- (SELECT enumlabel::job_status FROM pg_enum WHERE enumlabel = 'draft' LIMIT 1),  -- Option 3: Dynamic lookup
  
  'TEST-DRAFT-' || floor(random() * 10000)::text,
  '42',  -- location_number as text
  0,     -- revision starts at 0
  NULL,  -- user_id (replace with actual UUID if available)
  
  -- Form data with realistic job creation information
  jsonb_build_object(
    'description', 'This is a test draft job for QA purposes',
    'part_number', 'P12345',
    'dimensions', jsonb_build_object(
      'width', 10,
      'height', 20,
      'depth', 5
    ),
    'materials', jsonb_build_array('Steel', 'Aluminum', 'Plastic'),
    'notes', 'Created for testing the job creation flow'
  ),
  
  -- Customer information
  jsonb_build_object(
    'name', 'Acme Manufacturing',
    'contact', 'John Smith',
    'email', 'john.smith@acme.example',
    'phone', '555-123-4567'
  ),
  
  -- Location information (using an actual location ID from the locations table)
  jsonb_build_object(
    'id', '51458442-097f-4438-a4b8-077d24ae9185',
    'name', 'Romulus MI'
  ),
  
  -- Current tab (starting point in the workflow)
  'info',
  
  -- Timestamps (recent)
  now() - interval '30 minutes',
  now() - interval '5 minutes'
)
RETURNING *;

-- Confirm it was created
SELECT 
  id, 
  title, 
  status, 
  job_number, 
  created_at,
  current_tab
FROM 
  public.jobs
WHERE 
  title = 'Draft Job for Testing'
ORDER BY 
  created_at DESC
LIMIT 1; 