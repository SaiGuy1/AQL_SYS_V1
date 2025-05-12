# Fixing Database Error When Creating Users

If you encounter the error message "Database error saving new user" when creating new inspectors or supervisors through the User Management interface, follow this guide to resolve the issue.

## Understanding the Problem

This error typically occurs due to issues with the database schema or triggers:

1. The `profiles` table may not be properly created
2. The trigger that automatically creates a profile for new users might be missing or broken
3. There could be conflicting Row Level Security (RLS) policies
4. The `user_locations` table may not exist or have the right structure

## How to Fix It

### Step 1: Run the SQL Fix Script

1. Log in to your Supabase dashboard 
2. Navigate to the SQL Editor
3. Copy the SQL script from `src/docs/fix_profiles_table.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the script

The script will:
- Ensure the `profiles` table exists with the correct schema
- Fix the trigger that creates user profiles
- Set up appropriate RLS policies
- Create the `user_locations` table if needed
- Fix existing users without profiles
- Create a safe RPC function for retrieving user roles

### Step 2: Verify the Fix

After running the script, go back to your application and try creating a user again. The database error should be resolved.

## If The Error Persists

If you still encounter issues, here are additional things to check:

### Check Database Logs

1. In Supabase, go to Project Settings > Database
2. Look at the Database Logs for any error messages
3. Pay particular attention to errors related to the `profiles` table or the `handle_new_user` function

### Manually Create a Profile

If the automatic profile creation is not working, you can manually create a profile after creating a user:

```sql
INSERT INTO profiles (id, email, name, role, location_id)
VALUES (
  '[USER_ID]',
  '[USER_EMAIL]',
  '[USER_NAME]',
  'inspector', -- or 'supervisor'
  '[LOCATION_ID]'
);
```

Replace the placeholders with the actual values.

### Check JWT Claims

Make sure JWT claims are working correctly by examining a token:

1. In the browser console, run:
```javascript
const { data } = await supabase.auth.getSession()
console.log(data.session.access_token)
```

2. Copy the token and decode it at [jwt.io](https://jwt.io/) to verify that role claims are being included

## Alternate Workaround

If the database integration cannot be fixed, consider implementing a server-side proxy for user creation as described in `src/docs/server_middleware_guide.md`. This approach would bypass the client-side restrictions and allow proper admin-level creation of user accounts. 