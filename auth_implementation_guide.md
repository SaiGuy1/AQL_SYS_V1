# Authentication Implementation Guide

This guide explains the changes made to upgrade the AQL application from using a demo role selection system to using Supabase authentication properly with Row Level Security (RLS).

## Changes Overview

1. **Removed Role Dropdown**: The demo role selector has been removed from the login page and the AQL system interface.
2. **Proper Supabase Authentication**: The system now uses Supabase authentication properly, fetching the user's role from the profiles table.
3. **Role-Based Authorization**: Access to features is now based on the authenticated user's actual role stored in the database.
4. **Row Level Security**: The system now works with Supabase RLS, ensuring data security at the database level.

## Implementation Steps

### 1. Database Setup

First, you need to set up the profiles table in your Supabase database. Run the provided SQL script in the Supabase SQL editor:

```sql
-- Run the profiles_table_setup.sql script in the Supabase SQL Editor
```

This script:
- Creates the profiles table if it doesn't exist
- Adds necessary indexes
- Configures Row Level Security policies
- Creates triggers to automatically create profiles for new users
- Adds migration logic for existing users

### 2. Code Deployment

Deploy the modified code, which includes:

- Updated Login component that uses Supabase authentication
- Updated AQLSystem component with role-based UI
- Updated ProtectedRoute in App.tsx for proper session management
- Updated NavBar component to display user email and handle logout
- Updated JobsList component to fetch jobs based on user role
- Updated InspectorView to show jobs assigned to the authenticated user

### 3. Testing

After deployment, test the following:

1. **User Login**:
   - Sign in with valid credentials
   - Verify you're redirected to the correct view based on your role
   - Check that your email is displayed in the navigation bar

2. **Role-Based Access**:
   - Verify that admin users can see admin features
   - Verify that managers can see manager features
   - Verify that inspectors see the inspector view
   - Ensure that users can't access features not allowed for their role

3. **Job Filtering**:
   - Verify that inspectors only see jobs assigned to them
   - Verify that supervisors see jobs for their location
   - Verify that admins and managers can see all jobs

4. **Error Handling**:
   - Try to log in with invalid credentials and verify error messages appear
   - Try to access restricted routes directly (via URL) and verify you're redirected to login

## Technical Details

### Authentication Flow

1. User enters credentials on the login page
2. Credentials are verified with Supabase auth
3. Upon successful login, the user's profile is fetched from the profiles table
4. The user's role is stored in localStorage for quick access
5. UI is rendered based on the user's role

### Profile Table Schema

The profiles table has the following structure:

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'supervisor', 'inspector', 'hr', 'customer', 'accounting')),
  location_id UUID,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Row Level Security Policies

The following RLS policies have been implemented:

1. Users can read and update their own profiles
2. Admins can read and update all profiles
3. Managers can read all profiles
4. Job tables should have similar RLS policies to restrict data access

## Troubleshooting

### Common Issues

1. **User Not Authenticated**: Ensure Supabase is properly configured and the user has a valid session.
2. **Role Missing**: Check that the user's profile has a valid role set in the profiles table.
3. **Data Not Visible**: Confirm that RLS policies are correctly set up for the tables being accessed.

### Debugging

For debugging authentication issues:

```javascript
// Check current session
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);

// Check user profile
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single();
console.log('User profile:', profile, 'Error:', error);
```

## Migration Notes

If you're migrating from the demo version to this new authentication system, note that:

1. Existing users need profiles in the database with proper roles
2. The script includes migration logic to create profiles for existing users
3. You may need to manually set roles for existing users if they're not correct

## Security Considerations

1. All data access should now use RLS to enforce permissions
2. Never expose sensitive data or allow operations that bypass RLS
3. Always validate user roles before showing sensitive UI components

## Next Steps

1. Consider implementing role-based routing for more granular access control
2. Add more detailed RLS policies for specific tables and operations
3. Implement a role management interface for admins to assign roles

---

If you encounter any issues during implementation, please reach out to the development team. 