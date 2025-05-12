# Demo Mode Instructions for Supabase RLS

When running the application in demo mode, you might encounter issues with Row Level Security (RLS) because there isn't a real authenticated user. Here are your options for handling this:

## Option 1: Use Updated Code with Demo Mode Detection (Recommended)

We've updated the `createJob` function in `src/services/aqlService.ts` to automatically:

1. Detect if the application is running in demo mode (localhost or with demo_mode flag)
2. Use a placeholder UUID for the user_id in demo mode
3. Skip authentication checks when in demo mode

This change should allow you to create jobs in demo mode without needing to make any database changes.

## Option 2: Temporarily Disable RLS in Supabase

If you're still having issues, you can temporarily disable RLS for the jobs table:

1. Go to your Supabase dashboard
2. Open the SQL Editor
3. Run the SQL script from `disable_rls_for_demo.sql`

**IMPORTANT:** This completely disables security checks for the jobs table. Only do this in development environments, never in production.

To re-enable RLS when you're done testing:

```sql
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs FORCE ROW LEVEL SECURITY;
```

## Option 3: Set Up a Demo User

For a more realistic demo without disabling security:

1. Create a demo user in Supabase Authentication
2. Log in as this user when in demo mode
3. Use the demo user's ID for all demo operations

You can add this to your application initialization:

```javascript
// Demo mode login - only in development
if (process.env.NODE_ENV === 'development') {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'demo@example.com',
    password: 'demo-password-123'
  });
  
  if (data?.user) {
    console.log('Logged in as demo user:', data.user.id);
  } else if (error) {
    console.warn('Could not login as demo user:', error.message);
  }
}
```

## Setting a Demo Mode Flag

To explicitly enable demo mode, you can set a flag in localStorage:

```javascript
// Enable demo mode
localStorage.setItem('demo_mode', 'true');

// Disable demo mode
localStorage.setItem('demo_mode', 'false');
```

The updated code will check for this flag and use the demo user_id accordingly. 