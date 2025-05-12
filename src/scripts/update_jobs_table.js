// Script to check and update the jobs table structure in Supabase
// to ensure all fields needed for job creation exist

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Using key:", supabaseKey ? "Key is set" : "No key found");

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to directly add the missing attachments_data column to the jobs table
async function updateJobsTable() {
  try {
    console.log('Attempting to update the jobs table...');
    
    // Try to select from the jobs table to check if it exists
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id')
      .limit(1);
    
    if (jobsError) {
      console.error('Error accessing jobs table:', jobsError);
      if (jobsError.code === '42P01') { // relation does not exist
        console.log('Jobs table does not exist. Creating it...');
        
        // Create the jobs table with all required columns
        const createJobsTableSQL = `
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
            estimatedHours numeric,
            priority text DEFAULT 'Medium'
          );
          
          -- Enable RLS
          ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY "Enable read access for all users" 
            ON public.jobs FOR SELECT USING (true);
          
          CREATE POLICY "Enable insert for authenticated users" 
            ON public.jobs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
          
          CREATE POLICY "Enable update for users based on user_id" 
            ON public.jobs FOR UPDATE USING (
              auth.uid() = user_id OR 
              auth.uid() IN (SELECT id FROM auth.users WHERE auth.uid() IS NOT NULL)
            );
        `;
        
        // Try to create the table using SQL
        try {
          // Some Supabase instances allow executing raw SQL with rpc
          const { error: createError } = await supabase.rpc('exec', { query: createJobsTableSQL });
          if (createError) {
            console.error('Error creating jobs table:', createError);
            console.log('You may need to create the table manually using the SQL editor in the Supabase dashboard.');
          } else {
            console.log('Jobs table created successfully');
          }
        } catch (sqlError) {
          console.error('Could not execute SQL via RPC:', sqlError);
          console.log('Please create the jobs table manually using the SQL editor in the Supabase dashboard.');
        }
      }
      return;
    }
    
    console.log('Jobs table exists. Adding or checking required columns...');
    
    // Try to directly modify the table to add the necessary columns
    // We'll focus on adding just the attachments_data column that's causing errors
    
    try {
      // Try to check if the attachments_data column exists
      const { data: testData, error: testError } = await supabase
        .from('jobs')
        .select('attachments_data')
        .limit(1);
      
      if (testError) {
        if (testError.message && testError.message.includes("column \"attachments_data\" does not exist")) {
          console.log('Adding missing attachments_data column...');
          
          // Try to add the missing column using rpc
          const addColumnSQL = `
            ALTER TABLE public.jobs 
            ADD COLUMN IF NOT EXISTS attachments_data jsonb DEFAULT '[]';
          `;
          
          try {
            const { error: alterError } = await supabase.rpc('exec', { query: addColumnSQL });
            
            if (alterError) {
              console.error('Error adding attachments_data column using RPC:', alterError);
              console.log('Please add the column manually using the SQL editor in the Supabase dashboard:');
              console.log(addColumnSQL);
            } else {
              console.log('Successfully added attachments_data column');
            }
          } catch (rpcError) {
            console.error('Could not execute SQL via RPC:', rpcError);
            console.log('Please execute this SQL manually in the Supabase dashboard:');
            console.log(addColumnSQL);
          }
        } else {
          console.error('Unexpected error when checking attachments_data column:', testError);
        }
      } else {
        console.log('attachments_data column already exists.');
      }
    } catch (columnError) {
      console.error('Error when checking for attachments_data column:', columnError);
    }
    
    // Check if other important columns exist and add them if needed
    const columnsToCheck = [
      { name: 'safety_requirements', type: 'jsonb', default: "'[]'" },
      { name: 'parts_data', type: 'jsonb', default: "'[]'" },
      { name: 'certification_questions', type: 'jsonb', default: "'[]'" },
      { name: 'customer_data', type: 'jsonb', default: "'{}'" },
      { name: 'location_data', type: 'jsonb', default: "'{}'" }
    ];
    
    for (const column of columnsToCheck) {
      try {
        // Try to access the column to check if it exists
        const { error: testError } = await supabase
          .from('jobs')
          .select(column.name)
          .limit(1);
        
        if (testError && testError.message && testError.message.includes(`column "${column.name}" does not exist`)) {
          console.log(`Adding missing ${column.name} column...`);
          
          const addColumnSQL = `
            ALTER TABLE public.jobs 
            ADD COLUMN IF NOT EXISTS ${column.name} ${column.type} DEFAULT ${column.default};
          `;
          
          try {
            const { error: alterError } = await supabase.rpc('exec', { query: addColumnSQL });
            
            if (alterError) {
              console.error(`Error adding ${column.name} column:`, alterError);
              console.log('Please add the column manually using the SQL editor in the Supabase dashboard:');
              console.log(addColumnSQL);
            } else {
              console.log(`Successfully added ${column.name} column`);
            }
          } catch (rpcError) {
            console.error('Could not execute SQL via RPC:', rpcError);
            console.log('Please execute this SQL manually in the Supabase dashboard:');
            console.log(addColumnSQL);
          }
        } else {
          console.log(`${column.name} column already exists or couldn't be verified.`);
        }
      } catch (columnError) {
        console.error(`Error when checking for ${column.name} column:`, columnError);
      }
    }
    
    console.log('\nJobs table update attempt completed.');
    console.log('If you still have issues, please manually run the following SQL in the Supabase dashboard:');
    console.log(`
      ALTER TABLE public.jobs 
      ADD COLUMN IF NOT EXISTS attachments_data jsonb DEFAULT '[]';
      
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
    `);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the update function
updateJobsTable()
  .then(() => {
    console.log('Script execution completed');
  })
  .catch(err => {
    console.error('Script execution failed:', err);
    process.exit(1);
  }); 