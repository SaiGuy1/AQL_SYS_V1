/**
 * Script to monitor the jobs table in Supabase for changes
 * 
 * Run with: node monitor_jobs.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to get current jobs
async function getCurrentJobs() {
  try {
    console.log('Fetching current jobs...');
    
    const { data, error, count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('Error fetching jobs:', error);
      return;
    }
    
    console.log(`Found ${data.length} jobs in the table.`);
    
    // Show job summaries
    data.forEach((job, index) => {
      console.log(`\nJob ${index + 1}:`);
      console.log(`  ID: ${job.id}`);
      console.log(`  Title: ${job.title || '[No title]'}`);
      console.log(`  Status: ${job.status || '[No status]'}`);
      console.log(`  Job Number: ${job.job_number || '[No job number]'}`);
      console.log(`  Created: ${new Date(job.created_at).toLocaleString()}`);
      
      // Display form_data keys if available
      if (job.form_data) {
        try {
          const formData = typeof job.form_data === 'string' ? 
            JSON.parse(job.form_data) : job.form_data;
          
          if (typeof formData === 'object') {
            console.log(`  Form Data: ${Object.keys(formData).join(', ')}`);
          } else {
            console.log(`  Form Data: [Invalid format: ${typeof formData}]`);
          }
        } catch (error) {
          console.log(`  Form Data: [Error parsing: ${error.message}]`);
        }
      } else {
        console.log('  Form Data: [None]');
      }
    });
    
    return data;
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Function to subscribe to changes
function subscribeToChanges() {
  console.log('\nSubscribing to changes in the jobs table...');
  console.log('(Press Ctrl+C to exit)');
  
  const subscription = supabase
    .channel('jobs-changes')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'jobs' 
    }, payload => {
      console.log('\n🔔 CHANGE DETECTED in jobs table:');
      console.log(`  Event: ${payload.eventType}`);
      console.log(`  Table: ${payload.table}`);
      
      if (payload.new) {
        console.log('\n  New Record:');
        console.log(`    ID: ${payload.new.id}`);
        console.log(`    Title: ${payload.new.title || '[No title]'}`);
        console.log(`    Status: ${payload.new.status || '[No status]'}`);
        console.log(`    Job Number: ${payload.new.job_number || '[No job number]'}`);
        console.log(`    Created: ${new Date(payload.new.created_at).toLocaleString()}`);
        
        // Try to parse form_data if it exists
        if (payload.new.form_data) {
          try {
            const formData = typeof payload.new.form_data === 'string' ?
              JSON.parse(payload.new.form_data) : payload.new.form_data;
            
            console.log('    Form Data:', typeof formData === 'object' ? 
              Object.keys(formData).join(', ') : '[Invalid format]');
          } catch (error) {
            console.log(`    Form Data: [Error parsing: ${error.message}]`);
          }
        }
      }
      
      if (payload.old && payload.old.id) {
        console.log(`  Old Record ID: ${payload.old.id}`);
      }
    })
    .subscribe();
  
  console.log('Subscription active. Waiting for changes...');
  
  // Keep the script running
  process.stdin.resume();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nUnsubscribing and exiting...');
    subscription.unsubscribe();
    setTimeout(() => process.exit(0), 500);
  });
}

// Main function
async function main() {
  console.log('Jobs Table Monitor Starting...');
  
  // First get current jobs
  await getCurrentJobs();
  
  // Then subscribe to changes
  subscribeToChanges();
}

// Run the main function
main(); 