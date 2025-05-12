// Using CommonJS syntax
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get environment variables for Supabase connection
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables not set.');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to create job_counter table
async function createJobCounterTable() {
  console.log('\n=== SETTING UP JOB COUNTER TABLE ===');
  console.log('Connecting to Supabase...');
  
  try {
    // Check if we can connect to Supabase
    const { error: connectionError } = await supabase.from('jobs').select('count', { count: 'exact', head: true });
    
    if (connectionError) {
      console.error('Error connecting to Supabase:', connectionError.message);
      process.exit(1);
    }
    
    console.log('Successfully connected to Supabase');
    
    // Check if job_counter table exists
    console.log('1. Checking if job_counter table exists...');
    
    // Try to query the job_counter table
    const { error: tableCheckError } = await supabase
      .from('job_counter')
      .select('count', { count: 'exact', head: true });
    
    // If there's no error, the table exists
    if (!tableCheckError) {
      console.log('✓ The job_counter table already exists.');
      
      // Check if it has the right schema
      const { data: schemaData, error: schemaError } = await supabase
        .from('job_counter')
        .select('*')
        .limit(1);
        
      if (schemaError) {
        console.error('Error checking job_counter schema:', schemaError.message);
      } else {
        const hasRequiredFields = schemaData && 
                                 (schemaData.length === 0 || 
                                  (schemaData.length > 0 && 
                                   'location_number' in schemaData[0] && 
                                   'next_sequence' in schemaData[0]));
        
        if (!hasRequiredFields) {
          console.log('\n⚠️ The job_counter table exists but has an incorrect schema.');
          console.log('Please update the schema manually through the Supabase dashboard.');
          console.log('Required fields: location_number (integer, primary key), next_sequence (integer, default: 1)');
        } else {
          console.log('✓ The job_counter table has the correct schema.');
        }
      }
      
      // Get current entries
      const { data: counterData, error: fetchError } = await supabase
        .from('job_counter')
        .select('*')
        .order('location_number', { ascending: true });
        
      if (fetchError) {
        console.error('Error fetching job_counter entries:', fetchError.message);
      } else {
        console.log(`\nCurrent job_counter entries: ${counterData.length}`);
        if (counterData.length > 0) {
          console.log('Existing counters:');
          counterData.forEach(counter => {
            console.log(`- Location ${counter.location_number}: next_sequence = ${counter.next_sequence}`);
          });
        }
      }
      
    } else {
      // The table doesn't exist, so we'll tell the user how to create it
      console.log('⚠️ The job_counter table does not exist.');
      console.log('\nTo create the job_counter table, please run the following SQL in the Supabase SQL Editor:');
      console.log(`
-- Create job_counter table
CREATE TABLE IF NOT EXISTS job_counter (
  location_number INTEGER PRIMARY KEY,
  next_sequence INTEGER NOT NULL DEFAULT 1
);

-- Add RLS Policy
ALTER TABLE job_counter ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Authenticated users can read job_counter" ON job_counter
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to insert/update
CREATE POLICY "Service role can insert job_counter" ON job_counter
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Service role can update job_counter" ON job_counter
  FOR UPDATE USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
      `);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the main function
createJobCounterTable().then(() => {
  console.log('\nScript completed.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 