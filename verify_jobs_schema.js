// Script to verify the jobs table schema against application expectations
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define the expected schema for the jobs table
const expectedColumns = [
  { name: 'id', type: 'uuid', is_primary: true, has_default: true },
  { name: 'created_at', type: 'timestamp with time zone', has_default: true },
  { name: 'updated_at', type: 'timestamp with time zone', has_default: true },
  { name: 'title', type: 'text' },
  { name: 'status', type: ['text', 'USER-DEFINED'] }, // Accept either text or enum type
  { name: 'job_number', type: 'text' },
  { name: 'location_number', type: 'text' },
  { name: 'revision', type: 'text' },
  { name: 'user_id', type: 'uuid' },
  { name: 'form_data', type: 'jsonb' },
  { name: 'customer', type: 'jsonb' },
  { name: 'location', type: 'jsonb' },
  { name: 'current_tab', type: 'text' }
];

// Function to check if column types match expected types
function isTypeMatch(actual, expected) {
  if (Array.isArray(expected)) {
    return expected.includes(actual);
  }
  return actual === expected;
}

async function verifyJobsSchema() {
  console.log('Verifying jobs table schema...');
  
  try {
    // Check if the jobs table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'jobs');
    
    if (tableError) {
      throw new Error(`Error checking for jobs table: ${tableError.message}`);
    }
    
    if (!tables || tables.length === 0) {
      console.error('❌ Jobs table does not exist!');
      console.log('SQL to create jobs table:');
      console.log(`
        CREATE TABLE public.jobs (
          id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now(),
          title text,
          status text,
          job_number text,
          location_number text,
          revision text,
          user_id uuid REFERENCES auth.users,
          form_data jsonb,
          customer jsonb,
          location jsonb,
          current_tab text
        );

        ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own jobs"
          ON public.jobs
          FOR SELECT
          USING (auth.uid() = user_id);
          
        CREATE POLICY "Users can insert their own jobs"
          ON public.jobs
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);
          
        CREATE POLICY "Users can update their own jobs"
          ON public.jobs
          FOR UPDATE
          USING (auth.uid() = user_id);
      `);
      return;
    }
    
    console.log('✓ Jobs table exists');
    
    // Get column information for the jobs table
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default, udt_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'jobs');
      
    if (columnsError) {
      throw new Error(`Error getting column information: ${columnsError.message}`);
    }
    
    if (!columns || columns.length === 0) {
      console.error('❌ No columns found in jobs table!');
      return;
    }
    
    console.log(`Found ${columns.length} columns in jobs table`);
    
    // Check for missing columns
    const missingColumns = [];
    for (const expected of expectedColumns) {
      const found = columns.find(col => col.column_name === expected.name);
      if (!found) {
        missingColumns.push(expected);
      } else {
        // Check column type
        const actualType = found.data_type === 'USER-DEFINED' ? found.udt_name : found.data_type;
        if (!isTypeMatch(found.data_type, expected.type)) {
          console.warn(`⚠️ Column '${expected.name}' has type '${found.data_type}' (${actualType}), expected '${expected.type}'`);
        } else {
          console.log(`✓ Column '${expected.name}' has correct type: ${found.data_type}`);
        }
      }
    }
    
    if (missingColumns.length > 0) {
      console.error('❌ Missing columns:');
      missingColumns.forEach(col => {
        console.error(`  - ${col.name} (${col.type})`);
        console.log(`SQL to add column: ALTER TABLE public.jobs ADD COLUMN ${col.name} ${col.type};`);
      });
    } else {
      console.log('✓ All required columns exist');
    }
    
    // Check RLS policies
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'jobs' });
      
    if (policiesError) {
      console.warn(`⚠️ Could not check RLS policies: ${policiesError.message}`);
      console.warn('To check policies manually, run: SELECT * FROM pg_policies WHERE tablename = \'jobs\';');
    } else if (!policies || policies.length === 0) {
      console.error('❌ No RLS policies found for jobs table!');
      console.log('SQL to add basic RLS policies:');
      console.log(`
        ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own jobs"
          ON public.jobs
          FOR SELECT
          USING (auth.uid() = user_id);
          
        CREATE POLICY "Users can insert their own jobs"
          ON public.jobs
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);
          
        CREATE POLICY "Users can update their own jobs"
          ON public.jobs
          FOR UPDATE
          USING (auth.uid() = user_id);
      `);
    } else {
      console.log(`✓ Found ${policies.length} RLS policies for jobs table`);
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd} ${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'}`);
      });
    }
    
    // Check status field values (if enum)
    if (columns.find(col => col.column_name === 'status' && col.data_type === 'USER-DEFINED')) {
      const { data: enumValues, error: enumError } = await supabase.rpc('get_enum_values', { enum_name: 'job_status' });
      
      if (enumError) {
        console.warn(`⚠️ Could not check enum values: ${enumError.message}`);
        console.log('Fallback SQL to check enum values: SELECT * FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = \'job_status\');');
      } else if (enumValues && enumValues.length > 0) {
        console.log('Status enum values:');
        enumValues.forEach(val => console.log(`  - ${val}`));
        
        // Check if 'draft' exists in enum values
        if (!enumValues.includes('draft')) {
          console.error('❌ Status enum is missing the "draft" value!');
          console.log('SQL to add "draft" value: ALTER TYPE job_status ADD VALUE \'draft\';');
        } else {
          console.log('✓ Status enum contains "draft" value');
        }
      }
    } else {
      console.log('✓ Status column is not an enum, likely text type which is compatible');
    }
    
    // Test query capability
    try {
      const { data: sampleJob, error: sampleError } = await supabase
        .from('jobs')
        .select('*')
        .limit(1);
        
      if (sampleError) {
        console.error(`❌ Could not query jobs table: ${sampleError.message}`);
      } else {
        console.log('✓ Successfully queried jobs table');
        if (sampleJob && sampleJob.length > 0) {
          console.log('Sample job data:');
          const job = sampleJob[0];
          console.log(`  ID: ${job.id}`);
          console.log(`  Title: ${job.title}`);
          console.log(`  Status: ${job.status}`);
          console.log(`  Job Number: ${job.job_number}`);
        } else {
          console.log('No job records found in table');
        }
      }
    } catch (e) {
      console.error(`❌ Error querying jobs table: ${e.message}`);
    }
    
    console.log('Schema verification complete');
    
  } catch (error) {
    console.error(`Error verifying schema: ${error.message}`);
  }
}

