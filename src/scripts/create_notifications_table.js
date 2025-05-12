// Script to create a notifications table for storing job assignment notifications
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createNotificationsTable() {
  console.log('Creating notifications table...');
  
  try {
    // First, check if the table already exists
    const { data: existingTables, error: tableCheckError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'notifications');
      
    if (tableCheckError) {
      console.error('Error checking for notifications table:', tableCheckError.message);
      throw tableCheckError;
    }
    
    // If table already exists
    if (existingTables && existingTables.length > 0) {
      console.log('✓ Notifications table already exists');
      return;
    }
    
    // SQL for creating the notifications table
    const createTableSQL = `
      CREATE TABLE public.notifications (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at timestamp with time zone DEFAULT now(),
        user_id uuid REFERENCES auth.users, 
        message text NOT NULL,
        type text NOT NULL, 
        job_id uuid REFERENCES public.jobs,
        read boolean DEFAULT false,
        data jsonb DEFAULT '{}'::jsonb
      );
      
      -- Enable Row Level Security
      ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      CREATE POLICY "Users can view their own notifications"
        ON public.notifications
        FOR SELECT
        USING (auth.uid() = user_id);
        
      CREATE POLICY "Users can mark their notifications as read"
        ON public.notifications
        FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    `;
    
    // Execute the SQL
    const { error: createTableError } = await supabase.rpc('pgadmin_exec_sql', { sql: createTableSQL });
    
    if (createTableError) {
      console.error('Error creating notifications table:', createTableError.message);
      
      // Try alternate approach if the RPC doesn't work (usually due to permissions)
      console.log('Trying alternate approach with separate commands...');
      
      // Create table
      const { error: error1 } = await supabase.rpc('pgadmin_exec_sql', { 
        sql: `CREATE TABLE public.notifications (
          id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          created_at timestamp with time zone DEFAULT now(),
          user_id uuid REFERENCES auth.users, 
          message text NOT NULL,
          type text NOT NULL, 
          job_id uuid REFERENCES public.jobs,
          read boolean DEFAULT false,
          data jsonb DEFAULT '{}'::jsonb
        );` 
      });
      
      if (error1) {
        console.error('Error creating table (step 1):', error1.message);
        throw error1;
      }
      
      // Enable RLS
      const { error: error2 } = await supabase.rpc('pgadmin_exec_sql', { 
        sql: `ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;` 
      });
      
      if (error2) {
        console.error('Error enabling RLS (step 2):', error2.message);
        throw error2;
      }
      
      // Create first policy
      const { error: error3 } = await supabase.rpc('pgadmin_exec_sql', { 
        sql: `CREATE POLICY "Users can view their own notifications"
          ON public.notifications
          FOR SELECT
          USING (auth.uid() = user_id);` 
      });
      
      if (error3) {
        console.error('Error creating first policy (step 3):', error3.message);
        throw error3;
      }
      
      // Create second policy
      const { error: error4 } = await supabase.rpc('pgadmin_exec_sql', { 
        sql: `CREATE POLICY "Users can mark their notifications as read"
          ON public.notifications
          FOR UPDATE
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);` 
      });
      
      if (error4) {
        console.error('Error creating second policy (step 4):', error4.message);
        throw error4;
      }
      
      console.log('✓ Successfully created notifications table using step-by-step approach');
      return;
    }
    
    console.log('✓ Successfully created notifications table');
    
    // Create index for faster lookups
    const createIndexSQL = `
      CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
      CREATE INDEX idx_notifications_job_id ON public.notifications(job_id);
      CREATE INDEX idx_notifications_read ON public.notifications(read);
    `;
    
    const { error: indexError } = await supabase.rpc('pgadmin_exec_sql', { sql: createIndexSQL });
    
    if (indexError) {
      console.warn('Note: Could not create indexes. This is not critical:', indexError.message);
    } else {
      console.log('✓ Created indexes for notifications table');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
    throw error;
  }
}

// Function to test inserting a notification
async function testNotification() {
  try {
    // Get a random user ID or use a test ID
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);
      
    let userId;
    if (userError || !users || users.length === 0) {
      console.warn('Could not get a user ID, using a test UUID');
      userId = '00000000-0000-0000-0000-000000000000'; // Test UUID
    } else {
      userId = users[0].id;
    }
    
    console.log(`Inserting test notification for user ${userId}`);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        message: 'This is a test notification',
        type: 'test',
        read: false
      })
      .select();
      
    if (error) {
      console.error('Error inserting test notification:', error.message);
    } else {
      console.log('✓ Test notification inserted successfully:', data);
    }
  } catch (error) {
    console.error('Error in test notification:', error);
  }
}

// Main function
async function main() {
  try {
    await createNotificationsTable();
    // Uncomment to test notification insertion
    // await testNotification();
    console.log('Script completed successfully!');
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

main(); 