/**
 * Script to verify the jobs table in Supabase
 * This script checks if the table exists and has all required columns
 * It also verifies that RLS policies are in place
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Define required columns for jobs table
const requiredColumns = [
  { name: 'id', type: 'uuid', isPrimary: true, defaultValue: 'gen_random_uuid()' },
  { name: 'created_at', type: 'timestamp with time zone', defaultValue: 'now()' },
  { name: 'updated_at', type: 'timestamp with time zone', defaultValue: 'now()' },
  { name: 'title', type: 'text' },
  { name: 'status', type: 'text', defaultValue: "'draft'" },
  { name: 'job_number', type: 'text' },
  { name: 'location_number', type: 'text' },
  { name: 'revision', type: 'integer', defaultValue: '0' },
  { name: 'user_id', type: 'uuid' },
  { name: 'form_data', type: 'jsonb', defaultValue: "'{}'" },
  { name: 'customer', type: 'jsonb', defaultValue: "'{}'" },
  { name: 'location', type: 'jsonb', defaultValue: "'{}'" },
  { name: 'current_tab', type: 'text', defaultValue: "'info'" }
];

async function verifyJobsTable() {
  console.log('Verifying jobs table structure in Supabase...');

  try {
    // Use SQL query to check if jobs table exists
    const { data: tableCheck, error: tableError } = await supabase
      .rpc('check_table_exists', { table_name: 'jobs' });

    if (tableError) {
      console.error('Error checking for jobs table:', tableError.message);
      
      // Try an alternative method
      console.log('Trying alternative method to check table...');
      
      // Execute simple query to test if table exists
      const { data: testData, error: testError } = await supabase
        .from('jobs')
        .select('id')
        .limit(1);
        
      if (testError && testError.code === 'PGRST116') {
        // Table doesn't exist (code PGRST116: Relation "jobs" does not exist)
        console.log('Jobs table does not exist. You should create it with the following SQL:');
        console.log(getCreateTableSQL());
        return;
      } else if (testError) {
        console.error('Error testing jobs table:', testError.message);
        return;
      } else {
        console.log('Jobs table exists (confirmed by query test).');
      }
    } else if (!tableCheck) {
      console.log('Jobs table does not exist. You should create it with the following SQL:');
      console.log(getCreateTableSQL());
      return;
    } else {
      console.log('Jobs table exists.');
    }

    // Check columns using direct SQL query
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'jobs' });

    if (columnsError) {
      console.error('Error fetching columns:', columnsError.message);
      return;
    }

    if (!columns || columns.length === 0) {
      console.log('No columns found in jobs table. This is unexpected.');
      return;
    }

    console.log(`Found ${columns.length} columns in jobs table.`);

    // Check for missing columns
    const missingColumns = requiredColumns.filter(
      required => !columns.some(col => col.column_name === required.name)
    );

    if (missingColumns.length > 0) {
      console.log(`Missing ${missingColumns.length} columns in jobs table.`);
      
      missingColumns.forEach(col => {
        console.log(`Missing column: ${col.name} (${col.type})`);
        console.log(`You should add it with: ALTER TABLE public.jobs ADD COLUMN ${col.name} ${col.type}${col.defaultValue ? ` DEFAULT ${col.defaultValue}` : ''};`);
      });
    } else {
      console.log('All required columns exist in the jobs table.');
    }

    // Check for RLS policies using direct SQL
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'jobs' });

    if (policiesError) {
      console.error('Error fetching policies:', policiesError.message);
      return;
    }

    if (!policies || policies.length === 0) {
      console.log('No RLS policies found for jobs table. You should add them with:');
      console.log(getRLSPoliciesSQL());
    } else {
      console.log(`Found ${policies.length} RLS policies for jobs table:`);
      policies.forEach(policy => {
        console.log(`- ${policy.policyname} (${policy.cmd || 'N/A'})`);
      });
    }

    console.log('Jobs table verification complete.');
  } catch (error) {
    console.error('Unexpected error during verification:', error);
  }
}

function getCreateTableSQL() {
  return `
  CREATE TABLE public.jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    title text,
    status text DEFAULT 'draft',
    job_number text,
    location_number text,
    revision integer DEFAULT 0,
    user_id uuid,
    form_data jsonb DEFAULT '{}',
    customer jsonb DEFAULT '{}',
    location jsonb DEFAULT '{}',
    current_tab text DEFAULT 'info'
  );

  -- Enable Row Level Security
  ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

  ${getRLSPoliciesSQL()}
  `;
}

function getRLSPoliciesSQL() {
  return `
  -- Create policies
  CREATE POLICY "Enable read access for all users" 
    ON public.jobs FOR SELECT 
    USING (true);

  CREATE POLICY "Enable insert for authenticated users only" 
    ON public.jobs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Enable update for users based on user_id" 
    ON public.jobs FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);
  `;
}

// First, create the needed stored procedures in the database
async function createHelperFunctions() {
  console.log('Creating helper functions in the database...');
  
  // Create function to check if a table exists
  const { error: checkTableError } = await supabase.rpc('create_check_table_function', {}, {
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }
  });
  
  if (checkTableError) {
    console.log('Creating check_table_exists function...');
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
      CREATE OR REPLACE FUNCTION check_table_exists(table_name text) 
      RETURNS boolean 
      LANGUAGE plpgsql 
      SECURITY DEFINER
      AS $$
      DECLARE
        table_exists boolean;
      BEGIN
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) INTO table_exists;
        
        RETURN table_exists;
      END;
      $$;
      `
    });
    
    if (error) {
      console.error('Error creating check_table_exists function:', error.message);
    } else {
      console.log('check_table_exists function created successfully.');
    }
  }
  
  // Create function to get table columns
  const { error: getColumnsError } = await supabase.rpc('create_get_columns_function', {}, {
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }
  });
  
  if (getColumnsError) {
    console.log('Creating get_table_columns function...');
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
      CREATE OR REPLACE FUNCTION get_table_columns(table_name text) 
      RETURNS json 
      LANGUAGE plpgsql 
      SECURITY DEFINER
      AS $$
      DECLARE
        result json;
      BEGIN
        SELECT json_agg(cols)
        FROM (
          SELECT column_name, data_type, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) cols INTO result;
        
        RETURN result;
      END;
      $$;
      `
    });
    
    if (error) {
      console.error('Error creating get_table_columns function:', error.message);
    } else {
      console.log('get_table_columns function created successfully.');
    }
  }
  
  // Create function to get table policies
  const { error: getPoliciesError } = await supabase.rpc('create_get_policies_function', {}, {
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }
  });
  
  if (getPoliciesError) {
    console.log('Creating get_table_policies function...');
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
      CREATE OR REPLACE FUNCTION get_table_policies(table_name text) 
      RETURNS json 
      LANGUAGE plpgsql 
      SECURITY DEFINER
      AS $$
      DECLARE
        result json;
      BEGIN
        SELECT json_agg(pols)
        FROM (
          SELECT policyname, cmd
          FROM pg_policies
          WHERE tablename = $1
          AND schemaname = 'public'
        ) pols INTO result;
        
        RETURN result;
      END;
      $$;
      `
    });
    
    if (error) {
      console.error('Error creating get_table_policies function:', error.message);
    } else {
      console.log('get_table_policies function created successfully.');
    }
  }
  
  // Create general SQL execution function if needed
  const { error: execSqlError } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' }, {
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }
  });
  
  if (execSqlError && execSqlError.code === 'PGRST301') {
    console.log('Creating exec_sql function...');
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
      CREATE OR REPLACE FUNCTION exec_sql(sql text) 
      RETURNS void 
      LANGUAGE plpgsql 
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
      `
    });
    
    if (error) {
      console.error('Error creating exec_sql function:', error.message);
    } else {
      console.log('exec_sql function created successfully.');
    }
  }
}

// Run the verification
async function run() {
  try {
    // Create helper functions first
    await createHelperFunctions();
    
    // Then verify the table
    await verifyJobsTable();
  } catch (error) {
    console.error('Error running verification:', error);
  }
}

run(); 