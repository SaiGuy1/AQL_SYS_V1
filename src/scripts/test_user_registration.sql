-- Test User Registration SQL Script
-- This script will help diagnose issues with user registration

-- First, let's check if we can access the auth schema and users table
DO $$
BEGIN
    RAISE NOTICE 'Testing access to auth schema...';
    IF EXISTS (
        SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
    ) THEN
        RAISE NOTICE 'Auth schema exists';
    ELSE
        RAISE NOTICE 'Auth schema does not exist or is not accessible';
    END IF;
END $$;

-- Check if we can access the auth.users table
DO $$
BEGIN
    RAISE NOTICE 'Testing access to auth.users table...';
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'auth' AND table_name = 'users'
        ) THEN
            RAISE NOTICE 'auth.users table exists';
        ELSE
            RAISE NOTICE 'auth.users table does not exist or is not accessible';
        END IF;
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Insufficient privilege to check auth.users table existence';
    END;
END $$;

-- Check the RLS policies on the profiles table
DO $$
BEGIN
    RAISE NOTICE 'Checking RLS policies on profiles table...';
    
    IF EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    ) THEN
        RAISE NOTICE 'Policies exist on the profiles table:';
        
        FOR policy_row IN
            SELECT policyname, permissive, cmd, qual, with_check
            FROM pg_policies 
            WHERE tablename = 'profiles' AND schemaname = 'public'
        LOOP
            RAISE NOTICE 'Policy: %, Permissive: %, Command: %, Using: %, With Check: %', 
                policy_row.policyname, 
                policy_row.permissive, 
                policy_row.cmd, 
                policy_row.qual,
                policy_row.with_check;
        END LOOP;
    ELSE
        RAISE NOTICE 'No policies found for the profiles table';
    END IF;
END $$;

-- Test a direct insert into auth.users (this will likely fail due to permissions,
-- but the error message will be informative)
DO $$
DECLARE
    test_user_id uuid;
    current_timestamp timestamptz := now();
    test_email text := 'test_user_' || floor(random() * 1000000)::text || '@example.com';
BEGIN
    RAISE NOTICE 'Attempting direct insert into auth.users with email: %', test_email;
    
    BEGIN
        -- First attempt: direct insert into auth.users
        INSERT INTO auth.users (
            instance_id, 
            id, 
            aud, 
            role, 
            email,
            encrypted_password,
            email_confirmed_at, 
            recovery_sent_at,
            last_sign_in_at, 
            raw_app_meta_data, 
            raw_user_meta_data,
            created_at, 
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            test_email,
            -- This is just a placeholder - in a real scenario, you'd use proper password hashing
            '********', 
            current_timestamp,
            current_timestamp,
            current_timestamp,
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Test User","role":"inspector"}',
            current_timestamp,
            current_timestamp
        )
        RETURNING id INTO test_user_id;
        
        RAISE NOTICE 'Successfully inserted user with ID: %', test_user_id;
        
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'Error inserting into auth.users: % %', SQLERRM, SQLSTATE;
        
        -- Second attempt: try the auth.users() function if available
        BEGIN
            RAISE NOTICE 'Attempting to use auth.users() function...';
            
            IF EXISTS (
                SELECT 1 FROM pg_proc 
                WHERE proname = 'sign_up' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
            ) THEN
                RAISE NOTICE 'auth.sign_up function exists, attempting to use it...';
                -- Note: This is a placeholder - actual params would depend on the function signature
                test_user_id := auth.sign_up(test_email, 'password123');
                RAISE NOTICE 'Successfully created user with ID: %', test_user_id;
            ELSE
                RAISE NOTICE 'auth.sign_up function does not exist';
            END IF;
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Error using auth.users function: % %', SQLERRM, SQLSTATE;
        END;
    END;
    
    -- Check if we can insert into the profiles table
    IF test_user_id IS NOT NULL THEN
        BEGIN
            RAISE NOTICE 'Attempting to insert into profiles table...';
            
            INSERT INTO public.profiles (id, full_name, role)
            VALUES (test_user_id, 'Test User', 'inspector');
            
            RAISE NOTICE 'Successfully inserted into profiles table';
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Error inserting into profiles table: % %', SQLERRM, SQLSTATE;
        END;
    END IF;
END $$;

-- Check current restrictions on the auth.users table
DO $$
BEGIN
    RAISE NOTICE 'Checking restrictions on auth schema...';
    
    BEGIN
        -- Check if current user can create auth functions
        CREATE OR REPLACE FUNCTION auth.test_function()
        RETURNS void AS $$
        BEGIN
            RAISE NOTICE 'Test function in auth schema';
        END;
        $$ LANGUAGE plpgsql;
        
        RAISE NOTICE 'Successfully created function in auth schema';
        
        DROP FUNCTION IF EXISTS auth.test_function();
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Current role cannot create functions in auth schema';
    WHEN others THEN
        RAISE NOTICE 'Error creating function in auth schema: % %', SQLERRM, SQLSTATE;
    END;
    
    -- Check if we can at least read from auth tables
    BEGIN
        RAISE NOTICE 'Testing SELECT on auth.users...';
        PERFORM count(*) FROM auth.users LIMIT 1;
        RAISE NOTICE 'Successfully queried auth.users table';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Current role cannot read from auth.users table';
    WHEN others THEN
        RAISE NOTICE 'Error reading from auth.users table: % %', SQLERRM, SQLSTATE;
    END;
END $$;

-- Provide recommendations based on observed behavior
DO $$
BEGIN
    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE 'RECOMMENDATIONS:';
    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE '1. If you encountered "insufficient privilege" errors, you need to:';
    RAISE NOTICE '   - Make sure you are running this script as a superuser or a role with appropriate permissions';
    RAISE NOTICE '   - In Supabase, direct manipulation of auth tables is restricted by design';
    RAISE NOTICE '';
    RAISE NOTICE '2. For user creation in Supabase, you should:';
    RAISE NOTICE '   - Use the auth.sign_up API function if available';
    RAISE NOTICE '   - Use the REST API or client libraries for signup in application code';
    RAISE NOTICE '';
    RAISE NOTICE '3. For troubleshooting:';
    RAISE NOTICE '   - Check the profiles table RLS policies as shown above';
    RAISE NOTICE '   - Ensure triggers on auth.users are working correctly';
    RAISE NOTICE '   - Verify that your application has appropriate service role permissions';
    RAISE NOTICE '------------------------------------------------------------';
END $$; 