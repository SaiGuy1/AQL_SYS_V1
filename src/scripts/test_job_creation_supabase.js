// Script to test job creation directly in Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample job data for testing
const testJob = {
  title: "Test Job Creation " + new Date().toISOString(),
  job_number: "TEST-" + Math.floor(Math.random() * 10000),
  location_number: 42,
  revision: 1,
  status: "pending",
  estimatedHours: 8,
  customer_data: JSON.stringify({
    name: "Test Customer",
    email: "test@example.com",
    phone: "123-456-7890",
    company: "Test Company",
    contact: "John Doe",
    address: "123 Test St",
    city: "Test City",
    state: "TS"
  }),
  customer_name: "Test Customer",
  location_data: JSON.stringify({
    latitude: 42.331427,
    longitude: -83.045754,
    address: "Detroit, MI 48226"
  }),
  location_id: "51458442-097f-4438-a4b8-077d24ae9185", // Use a valid location ID from your database
  parts_data: JSON.stringify([
    {
      partNumber: "P12345",
      partName: "Test Part",
      defectDescription: "Test defect description"
    }
  ]),
  safety_requirements: JSON.stringify(["Safety Glasses", "Steel Toe Boots"]),
  priority: "Medium",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Function to test job creation
async function testJobCreation() {
  console.log("Testing job creation in Supabase...");
  console.log("Job data:", testJob);
  
  try {
    // First check for any existing jobs
    const { data: existingJobs, error: existingError } = await supabase
      .from('jobs')
      .select('id, title, status, job_number, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (existingError) {
      console.error("Error fetching existing jobs:", existingError);
    } else {
      console.log("\nMost recent jobs in database:");
      if (existingJobs.length === 0) {
        console.log("No jobs found in database");
      } else {
        console.table(existingJobs);
      }
    }
    
    // Insert the test job
    console.log("\nInserting test job...");
    const { data: newJob, error: insertError } = await supabase
      .from('jobs')
      .insert([testJob])
      .select('*')
      .single();
    
    if (insertError) {
      console.error("Error creating job:", insertError);
      console.error("Error details:", JSON.stringify(insertError, null, 2));
      
      if (insertError.code === "42501") {
        console.log("\nPermission denied. This could be due to RLS policies. Checking if authenticated...");
        
        const { data: authData } = await supabase.auth.getUser();
        console.log("Auth status:", authData.user ? "Authenticated as " + authData.user.email : "Not authenticated");
        
        console.log("\nTry running this test after logging in through the app, or use a service role key for testing.");
      }
      
      return;
    }
    
    console.log("\nJob created successfully!");
    console.log("Job ID:", newJob.id);
    console.log("Job Number:", newJob.job_number);
    console.log("Created at:", newJob.created_at);
    
    // Verify the job was created by fetching it again
    console.log("\nVerifying job was created...");
    const { data: verifiedJob, error: verifyError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', newJob.id)
      .single();
    
    if (verifyError) {
      console.error("Error verifying job:", verifyError);
      return;
    }
    
    console.log("Successfully verified job in database:");
    console.log({
      id: verifiedJob.id,
      title: verifiedJob.title,
      job_number: verifiedJob.job_number,
      status: verifiedJob.status,
      customer: verifiedJob.customer_name,
      location_id: verifiedJob.location_id,
      created_at: verifiedJob.created_at
    });
    
    // Check if job exists in localStorage too (should not be used anymore)
    console.log("\nChecking if jobs are being stored in localStorage (deprecated)...");
    
    // This would only work in a browser environment, not in Node.js
    console.log("Note: localStorage check would need to be performed in browser context");
    console.log("If jobs are still being stored in localStorage, you might want to check for any fallback code");
    
    console.log("\nTest completed successfully!");
  } catch (error) {
    console.error("Unexpected error during test:", error);
    
    if (error.message?.includes('fetch')) {
      console.log("\nConnection error. Please check your Supabase URL and API key.");
      console.log("URL:", supabaseUrl ? "Set" : "Not set");
      console.log("Key:", supabaseKey ? "Set" : "Not set");
    }
  }
}

// Run the test
testJobCreation()
  .then(() => {
    console.log("Script execution completed");
  })
  .catch(err => {
    console.error("Script execution failed:", err);
    process.exit(1);
  }); 