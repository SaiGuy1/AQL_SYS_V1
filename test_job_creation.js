/**
 * Test script for job creation in Supabase
 * 
 * Run with: node test_job_creation.js
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

// Test job data
const testJob = {
  title: "Test Job Creation",
  status: "draft",
  job_number: "TEST-" + Math.floor(Math.random() * 10000),
  location_number: "LOC-1234",
  revision: 0,
  form_data: {
    description: "This is a test job",
    part_number: "P12345",
    dimensions: {
      width: 10,
      height: 20,
      depth: 5
    }
  },
  customer: {
    name: "Test Customer",
    contact: "John Doe",
    email: "john@example.com"
  },
  location: {
    id: "51458442-097f-4438-a4b8-077d24ae9185",
    name: "Romulus MI"
  },
  current_tab: "info"
};

// Function to sanitize job data for Supabase
function sanitizeJobForStorage(job) {
  // Clone the job to avoid modifying the original
  const sanitizedJob = { ...job };
  
  // Convert objects to JSON strings if they exist
  if (sanitizedJob.form_data) {
    sanitizedJob.form_data = typeof sanitizedJob.form_data === 'string' 
      ? sanitizedJob.form_data 
      : JSON.stringify(sanitizedJob.form_data);
  }
  
  if (sanitizedJob.customer) {
    sanitizedJob.customer = typeof sanitizedJob.customer === 'string' 
      ? sanitizedJob.customer 
      : JSON.stringify(sanitizedJob.customer);
  }
  
  if (sanitizedJob.location) {
    sanitizedJob.location = typeof sanitizedJob.location === 'string' 
      ? sanitizedJob.location 
      : JSON.stringify(sanitizedJob.location);
  }
  
  return sanitizedJob;
}

// Function to create a job draft
async function createJobDraft(jobData) {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found. Please login first.');
      return null;
    }
    
    console.log('Creating job with user ID:', user.id);
    
    // Add user_id to job data
    const jobWithUser = {
      ...jobData,
      user_id: user.id
    };
    
    // Sanitize the job data
    const sanitizedJob = sanitizeJobForStorage(jobWithUser);
    
    console.log('Sending sanitized job data:', sanitizedJob);
    
    // Insert the job data into Supabase
    const { data, error } = await supabase
      .from('jobs')
      .insert(sanitizedJob)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating job draft:', error);
      return null;
    }
    
    console.log('Job draft created successfully:', data);
    return data;
  } catch (error) {
    console.error('Unexpected error creating job draft:', error);
    return null;
  }
}

// Function to authenticate a test user
async function authenticateTestUser(email, password) {
  try {
    console.log('Authenticating test user...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Authentication error:', error);
      return false;
    }
    
    console.log('Authenticated as:', data.user.email);
    return true;
  } catch (error) {
    console.error('Unexpected authentication error:', error);
    return false;
  }
}

// Function to get all job drafts for the current user
async function getUserJobDrafts() {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return [];
    }
    
    // Fetch drafts created by this user
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'draft');
    
    if (error) {
      console.error('Error fetching job drafts:', error);
      return [];
    }
    
    // Reconstruct the drafts
    const reconstructedDrafts = data.map(draft => {
      try {
        // Parse JSON strings if they are stored as strings
        const reconstructed = { ...draft };
        
        if (reconstructed.form_data && typeof reconstructed.form_data === 'string') {
          reconstructed.form_data = JSON.parse(reconstructed.form_data);
        }
        
        if (reconstructed.customer && typeof reconstructed.customer === 'string') {
          reconstructed.customer = JSON.parse(reconstructed.customer);
        }
        
        if (reconstructed.location && typeof reconstructed.location === 'string') {
          reconstructed.location = JSON.parse(reconstructed.location);
        }
        
        return reconstructed;
      } catch (e) {
        console.error('Error reconstructing draft:', e);
        return draft;
      }
    });
    
    return reconstructedDrafts;
  } catch (error) {
    console.error('Unexpected error fetching job drafts:', error);
    return [];
  }
}

// Function to run all tests
async function runTests() {
  // You need to set these to actual credentials
  const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'password';
  
  console.log(`Starting test with user: ${testEmail}`);

  try {
    // Login
    const authenticated = await authenticateTestUser(testEmail, testPassword);
    if (!authenticated) {
      console.error('Failed to authenticate test user');
      return;
    }
    
    // Get existing drafts
    console.log('\nFetching existing job drafts...');
    const existingDrafts = await getUserJobDrafts();
    console.log(`Found ${existingDrafts.length} existing drafts`);
    
    if (existingDrafts.length > 0) {
      console.log('First draft:', {
        id: existingDrafts[0].id,
        title: existingDrafts[0].title,
        status: existingDrafts[0].status
      });
    }
    
    // Create a new job draft
    console.log('\nCreating a new job draft...');
    const createdJob = await createJobDraft(testJob);
    
    if (createdJob) {
      console.log('Successfully created job draft with ID:', createdJob.id);
      
      // Fetch again to confirm
      console.log('\nFetching updated job drafts list...');
      const updatedDrafts = await getUserJobDrafts();
      console.log(`Now have ${updatedDrafts.length} drafts`);
      
      // Find our newly created job
      const newJob = updatedDrafts.find(draft => draft.id === createdJob.id);
      if (newJob) {
        console.log('Newly created job details:', {
          id: newJob.id,
          title: newJob.title,
          job_number: newJob.job_number,
          form_data: newJob.form_data
        });
      }
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the tests
runTests(); 