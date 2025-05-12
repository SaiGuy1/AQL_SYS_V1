// Script to debug database connection and perform basic operations
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing database connection...');
  
  try {
    // Simple query to check connection
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .limit(10);
    
    if (error) {
      console.error('Connection error:', error.message);
      return false;
    }
    
    console.log('✓ Connection successful');
    console.log('Public tables found:', data.map(t => t.tablename).join(', '));
    return true;
  } catch (error) {
    console.error('Unexpected error testing connection:', error);
    return false;
  }
}

async function listTables() {
  console.log('\nListing all public tables...');
  
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (error) {
      console.error('Error listing tables:', error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('No public tables found');
      return;
    }
    
    console.log(`Found ${data.length} tables:`);
    data.forEach(table => console.log(`- ${table.table_name}`));
  } catch (error) {
    console.error('Unexpected error listing tables:', error);
  }
}

async function checkJobsTable() {
  console.log('\nChecking jobs table...');
  
  try {
    // Check if jobs table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'jobs');
    
    if (tableError) {
      console.error('Error checking for jobs table:', tableError.message);
      return;
    }
    
    if (!tables || tables.length === 0) {
      console.error('❌ Jobs table does not exist!');
      return;
    }
    
    console.log('✓ Jobs table exists');
    
    // Count records in jobs table
    const { data: countData, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting jobs:', countError.message);
    } else {
      console.log(`Jobs table contains ${countData.count} records`);
    }
    
    // Check record with status = 'draft'
    const { data: draftJobs, error: draftError } = await supabase
      .from('jobs')
      .select('id, title, status, job_number')
      .eq('status', 'draft')
      .limit(5);
    
    if (draftError) {
      console.error('Error querying draft jobs:', draftError.message);
      console.log('This might indicate an issue with the status column type');
    } else if (!draftJobs || draftJobs.length === 0) {
      console.log('No draft jobs found');
    } else {
      console.log(`Found ${draftJobs.length} draft jobs:`);
      draftJobs.forEach(job => {
        console.log(`- ${job.title} (${job.job_number}), ID: ${job.id}`);
      });
    }
  } catch (error) {
    console.error('Unexpected error checking jobs table:', error);
  }
}

async function testCreateJob() {
  console.log('\nTesting job creation...');
  
  try {
    // Create a test job
    const testJob = {
      title: 'Debug Test Job',
      status: 'draft',
      job_number: 'DEBUG-' + Math.floor(Math.random() * 10000),
    };
    
    console.log('Attempting to create job with data:', testJob);
    
    const { data, error } = await supabase
      .from('jobs')
      .insert(testJob)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating job:', error.message);
      console.log('Error code:', error.code);
      console.log('Error details:', error.details);
      
      // Try with text status
      console.log('\nTrying again with status as explicit text...');
      const { data: data2, error: error2 } = await supabase
        .from('jobs')
        .insert({
          ...testJob,
          status: testJob.status + ''  // Ensure it's a string
        })
        .select()
        .single();
      
      if (error2) {
        console.error('Still failed with explicit text status:', error2.message);
      } else {
        console.log('✓ Job created successfully with explicit text status!');
        console.log('Job data:', data2);
      }
    } else {
      console.log('✓ Job created successfully!');
      console.log('Job data:', data);
    }
  } catch (error) {
    console.error('Unexpected error creating job:', error);
  }
}

async function testAuth() {
  console.log('\nTesting authentication...');
  
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Auth error:', error.message);
      return;
    }
    
    if (data && data.user) {
      console.log('✓ Authenticated as user:', data.user.email);
      console.log('User ID:', data.user.id);
    } else {
      console.log('Not authenticated or using anon key');
    }
  } catch (error) {
    console.error('Unexpected auth error:', error);
  }
}

async function main() {
  console.log('Starting database debug script...');
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.error('Failed to connect to database. Check your environment variables.');
    process.exit(1);
  }
  
  // Test user authentication
  await testAuth();
  
  // List tables
  await listTables();
  
  // Check jobs table
  await checkJobsTable();
  
  // Test creating a job
  await testCreateJob();
  
  console.log('\nDatabase debug script complete');
}

main(); 