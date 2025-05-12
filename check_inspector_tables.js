// check_inspector_tables.js
// Script to diagnose issues with inspector tables and location linking
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInspectorTables() {
  console.log('=== INSPECTOR TABLES DIAGNOSTIC REPORT ===\n');
  
  try {
    // 1. Check profiles table
    console.log('1. Checking profiles table...');
    
    try {
      const { data: profilesCount, error: profilesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
        
      if (profilesError) {
        console.log('✖ profiles table error:', profilesError.message);
      } else {
        console.log(`✓ profiles table exists with ${profilesCount?.count || 0} records`);
      }
    } catch (e) {
      console.log('✖ profiles table does not exist or cannot be accessed');
    }
    
    // 2. Check profiles structure from sample
    console.log('\n2. Checking profiles table structure...');
    
    try {
      const { data: sampleProfile, error: sampleError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
        
      if (sampleError) {
        console.error('Error fetching sample profile:', sampleError.message);
      } else if (sampleProfile && sampleProfile.length > 0) {
        console.log('Profiles table columns:');
        
        const record = sampleProfile[0];
        Object.entries(record).forEach(([key, value]) => {
          console.log(`  - ${key} (${typeof value})`);
        });
        
        // Check if location_id exists
        if ('location_id' in record) {
          console.log('✓ location_id column exists in profiles table');
        } else {
          console.error('❌ location_id column MISSING from profiles table!');
        }
        
        // Check if role column exists
        if ('role' in record) {
          console.log('✓ role column exists in profiles table');
        } else {
          console.error('❌ role column MISSING from profiles table!');
        }
      } else {
        console.log('No sample profiles found to infer structure');
      }
    } catch (e) {
      console.error('Error analyzing profiles table:', e.message);
    }
    
    // 3. Check for inspectors in profiles table
    console.log('\n3. Checking for inspectors in profiles table...');
    
    try {
      const { data: inspectors, error: inspectorsError } = await supabase
        .from('profiles')
        .select('id, name, email, role, location_id')
        .eq('role', 'inspector');
        
      if (inspectorsError) {
        console.error('Error fetching inspectors from profiles:', inspectorsError.message);
      } else if (!inspectors || inspectors.length === 0) {
        console.error('❌ No inspectors found in profiles table with role = "inspector"!');
        console.log('This is likely the root cause - no inspectors are defined in the system.');
      } else {
        console.log(`Found ${inspectors.length} inspectors in profiles table:`);
        inspectors.forEach(inspector => {
          console.log(`  - ${inspector.name || 'Unnamed'} (${inspector.email || 'No email'}, location_id: ${inspector.location_id || 'NULL'})`);
        });
      }
    } catch (e) {
      console.error('Error checking for inspectors:', e.message);
    }
    
    // 4. Check locations table
    console.log('\n4. Checking locations table...');
    
    try {
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('id, name, location_number')
        .limit(10);
        
      if (locationsError) {
        console.error('Error fetching locations:', locationsError.message);
      } else if (!locations || locations.length === 0) {
        console.error('❌ No locations found in locations table!');
        console.log('This is critical - inspectors need to be associated with locations.');
      } else {
        console.log(`Found ${locations.length} locations in locations table:`);
        locations.forEach(location => {
          console.log(`  - ${location.name} (id: ${location.id}, number: ${location.location_number})`);
        });
        console.log('✓ Locations are properly defined in the system');
      }
    } catch (e) {
      console.error('Error checking locations table:', e.message);
    }
    
    // 5. Check RLS policies on profiles table
    console.log('\n5. Checking profiles table RLS policies...');
    
    console.log('Note: Due to database permissions, we cannot directly check RLS policies.');
    console.log('Common RLS issues that could prevent inspector management:');
    console.log('  - Missing RLS policy for admin/manager users to view all profiles');
    console.log('  - Missing RLS policy for admin/manager users to update profiles');
    console.log('  - Missing policy for users to view their own profile');
    
    // 6. Check assignments in job table
    console.log('\n6. Checking job assignments to inspectors...');
    
    try {
      const { data: assignedJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, inspector_id')
        .not('inspector_id', 'is', null)
        .limit(10);
        
      if (jobsError) {
        console.error('Error fetching assigned jobs:', jobsError.message);
      } else if (!assignedJobs || assignedJobs.length === 0) {
        console.log('No jobs with assigned inspectors found.');
      } else {
        console.log(`Found ${assignedJobs.length} jobs with inspector assignments:`);
        for (const job of assignedJobs) {
          console.log(`  - Job ${job.title} (${job.id}) assigned to inspector_id: ${job.inspector_id}`);
          
          // Check if the assigned inspector exists
          const { data: inspector, error: inspectorError } = await supabase
            .from('profiles')
            .select('id, name, email, role')
            .eq('id', job.inspector_id)
            .single();
            
          if (inspectorError) {
            console.error(`  ❌ Cannot find assigned inspector (${job.inspector_id}): ${inspectorError.message}`);
          } else if (inspector) {
            console.log(`  ✓ Assigned to: ${inspector.name} (${inspector.email})`);
          }
        }
      }
    } catch (e) {
      console.error('Error checking job assignments:', e.message);
    }
    
    // 7. Provide recommendations
    console.log('\n7. RECOMMENDATIONS:');
    
    console.log('1. Ensure users sign up through the SignupInspector page to create proper profiles');
    console.log('2. Verify that profiles table contains a location_id column linked to the locations table');
    console.log('3. Check that all inspectors have their role set to "inspector" in the profiles table');
    console.log('4. Verify RLS policies allow managers to view and assign inspectors');
    console.log('5. If the system was using a legacy inspectors table, ensure data is migrated to profiles');
    
    console.log('\n=== END OF DIAGNOSTIC REPORT ===');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Main function
async function main() {
  try {
    await checkInspectorTables();
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

main(); 