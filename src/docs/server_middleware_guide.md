# Server Middleware for User Administration

## The Problem: Client-Side Admin API Access

When trying to use Supabase's Admin API endpoints (like `supabase.auth.admin.createUser()`) directly from client-side code, you'll encounter 403 Forbidden errors. This is because:

1. These endpoints require special permissions
2. They are designed to be used with a service role key, not the anon key used in browser applications
3. Exposing service role keys in client-side code would be a significant security risk

## Proper Solution: Server Middleware

The recommended approach is to implement a secure server middleware layer:

### Option 1: Backend API Endpoint

Create a secure API endpoint on your own server:

```javascript
// Example using Express.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();

// Create Supabase client with service role key (kept secure on server)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Secured endpoint (requires authentication/authorization)
app.post('/api/admin/create-user', authenticateAdminUser, async (req, res) => {
  try {
    const { email, password, fullName, role, locationId } = req.body;
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName,
        role: role.toLowerCase(),
        location_id: locationId
      },
      email_confirm: true
    });
    
    if (error) throw error;
    
    // Handle additional location assignments...
    
    res.json({ success: true, user: data.user });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: err.message });
  }
});
```

### Option 2: Supabase Edge Function

Create a Supabase Edge Function with the service role key:

```typescript
// supabase/functions/create-user/index.ts
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  // Check authorization
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Not authorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Set up Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { email, password, fullName, role, locationId, locationIds } = await req.json();
    
    // Create user with admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName,
        role: role.toLowerCase(),
        location_id: locationId
      },
      email_confirm: true
    });
    
    if (error) throw error;
    
    // Handle location assignments...
    
    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

## Current Workaround

Since implementing a proper server middleware may take time, we've temporarily switched to using `supabase.auth.signUp()`, which works client-side but has limitations:

1. Users must confirm their email before they can log in
2. You can't directly set `email_confirm: true` to bypass confirmation
3. Profile updates need to be done separately

In a production environment, you should migrate to one of the server-side approaches described above.

## Security Considerations

- Never expose your service role key in client-side code
- Always implement proper authorization on your server endpoints
- Consider rate limiting to prevent abuse
- Keep logs of administrative actions for audit purposes 