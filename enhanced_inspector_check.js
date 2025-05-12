// enhanced_inspector_check.js
// An enhanced script to diagnose inspector profile issues with multiple methods
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

async function enhancedInspectorCheck() {
  console.log('=== ENHANCED INSPECTOR DIAGNOSTIC REPORT ===\n');
  
  try {
    // 1. Check auth.users table if we have permission
    console.log('1. Checking auth.users table (requires service role)...');
    
    try {
      // This query will only work with service role key
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        console.log('❌ Could not access auth.users table:', usersError.message);
        console.log('Note: This is expected if not using a service role key');
      } else {
        console.log(`✓ Found ${users?.users?.length || 0} users in auth.users table`);
        
        if (users?.users?.length > 0) {
          console.log('Example user:');
          const exampleUser = users.users[0];
          console.log(`  - ID: ${exampleUser.id}`);
          console.log(`  - Email: ${exampleUser.email}`);
          console.log(`  - Created at: ${exampleUser.created_at}`);
        }
      }
    } catch (e) {
      console.log('❌ Could not access auth.users table');
      console.log('Note: This is expected if not using a service role key');
    }
    
    // 2. Try direct SQL using RPC if available
    console.log('\n2. Trying direct SQL via RPC function (requires pgadmin_exec_sql)...');
    
    try {
      const { data: sqlResult, error: sqlError } = await supabase.rpc('pgadmin_exec_sql', {
        sql: `
        SELECT COUNT(*) as profile_count FROM public.profiles;
        `
      });
      
      if (sqlError) {
        console.log('❌ Could not execute SQL via RPC:', sqlError.message);
        console.log('Note: This is expected if pgadmin_exec_sql function is not available');
      } else {
        console.log('✓ Direct SQL execution successful');
        console.log('Result:', sqlResult);
      }
    } catch (e) {
      console.log('❌ Could not execute SQL via RPC:', e.message);
    }
    
    // 3. Check profiles table using standard client
    console.log('\n3. Checking profiles table using standard client...');
    
    try {
      const { data: profilesCount, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.log('❌ Error accessing profiles table:', countError.message);
      } else {
        console.log(`Found ${profilesCount?.count || 0} total profiles`);
      }
      
      // Check for inspector profiles specifically
      const { data: inspectors, error: inspectorsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'inspector');
        
      if (inspectorsError) {
        console.log('❌ Error querying inspector profiles:', inspectorsError.message);
      } else {
        console.log(`Found ${inspectors?.length || 0} profiles with role = 'inspector'`);
        
        if (inspectors && inspectors.length > 0) {
          console.log('Inspector profiles found:');
          inspectors.forEach((inspector, index) => {
            console.log(`Inspector ${index + 1}:`);
            console.log(`  - ID: ${inspector.id}`);
            console.log(`  - Name: ${inspector.name || 'N/A'}`);
            console.log(`  - Email: ${inspector.email || 'N/A'}`);
            console.log(`  - Role: ${inspector.role || 'N/A'}`);
            console.log(`  - Location ID: ${inspector.location_id || 'N/A'}`);
          });
        }
      }
    } catch (e) {
      console.log('❌ Error accessing profiles:', e.message);
    }
    
    // 4. Check jobs table structure for inspector assignment
    console.log('\n4. Checking jobs table structure for inspector assignment...');
    
    try {
      // First check if the table exists
      const { data: jobsExist, error: existError } = await supabase
        .from('jobs')
        .select('id')
        .limit(1);
        
      if (existError) {
        console.log('❌ Error accessing jobs table:', existError.message);
      } else {
        // Try to determine structure without failing
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .limit(1);
          
        if (error) {
          console.log('❌ Error fetching job data:', error.message);
        } else if (data && data.length > 0) {
          const jobColumns = Object.keys(data[0]);
          console.log('Job table columns:', jobColumns.join(', '));
          
          if (jobColumns.includes('inspector_id')) {
            console.log('✓ jobs table has inspector_id column');
          } else {
            console.log('❌ jobs table is missing inspector_id column');
          }
          
          if (jobColumns.includes('inspector')) {
            console.log('✓ jobs table has inspector column');
          } else {
            console.log('❌ jobs table is missing inspector column');
          }
        } else {
          console.log('No jobs found in the table');
        }
      }
    } catch (e) {
      console.log('❌ Error analyzing jobs table:', e.message);
    }
    
    // 5. Check RLS policies by testing access patterns
    console.log('\n5. Testing access patterns affected by RLS policies...');
    
    // This is just a test to see if we can view all profiles
    // which would be restricted by RLS if policy is not properly set
    try {
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .limit(5);
        
      if (profilesError) {
        console.log('❌ Current user cannot view all profiles:', profilesError.message);
        console.log('   This may be due to RLS policies restricting access');
      } else {
        console.log(`✓ Access check passed: Can view profiles (${allProfiles?.length || 0} returned)`);
      }
    } catch (e) {
      console.log('❌ Error testing profile access:', e.message);
    }
    
    // 6. Test creating a simple profile to check insert permissions
    console.log('\n6. Testing profile creation permissions...');
    
    try {
      // Generate a test ID that won't conflict
      const testId = `test-${Date.now()}`;
      
      const { data: insertResult, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: testId,
          name: 'Test Profile',
          role: 'inspector',
          // Note: We don't include location_id to avoid foreign key issues
        })
        .select();
        
      if (insertError) {
        console.log('❌ Cannot create profile:', insertError.message);
        console.log('   This may be due to RLS policies or missing columns');
        
        if (insertError.message.includes('violates row-level security policy')) {
          console.log('   Confirmed: RLS policy is blocking insert operations');
        }
      } else {
        console.log('✓ Successfully created test profile');
        
        // Clean up the test profile
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', testId);
          
        if (deleteError) {
          console.log('   Note: Could not delete test profile:', deleteError.message);
        } else {
          console.log('   Test profile successfully deleted');
        }
      }
    } catch (e) {
      console.log('❌ Error testing profile creation:', e.message);
    }
    
    // 7. Provide enhanced recommendations
    console.log('\n7. ENHANCED RECOMMENDATIONS:');
    
    console.log('1. User Authentication Issues:');
    console.log('   - Verify that your Supabase anon key has the correct permissions');
    console.log('   - Consider using a service role key for administrative operations');
    
    console.log('\n2. Profile Creation Issues:');
    console.log('   - Use the SignupInspector component for proper user+profile creation');
    console.log('   - If direct insertion is needed, you must create both auth.users AND profiles entries');
    
    console.log('\n3. RLS Policy Issues:');
    console.log('   - Check if your RLS policies allow the current user to view/modify profiles');
    console.log('   - Ensure you have policies for:');
    console.log('     a) Users viewing their own profile');
    console.log('     b) Admin/Manager viewing all profiles');
    console.log('     c) Admin/Manager updating any profile');
    
    console.log('\n4. Database Structure Issues:');
    console.log('   - Add inspector_id and inspector columns to the jobs table if missing');
    console.log('   - Ensure the profiles table has location_id and role columns');
    
    console.log('\n=== END OF ENHANCED DIAGNOSTIC REPORT ===');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the diagnostic
enhancedInspectorCheck(); 