// Add helper function for custom RPCs that might not exist
// (Supabase doesn't provide these by default)
async function addHelperFunctions(supabase) {
  try {
    // Create function to get policies for a table
    await supabase.rpc('create_get_policies_function', {}, {
      head: true  // Just check if function exists without executing
    }).catch(async () => {
      // Function doesn't exist, create it
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION get_policies_for_table(table_name text)
        RETURNS TABLE(policyname text, tablename text, cmd text, permissive text, roles text[], qual text, with_check text)
        LANGUAGE SQL
        AS $$
          SELECT policyname, tablename, cmd, permissive, roles, qual, with_check 
          FROM pg_policies 
          WHERE tablename = table_name
        $$;
      `;
      
      // Execute raw SQL to create the function
      const { error } = await supabase.rpc('pgadmin_exec_sql', { sql: createFunctionSQL });
      if (error) {
        console.warn(`⚠️ Could not create helper function for policies: ${error.message}`);
      }
    });
    
    // Create function to get enum values
    await supabase.rpc('get_enum_values', { enum_name: 'job_status' }, {
      head: true  // Just check if function exists without executing
    }).catch(async () => {
      // Function doesn't exist, create it
      const createEnumFunctionSQL = `
        CREATE OR REPLACE FUNCTION get_enum_values(enum_name text)
        RETURNS TABLE(enum_value text)
        LANGUAGE SQL
        AS $$
          SELECT enumlabel as enum_value
          FROM pg_enum
          WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = enum_name)
          ORDER BY enumsortorder
        $$;
      `;
      
      // Execute raw SQL to create the function
      const { error } = await supabase.rpc('pgadmin_exec_sql', { sql: createEnumFunctionSQL });
      if (error) {
        console.warn(`⚠️ Could not create helper function for enum values: ${error.message}`);
      }
    });
  } catch (error) {
    console.warn(`⚠️ Could not setup helper functions: ${error.message}`);
  }
}

// Main execution
async function main() {
  try {
    await addHelperFunctions(supabase);
    await verifyJobsSchema();
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

main();