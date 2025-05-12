import { supabase } from '@/lib/supabase';

// Declare global types for the window object
declare global {
  interface Window {
    checkRLSAccess: () => Promise<void>;
    checkTableAccess: (tableName: string, query?: any) => Promise<void>;
  }
}

/**
 * Utility to check RLS status and accessible tables in development mode
 */
export const checkRLSAccess = async (): Promise<void> => {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') {
    console.log('RLS access check is only available in development mode');
    return;
  }

  console.log('Starting RLS access check...');

  // Add a timeout to prevent indefinite pending
  const timeoutPromise = new Promise<void>((_, reject) => {
    setTimeout(() => {
      reject(new Error('RLS check timed out after 10 seconds. You might have authentication issues.'));
    }, 10000);
  });

  try {
    // Get current user session with a race against timeout
    const sessionResult = await Promise.race([
      supabase.auth.getSession(),
      timeoutPromise
    ]);
    
    // Since we're racing with a generic Promise<void>, we need to check if the result has the expected shape
    if (!sessionResult || !('data' in sessionResult)) {
      console.error('Unexpected result format from getSession');
      console.log('Session result:', sessionResult);
      console.log('Authentication state might be corrupted. Try logging out and back in.');
      return;
    }
    
    const { data: { session } } = sessionResult;
    
    if (!session) {
      console.log('No authenticated user found. Please sign in to check RLS access.');
      console.log('UI may be showing logged-in state incorrectly. Try clearing browser cache and cookies.');
      return;
    }
    
    console.log('Session found:', { 
      user_id: session.user.id,
      email: session.user.email,
      expires_at: new Date(session.expires_at * 1000).toLocaleString()
    });
    
    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at < now) {
      console.error('Your session has expired. Please log in again.');
      console.log('Current time:', new Date().toLocaleString());
      console.log('Session expiry:', new Date(session.expires_at * 1000).toLocaleString());
      return;
    }
    
    const userId = session.user.id;
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      console.log('This could indicate a mismatch between auth and database. Your user ID might not exist in the profiles table.');
      return;
    }
    
    const userRole = profile?.role || 'unknown';
    
    console.group('%c🔒 RLS Access Information', 'color: #0284c7; font-size: 14px; font-weight: bold;');
    console.log('%cAuthenticated User:', 'font-weight: bold;');
    console.log(`ID: ${userId}`);
    console.log(`Email: ${session.user.email}`);
    console.log(`Role: ${userRole}`);
    
    // Tables to check
    const tables = [
      'jobs',
      'profiles',
      'timesheets',
      'defects',
      'reports',
      'customers',
      'notifications'
    ];
    
    console.log('%cTable Access:', 'font-weight: bold;');
    
    // Check access for each table
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
          
        const hasAccess = !error;
        console.log(
          `${table}: ${hasAccess ? '✅ Has access' : '❌ No access'} ${error ? `(${error.message})` : ''}`
        );
      } catch (error) {
        console.log(`${table}: ❌ Error checking access`);
      }
    }
    
    console.log('\n%cNote: This is only a basic check. Some tables might have row-level restrictions.', 'font-style: italic;');
    console.groupEnd();
    
  } catch (error) {
    console.error('Error checking RLS access:', error);
    console.log('If this is a timeout error, your authentication might be in an inconsistent state.');
    console.log('Suggested actions:');
    console.log('1. Clear browser cache and cookies');
    console.log('2. Log out and log back in');
    console.log('3. Check browser console for other authentication errors');
  }
};

/**
 * Utility to check specific table access with query
 */
export const checkTableAccess = async (tableName: string, query?: any): Promise<void> => {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') {
    console.log('Table access check is only available in development mode');
    return;
  }

  try {
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No authenticated user found. Please sign in to check table access.');
      return;
    }
    
    console.group(`%c🔍 Checking access to ${tableName}`, 'color: #0284c7; font-size: 14px; font-weight: bold;');
    
    // Base query
    let tableQuery = supabase.from(tableName).select('*');
    
    // Apply additional filters if provided
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        tableQuery = tableQuery.eq(key, value);
      });
    }
    
    // Limit results
    tableQuery = tableQuery.limit(5);
    
    // Execute query
    const { data, error, count } = await tableQuery;
    
    if (error) {
      console.log(`❌ Cannot access ${tableName}: ${error.message}`);
    } else {
      console.log(`✅ Access to ${tableName} confirmed`);
      console.log(`Records accessible: ${data.length}`);
      console.log('Sample data:', data);
    }
    
    console.groupEnd();
  } catch (error) {
    console.error(`Error checking access to ${tableName}:`, error);
  }
}; 