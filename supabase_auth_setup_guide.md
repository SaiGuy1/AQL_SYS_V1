# Supabase Authentication and RLS Setup for AQL

This guide explains how to implement Supabase authentication with row-level security (RLS) in the AQL application. It addresses specific issues with RLS and provides a solution using JWT claims.

## Problem: RLS Recursion

When implementing RLS policies that need to check user roles stored in the `profiles` table, an infinite recursion can occur:

1. User attempts to access the `profiles` table
2. RLS policy checks the user's role (stored in `profiles`)
3. To check the role, Supabase needs to query the `profiles` table again
4. This triggers the RLS check again... and so on indefinitely

This causes login requests to fail with an error or timeout.

## Solution: Using JWT Claims for Role-Based Authorization

Instead of querying the `profiles` table each time, we store user roles and other important data in JWT tokens as user metadata. This allows RLS policies to check roles without recursively querying the `profiles` table.

### Backend Setup (SQL)

```sql
-- 1. Update RLS policies to use JWT claims
CREATE POLICY "Admins can read all profiles" ON public.profiles
    FOR SELECT USING (
        current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin'
    );

-- 2. Sync the user role from profiles to auth.users metadata
CREATE OR REPLACE FUNCTION sync_role_to_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a metadata object to update
    DECLARE
        metadata_updates jsonb := '{}'::jsonb;
    BEGIN
        -- Add role to updates if it changed
        IF OLD.role IS DISTINCT FROM NEW.role THEN
            metadata_updates := metadata_updates || jsonb_build_object('role', NEW.role::text);
        END IF;
        
        -- Add location_id to updates if it changed
        IF OLD.location_id IS DISTINCT FROM NEW.location_id THEN
            IF NEW.location_id IS NULL THEN
                -- Remove the key if it exists in current metadata
                UPDATE auth.users
                SET raw_user_meta_data = raw_user_meta_data - 'location_id'
                WHERE id = NEW.id AND raw_user_meta_data ? 'location_id';
            ELSE
                -- Add location_id to updates
                metadata_updates := metadata_updates || jsonb_build_object('location_id', NEW.location_id::text);
            END IF;
        END IF;
        
        -- Only update metadata if we have changes
        IF metadata_updates != '{}'::jsonb THEN
            UPDATE auth.users
            SET raw_user_meta_data = 
                CASE 
                    WHEN raw_user_meta_data IS NULL THEN
                        metadata_updates
                    ELSE
                        raw_user_meta_data || metadata_updates
                END
            WHERE id = NEW.id;
        END IF;
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync both role and location_id changes to user metadata
CREATE TRIGGER trigger_sync_role_to_metadata
    AFTER UPDATE OF role, location_id ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_role_to_user_metadata();
```

### Frontend Implementation

When fetching the user's role:

```typescript
// Get authenticated user and check role from metadata first
const { data: { user } } = await supabase.auth.getUser();

if (user) {
  // First check for role in user metadata (JWT claims)
  if (user.user_metadata && user.user_metadata.role) {
    // Use the role from JWT claims
    setUserRole(user.user_metadata.role as UserRole);
  } else {
    // Fallback to RPC function if not in metadata
    try {
      const { data: rpcRole } = await supabase.rpc('get_user_role_rpc', { 
        user_id: user.id 
      });
      
      if (rpcRole) {
        setUserRole(rpcRole as UserRole);
        
        // Update user metadata for future JWT claims
        await supabase.auth.updateUser({
          data: { role: rpcRole }
        });
      }
    } catch (error) {
      console.error('Error fetching role via RPC:', error);
      // Fallback to localStorage
      const storedRole = localStorage.getItem('aql_user_role');
      if (storedRole) setUserRole(storedRole as UserRole);
    }
  }
}
```

## Location ID Handling

Similar to roles, location IDs are now synced to user metadata for quick access:

1. When a user's location_id is changed in the profiles table, it's automatically synced to user metadata
2. Frontend components check user.user_metadata for location_id before querying the profiles table
3. A fallback RPC function `get_user_location_id` is provided when needed

Example of accessing location_id in frontend code:

```typescript
// Check for location_id in user metadata first
if (user.user_metadata && user.user_metadata.location_id) {
  locationId = user.user_metadata.location_id;
} else {
  // Fallback to RPC if not in metadata
  const { data: rpcResult } = await supabase.rpc('get_user_location_id', { 
    user_id: user.id 
  });
  
  if (rpcResult) {
    locationId = rpcResult;
    
    // Update user metadata for future JWT claims
    await supabase.auth.updateUser({
      data: { location_id: locationId }
    });
  }
}
```

## Important Considerations

1. **Enum Type**: The `role` column in the profiles table should use a `user_role` enum type with values like 'admin', 'manager', 'supervisor', 'inspector', etc.

2. **Nullable Location ID**: The `location_id` column is nullable and references the `locations` table. When syncing to user metadata, `null` values are properly handled.

3. **RLS Policies**: All RLS policies that check user roles now use JWT claims instead of querying the profiles table.

4. **Initial Setup**: For new users or users without metadata, the system can still fall back to RPC functions or localStorage.

## Troubleshooting

If you encounter issues with the role-based access:

1. **Verify JWT claims**: Check if the user role is correctly stored in the JWT token:
   ```javascript
   const { data } = await supabase.auth.getUser();
   console.log('User metadata:', data.user.user_metadata);
   ```

2. **Reset user metadata**: If the role is incorrect in metadata, update it:
   ```javascript
   await supabase.auth.updateUser({
     data: { role: 'correct_role' }
   });
   ```

3. **Check RLS policies**: Ensure your RLS policies are using JWT claims correctly.

4. **Database functions**: Verify the sync trigger is working by updating a profile's role and checking if the user metadata is updated.

## Security Best Practices

1. Always use `SECURITY DEFINER` for functions that bypass RLS
2. Ensure RLS policies are properly scoped to avoid security vulnerabilities
3. Don't store sensitive information in JWT tokens/user metadata
4. Regularly review and test your RLS policies

By implementing this solution, you'll eliminate the recursion issue with RLS while maintaining secure role-based access control in your application. 