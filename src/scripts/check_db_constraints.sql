-- Script to check database constraints and settings that might affect user registration
-- Run this in the Supabase SQL Editor to diagnose registration issues

-- Check if email domains are restricted
DO $$
BEGIN
    RAISE NOTICE 'Checking for email domain restrictions...';
    
    -- Check auth.email_domains if it exists
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'auth' AND table_name = 'email_domains'
        ) THEN
            RAISE NOTICE 'auth.email_domains table exists, checking for restrictions...';
            
            BEGIN
                PERFORM count(*) FROM auth.email_domains LIMIT 1;
                RAISE NOTICE 'Email domain restrictions may be in place';
            EXCEPTION WHEN insufficient_privilege THEN
                RAISE NOTICE 'Cannot read auth.email_domains due to insufficient privileges';
            WHEN others THEN
                RAISE NOTICE 'Error reading auth.email_domains: % %', SQLERRM, SQLSTATE;
            END;
        ELSE
            RAISE NOTICE 'auth.email_domains table does not exist, likely no domain restrictions';
        END IF;
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Cannot check auth.email_domains table existence due to insufficient privileges';
    END;
END $$;

-- Check database configuration for max connections and user limits
DO $$
BEGIN
    RAISE NOTICE 'Checking database configuration...';
    
    -- Check max_connections
    BEGIN
        SELECT current_setting('max_connections') AS max_connections;
        RAISE NOTICE 'Max connections: %', current_setting('max_connections');
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'Error checking max_connections: % %', SQLERRM, SQLSTATE;
    END;
    
    -- Check active connections
    BEGIN
        SELECT count(*) FROM pg_stat_activity;
        RAISE NOTICE 'Current active connections: %', (SELECT count(*) FROM pg_stat_activity);
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'Error checking active connections: % %', SQLERRM, SQLSTATE;
    END;
END $$;

-- Check if profiles table has required columns for new users
DO $$
BEGIN
    RAISE NOTICE 'Checking profiles table structure...';
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN
        RAISE NOTICE 'profiles table exists, checking columns...';
        
        -- Check for required columns
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id'
        ) THEN
            RAISE NOTICE 'profiles.id column exists';
        ELSE
            RAISE NOTICE 'WARNING: profiles.id column does not exist!';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
        ) THEN
            RAISE NOTICE 'profiles.role column exists';
        ELSE
            RAISE NOTICE 'WARNING: profiles.role column does not exist!';
        END IF;
        
        -- Check constraints on profiles table
        RAISE NOTICE 'Checking constraints on profiles table...';
        FOR constraint_rec IN
            SELECT conname, contype, pg_get_constraintdef(oid) as constraintdef
            FROM pg_constraint
            WHERE conrelid = 'public.profiles'::regclass
        LOOP
            RAISE NOTICE 'Constraint: %, Type: %, Definition: %', 
                constraint_rec.conname, 
                constraint_rec.contype, 
                constraint_rec.constraintdef;
        END LOOP;
        
        -- Check for NOT NULL constraints
        RAISE NOTICE 'Checking NOT NULL constraints on profiles columns...';
        FOR column_rec IN
            SELECT column_name, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'profiles'
        LOOP
            RAISE NOTICE 'Column: %, Nullable: %', column_rec.column_name, column_rec.is_nullable;
        END LOOP;
    ELSE
        RAISE NOTICE 'WARNING: profiles table does not exist!';
    END IF;
END $$;

-- Check triggers on profiles table
DO $$
BEGIN
    RAISE NOTICE 'Checking triggers on profiles table...';
    
    FOR trigger_rec IN
        SELECT tgname, tgenabled, tgtype, 
               pg_get_triggerdef(t.oid) as triggerdef
        FROM pg_trigger t
        WHERE tgrelid = 'public.profiles'::regclass
    LOOP
        RAISE NOTICE 'Trigger: %, Enabled: %, Type: %, Definition: %', 
            trigger_rec.tgname, 
            trigger_rec.tgenabled, 
            trigger_rec.tgtype, 
            trigger_rec.triggerdef;
    END LOOP;
END $$;

-- Check if there are any row limits or quotas
DO $$
BEGIN
    RAISE NOTICE 'Checking for row limits or quotas...';
    
    -- Check current row counts
    BEGIN
        RAISE NOTICE 'Current row counts:';
        RAISE NOTICE '- profiles: %', (SELECT count(*) FROM public.profiles);
        RAISE NOTICE '- inspector_locations: %', (SELECT count(*) FROM public.inspector_locations);
        
        -- Try to get auth.users count, may fail due to permissions
        BEGIN
            PERFORM count(*) FROM auth.users;
            RAISE NOTICE '- auth.users: %', (SELECT count(*) FROM auth.users);
        EXCEPTION WHEN insufficient_privilege THEN
            RAISE NOTICE '- auth.users: Cannot access due to permissions';
        WHEN others THEN
            RAISE NOTICE '- auth.users: Error accessing - % %', SQLERRM, SQLSTATE;
        END;
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'Error checking row counts: % %', SQLERRM, SQLSTATE;
    END;
END $$;

-- Check extension availability that may affect auth
DO $$
BEGIN
    RAISE NOTICE 'Checking for required extensions...';
    
    FOR ext_rec IN
        SELECT name, default_version, installed_version
        FROM pg_available_extensions
        WHERE name IN ('uuid-ossp', 'pgcrypto', 'pgjwt')
    LOOP
        RAISE NOTICE 'Extension: %, Default version: %, Installed version: %', 
            ext_rec.name, 
            ext_rec.default_version, 
            ext_rec.installed_version;
    END LOOP;
END $$;

-- Check for RLS policy application errors in the logs (needs appropriate privileges)
DO $$
BEGIN
    RAISE NOTICE 'Checking for recent errors in logs (if accessible)...';
    
    BEGIN
        -- This may fail due to permissions, which is expected
        SELECT count(*) FROM pg_stat_activity 
        WHERE query ILIKE '%error%' AND backend_type = 'client backend' 
        AND query_start > now() - interval '1 hour';
        
        RAISE NOTICE 'Recent error queries in last hour: %', 
            (SELECT count(*) FROM pg_stat_activity 
             WHERE query ILIKE '%error%' AND backend_type = 'client backend' 
             AND query_start > now() - interval '1 hour');
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Cannot check error logs due to insufficient privileges';
    WHEN others THEN
        RAISE NOTICE 'Error checking logs: % %', SQLERRM, SQLSTATE;
    END;
END $$;

-- Final summary and recommendations
DO $$
BEGIN
    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE 'SUMMARY:';
    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE '1. If you see constraint violations or NOT NULL errors:';
    RAISE NOTICE '   - Check whether your signup process populates all required fields';
    RAISE NOTICE '   - Verify that the auth trigger properly creates profile entries';
    RAISE NOTICE '';
    RAISE NOTICE '2. If there are triggers on the profiles table:';
    RAISE NOTICE '   - Make sure they are not interfering with the signup process';
    RAISE NOTICE '   - Check for any validation logic that might be rejecting new users';
    RAISE NOTICE '';
    RAISE NOTICE '3. For further troubleshooting:';
    RAISE NOTICE '   - Try creating a basic user directly through the Supabase dashboard';
    RAISE NOTICE '   - Check Supabase logs for any auth-related errors';
    RAISE NOTICE '   - Verify that your database is not hitting resource limits';
    RAISE NOTICE '------------------------------------------------------------';
END $$; 