/**
 * Test script to verify the structure of the jobs table in Supabase
 * 
 * Run with: node test_jobs_table.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Using Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

// Define required columns for jobs table
const requiredColumns = [
  { name: 'id', type: 'uuid' },
  { name: 'created_at', type: 'timestamp with time zone' },
  { name: 'updated_at', type: 'timestamp with time zone' },
  { name: 'title', type: 'text' },
  { name: 'status', type: 'text' },
  { name: 'job_number', type: 'text' },
  { name: 'location_number', type: 'text' },
  { name: 'revision', type: 'integer' },
  { name: 'user_id', type: 'uuid' },
  { name: 'form_data', type: 'jsonb' },
  { name: 'customer', type: 'jsonb' },
  { name: 'location', type: 'jsonb' },
  { name: 'current_tab', type: 'text' }
];

// Function to check if a table exists
async function checkTableExists(tableName) {
  try {
    // Test if we can query the table
    const { error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist (code PGRST116: Relation does not exist)
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking table existence:', error);
    return false;
  }
}

// Function to get column information from a sample record
async function getColumnInfoFromSample(tableName) {
  try {
    // Fetch a sample record or create one
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error fetching sample record:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No records found. Cannot determine column structure from data.');
      return [];
    }
    
    // Extract column names from the record
    const sampleRecord = data[0];
    return Object.keys(sampleRecord).map(colName => ({
      column_name: colName,
      data_type: typeof sampleRecord[colName] === 'object' ? 'jsonb' : typeof sampleRecord[colName]
    }));
    
  } catch (error) {
    console.error('Error getting column info from sample:', error);
    return [];
  }
}

// Function to create the example SQL to fix the jobs table
function getFixJobsTableSQL() {
  return `
-- Fix the jobs table and RLS policies
-- Run this in the Supabase SQL Editor

-- First, drop all existing policies to clean up
DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.jobs;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.jobs;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.jobs;

-- Temporarily disable RLS to check table structure
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;

-- Check table structure and create if not exists
DO $$
BEGIN
  -- Check for missing columns and add them if needed
  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'status') THEN
    ALTER TABLE public.jobs ADD COLUMN status text DEFAULT 'draft';
    RAISE NOTICE 'Added missing column: status';
  END IF;
  
  -- form_data
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'form_data') THEN
    ALTER TABLE public.jobs ADD COLUMN form_data jsonb DEFAULT '{}';
    RAISE NOTICE 'Added missing column: form_data';
  END IF;
  
  -- customer
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'customer') THEN
    ALTER TABLE public.jobs ADD COLUMN customer jsonb DEFAULT '{}';
    RAISE NOTICE 'Added missing column: customer';
  END IF;
  
  -- location
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'location') THEN
    ALTER TABLE public.jobs ADD COLUMN location jsonb DEFAULT '{}';
    RAISE NOTICE 'Added missing column: location';
  END IF;
  
  -- current_tab
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'current_tab') THEN
    ALTER TABLE public.jobs ADD COLUMN current_tab text DEFAULT 'info';
    RAISE NOTICE 'Added missing column: current_tab';
  END IF;
  
  -- user_id (if missing)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'user_id') THEN
    ALTER TABLE public.jobs ADD COLUMN user_id uuid;
    RAISE NOTICE 'Added missing column: user_id';
  END IF;
END $$;

-- Re-enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create simple, effective policies
-- Allow anyone to read any job
CREATE POLICY "Enable read access for all users" 
  ON public.jobs FOR SELECT 
  USING (true);

-- Allow authenticated users to insert their own jobs
CREATE POLICY "Enable insert for authenticated users only" 
  ON public.jobs FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Allow users to update their own jobs
CREATE POLICY "Enable update for users based on user_id" 
  ON public.jobs FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own jobs
CREATE POLICY "Enable delete for owners" 
  ON public.jobs FOR DELETE 
  USING (auth.uid() = user_id);

-- Grant privileges to roles
GRANT ALL ON public.jobs TO postgres, service_role;
GRANT SELECT ON public.jobs TO anon;
GRANT ALL ON public.jobs TO authenticated;

-- Check policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies
WHERE tablename = 'jobs';`;
}

// Main function
async function verifyJobsTable() {
  console.log('Verifying jobs table in Supabase...');
  
  try {
    // Check if table exists
    const tableExists = await checkTableExists('jobs');
    
    if (!tableExists) {
      console.log('The jobs table does not exist.');
      console.log('You need to run the SQL to create the jobs table. See fix_jobs_table.sql');
      return;
    }
    
    console.log('The jobs table exists. Checking structure...');
    
    // Try to get a count of records
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error accessing the jobs table:', countError);
      
      if (countError.message.includes('infinite recursion detected in policy')) {
        console.log('\nThere appears to be an issue with the Row Level Security policies.');
        console.log('Please run the SQL in fix_jobs_table.sql to fix the policies:');
        console.log(getFixJobsTableSQL());
      }
      
      return;
    }
    
    console.log(`The jobs table contains ${count} records.`);
    
    // Get column info if possible
    const columns = await getColumnInfoFromSample('jobs');
    
    if (columns.length > 0) {
      console.log(`\nColumn information from the sample record:`);
      columns.forEach(col => console.log(`- ${col.column_name}: ${col.data_type}`));
      
      // Check for missing columns
      const missingColumns = requiredColumns.filter(
        required => !columns.some(col => col.column_name === required.name)
      );
      
      if (missingColumns.length > 0) {
        console.log(`\nPossibly missing ${missingColumns.length} required columns:`);
        missingColumns.forEach(col => console.log(`- ${col.name} (${col.type})`));
      } else {
        console.log('\nAll required columns appear to exist in the jobs table.');
      }
    }
    
    // Try to get a sample record
    const { data: sampleData, error: sampleError } = await supabase
      .from('jobs')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error fetching sample data:', sampleError);
    } else if (sampleData && sampleData.length > 0) {
      console.log('\nSample job record:');
      const sample = sampleData[0];
      console.log(JSON.stringify({
        id: sample.id,
        title: sample.title,
        status: sample.status,
        job_number: sample.job_number,
        user_id: sample.user_id,
        // Show only property names for complex objects
        form_data: sample.form_data ? Object.keys(sample.form_data) : null,
        customer: sample.customer ? Object.keys(sample.customer) : null,
        location: sample.location ? Object.keys(sample.location) : null,
        current_tab: sample.current_tab
      }, null, 2));
    } else {
      console.log('\nNo sample data available in the jobs table.');
    }
    
    console.log('\nVerification complete.');
    
  } catch (error) {
    console.error('Error verifying jobs table:', error);
  }
}

// Run the verification
verifyJobsTable(); 