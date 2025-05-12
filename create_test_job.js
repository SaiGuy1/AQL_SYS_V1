/**
 * Test script to create a job record in the Supabase jobs table
 * 
 * Run with: node create_test_job.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

// Create a Supabase client with the admin key to bypass RLS policies
const supabase = createClient(supabaseUrl, supabaseKey);

// Create a simple test job
async function createTestJob() {
  try {
    console.log('Creating a test job record...');
    
    const testJob = {
      title: 'Test Job ' + new Date().toISOString().split('T')[0],
      status: 'draft',
      job_number: 'TEST-' + Math.floor(Math.random() * 10000),
      location_number: 'LOC-TEST',
      revision: 0,
      // Don't set user_id since we don't have one in this test
      form_data: JSON.stringify({
        test: true,
        sample: 'data',
        created_at: new Date().toISOString()
      }),
      customer: JSON.stringify({
        name: 'Test Customer',
        contact: 'John Doe'
      }),
      location: JSON.stringify({
        id: '51458442-097f-4438-a4b8-077d24ae9185',
        name: 'Romulus MI'
      }),
      current_tab: 'info'
    };
    
    console.log('Job data:', testJob);
    
    // Insert the job using insert API
    const { data, error } = await supabase
      .from('jobs')
      .insert(testJob)
      .select();
    
    if (error) {
      console.error('Error inserting job:', error);
      
      // Try a simpler job without complex fields
      console.log('\nTrying with a simpler job object...');
      const simpleJob = {
        title: 'Simple Test Job',
        status: 'draft',
        job_number: 'SIMPLE-' + Math.floor(Math.random() * 10000)
      };
      
      const { data: simpleData, error: simpleError } = await supabase
        .from('jobs')
        .insert(simpleJob)
        .select();
      
      if (simpleError) {
        console.error('Error inserting simple job:', simpleError);
        
        // Suggest SQL for direct insertion
        console.log('\nYou may need to run this SQL in the Supabase SQL Editor:');
        console.log(`
INSERT INTO public.jobs (title, status, job_number)
VALUES ('Test Job', 'draft', 'TEST-${Math.floor(Math.random() * 10000)}');
        `);
        
        return null;
      } else {
        console.log('Simple job created successfully:', simpleData);
        return simpleData[0];
      }
    } else {
      console.log('Job created successfully:', data);
      return data[0];
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
}

// Read all jobs in the table
async function readAllJobs() {
  try {
    console.log('\nReading all jobs from the table...');
    
    const { data, error, count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('Error reading jobs:', error);
      return;
    }
    
    console.log(`Found ${data.length} jobs in the table.`);
    
    if (data.length > 0) {
      // Display a summary of each job
      data.forEach((job, index) => {
        console.log(`\nJob ${index + 1}:`);
        console.log(`  ID: ${job.id}`);
        console.log(`  Title: ${job.title}`);
        console.log(`  Status: ${job.status}`);
        console.log(`  Job Number: ${job.job_number}`);
        
        // Try to parse form_data if it exists and is a string
        if (job.form_data) {
          try {
            const formData = typeof job.form_data === 'string' ? 
              JSON.parse(job.form_data) : job.form_data;
            console.log(`  Form Data: ${typeof formData === 'object' ? 'Object with keys: ' + Object.keys(formData).join(', ') : 'Invalid format'}`);
          } catch (error) {
            console.log(`  Form Data: ${typeof job.form_data} (Error parsing: ${error.message})`);
          }
        }
      });
    }
  } catch (error) {
    console.error('Unexpected error during read:', error);
  }
}

// Run the test
async function runTest() {
  console.log('Starting job creation test...');
  
  // First create a test job
  const createdJob = await createTestJob();
  
  // Then read all jobs to verify
  if (createdJob) {
    await readAllJobs();
  }
  
  console.log('\nTest completed.');
}

runTest(); 