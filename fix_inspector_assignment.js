// fix_inspector_assignment.js
// A script to fix inspector assignment functionality by adding necessary columns to the jobs table
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Get environment variables from multiple possible sources
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Error: Supabase URL not found in environment variables');
  process.exit(1);
}

// Try to use the service key for elevated permissions if available
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseKey) {
  console.error('Error: No Supabase key found in environment variables');
  process.exit(1);
}

console.log('Using URL:', supabaseUrl);
console.log('Using key type:', supabaseServiceKey ? 'SERVICE KEY' : 'ANON KEY');

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate SQL for table modifications to be run manually
async function generateJobsTableSQL() {
  console.log('=== JOBS TABLE MODIFICATION SQL ===');
  console.log('Copy and run the following SQL in your Supabase SQL Editor:');
  console.log('');
  
  console.log(`-- Add inspector_id and inspector columns to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS inspector_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS inspector TEXT,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- Create index for faster lookups by inspector_id
CREATE INDEX IF NOT EXISTS idx_jobs_inspector_id ON public.jobs(inspector_id);

-- Update existing RLS policy or create new one for inspectors to view assigned jobs
CREATE POLICY IF NOT EXISTS "Inspectors can view assigned jobs"
ON public.jobs
FOR SELECT
USING (
  auth.uid() = inspector_id 
  OR 
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'manager'))
);

-- Create notification trigger for job assignments
CREATE OR REPLACE FUNCTION public.notify_inspector_assigned()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, message, type, job_id, read, data)
  VALUES (
    NEW.inspector_id, 
    'You have been assigned to a new job', 
    'job_assignment', 
    NEW.id, 
    false,
    jsonb_build_object('job_title', NEW.title, 'job_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS inspector_assignment_notification ON public.jobs;
CREATE TRIGGER inspector_assignment_notification
AFTER UPDATE OF inspector_id ON public.jobs
FOR EACH ROW
WHEN (OLD.inspector_id IS DISTINCT FROM NEW.inspector_id AND NEW.inspector_id IS NOT NULL)
EXECUTE FUNCTION public.notify_inspector_assigned();
`);

  console.log('');
  console.log('=== END SQL ===');
}

// Function to test if a sample profile exists that can be used for testing
async function findTestableInspector() {
  console.log('\n=== FINDING TESTABLE INSPECTOR ===');
  
  try {
    // Try to find an existing inspector in the profiles table
    const { data: inspectors, error: inspectorError } = await supabase
      .from('profiles')
      .select('id, name, email, role, location_id')
      .eq('role', 'inspector')
      .limit(1);
      
    if (inspectorError) {
      console.log('Error fetching inspectors:', inspectorError.message);
      return null;
    }
    
    if (inspectors && inspectors.length > 0) {
      console.log('Found existing inspector for testing:');
      console.log(`  - ID: ${inspectors[0].id}`);
      console.log(`  - Name: ${inspectors[0].name || 'N/A'}`);
      console.log(`  - Location: ${inspectors[0].location_id || 'N/A'}`);
      return inspectors[0];
    }
    
    // If no inspector found, try to find a user that could be used
    console.log('No inspector found in profiles table');
    
    // Try to access auth users if we have service role
    try {
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (!usersError && users && users.users && users.users.length > 0) {
        console.log('Found user that could be made an inspector:');
        console.log(`  - ID: ${users.users[0].id}`);
        console.log(`  - Email: ${users.users[0].email}`);
        return { id: users.users[0].id, name: users.users[0].email, fromAuth: true };
      }
    } catch (e) {
      console.log('Could not access auth users');
    }
    
    console.log('Could not find any testable inspector or user');
    return null;
  } catch (e) {
    console.log('Error finding testable inspector:', e.message);
    return null;
  }
}

// Generate JavaScript code for the SignupInspector component to ensure it works properly
function generateSignupInspectorFix() {
  console.log('\n=== SIGNUP INSPECTOR COMPONENT FIX ===');
  console.log('Make sure your SignupInspector component contains the following code when creating a profile:');
  console.log('');
  
  console.log(`// In your SignupInspector component, ensure the profile creation includes:
async function handleSignUp() {
  try {
    // 1. Create the user in auth
    const { data: authData, error: authError } = await supabase.auth
      .signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
    if (authError) throw authError;
    
    // 2. Create the profile entry with correct role and location
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: fullName,
        email: email,
        role: 'inspector', // Important: set the role correctly
        location_id: selectedLocation, // Link to location
        isAvailable: true, // Set default availability
      });
      
    if (profileError) throw profileError;
    
    // Success - continue with UI feedback
  } catch (error) {
    // Handle error
  }
}`);

  console.log('');
  console.log('=== END COMPONENT CODE ===');
}

// Generate test code for assigning an inspector to a job
function generateTestAssignmentCode(inspector) {
  if (!inspector) return;
  
  console.log('\n=== TEST ASSIGNMENT CODE ===');
  console.log('Here is code you can use to test assigning an inspector to a job:');
  console.log('');
  
  console.log(`// Test assigning inspector to job
async function testAssignInspector() {
  // 1. Get a job to assign
  const { data: jobs, error: jobError } = await supabase
    .from('jobs')
    .select('id, title')
    .limit(1);
    
  if (jobError) {
    console.error('Error fetching job:', jobError.message);
    return;
  }
  
  if (!jobs || jobs.length === 0) {
    console.log('No jobs found to assign');
    return;
  }
  
  const job = jobs[0];
  
  // 2. Assign inspector to job
  const { error: updateError } = await supabase
    .from('jobs')
    .update({ 
      inspector_id: '${inspector.id}', 
      inspector: '${inspector.name || 'Test Inspector'}',
      assigned_at: new Date().toISOString()
    })
    .eq('id', job.id);
    
  if (updateError) {
    console.error('Error assigning inspector:', updateError.message);
  } else {
    console.log('Successfully assigned inspector to job:', job.title);
  }
}

// Run the test
testAssignInspector();`);

  console.log('');
  console.log('=== END TEST CODE ===');
}

// Main function
async function main() {
  try {
    console.log('=== FIX INSPECTOR ASSIGNMENT ===\n');
    
    // Generate SQL to fix jobs table
    await generateJobsTableSQL();
    
    // Find testable inspector
    const inspector = await findTestableInspector();
    
    // Generate SignupInspector component fix
    generateSignupInspectorFix();
    
    // Generate test code
    if (inspector) {
      generateTestAssignmentCode(inspector);
    }
    
    console.log('\n=== END OF INSPECTOR ASSIGNMENT FIX ===');
    console.log('\nTo use these fixes:');
    console.log('1. Run the SQL commands in the Supabase SQL Editor');
    console.log('2. Verify your SignupInspector component follows the pattern shown');
    console.log('3. Test assigning an inspector to a job using the provided test code');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the main function
main(); 