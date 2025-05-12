-- Fix for profiles table to resolve user creation issues
-- Run this in the Supabase SQL Editor to ensure the profiles table is properly set up

-- 1. Create the user_role enum type if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'supervisor', 'inspector', 'hr', 'customer');
  END IF;
END $$;

-- 2. Check if the profiles table exists, and create it if not
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  role user_role,  -- Using the enum type instead of TEXT
  location_id UUID REFERENCES public.locations(id),
  active_sessions INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),  -- This may not exist in your current table
  isAvailable BOOLEAN DEFAULT TRUE
);

-- 3. Check if updated_at column exists and add it if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 4. Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_location_id ON public.profiles(location_id);

-- 5. Drop existing function and trigger to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 6. Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a row into public.profiles
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    )
  );
  
  -- Update the role if it's in the metadata
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    UPDATE public.profiles
    SET role = (NEW.raw_user_meta_data->>'role')::user_role
    WHERE id = NEW.id;
  END IF;
  
  -- Update the location_id if it's in the metadata
  IF NEW.raw_user_meta_data->>'location_id' IS NOT NULL THEN
    UPDATE public.profiles
    SET location_id = (NEW.raw_user_meta_data->>'location_id')::UUID
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create the trigger to automatically create a profile when a new user is created
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 8. Ensure the RLS policies are set up correctly
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 9. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can insert profiles" ON public.profiles;

-- 10. Create simplified policies that avoid recursion
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles (using JWT claims only)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- Allow managers to view all profiles (using JWT claims only)
CREATE POLICY "Managers can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'manager');

-- Allow admins to update all profiles (using JWT claims only)
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- Allow admins to insert profiles (using JWT claims only)
CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- Allow managers to insert profiles (using JWT claims only)
CREATE POLICY "Managers can insert profiles" 
ON public.profiles 
FOR INSERT
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'manager');

-- 11. Create a function to fix profile entries for existing users that handles missing updated_at column
CREATE OR REPLACE FUNCTION fix_missing_profiles() 
RETURNS TEXT AS $$
DECLARE
  user_count INTEGER := 0;
  existing_users INTEGER := 0;
  missing_users INTEGER := 0;
  fixed_users INTEGER := 0;
  has_updated_at BOOLEAN;
BEGIN
  -- Check if updated_at column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) INTO has_updated_at;

  -- Count total users
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- Count existing profiles
  SELECT COUNT(*) INTO existing_users FROM public.profiles;
  
  -- Calculate missing profiles
  missing_users := user_count - existing_users;
  
  -- For each user without a profile, create one
  IF has_updated_at THEN
    -- With updated_at column
    INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
    SELECT 
      u.id, 
      u.email, 
      COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email),
      COALESCE(u.raw_user_meta_data->>'role', 'customer')::user_role,
      COALESCE(u.created_at, NOW()),
      NOW()
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL;
  ELSE
    -- Without updated_at column
    INSERT INTO public.profiles (id, email, name, role, created_at)
    SELECT 
      u.id, 
      u.email, 
      COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email),
      COALESCE(u.raw_user_meta_data->>'role', 'customer')::user_role,
      COALESCE(u.created_at, NOW())
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL;
  END IF;
  
  -- Count how many were fixed
  GET DIAGNOSTICS fixed_users = ROW_COUNT;
  
  RETURN 'Fixed ' || fixed_users || ' missing profiles out of ' || missing_users || ' (Total users: ' || user_count || ')';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Run the fix to create missing profiles
SELECT fix_missing_profiles();

-- 13. Fix the user_locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, location_id)
);

-- 14. Add RLS policies to user_locations table
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own locations" ON public.user_locations;
DROP POLICY IF EXISTS "Admins can manage all user locations" ON public.user_locations;
DROP POLICY IF EXISTS "Managers can manage all user locations" ON public.user_locations;

-- Create simplified policies
CREATE POLICY "Users can view their own locations" 
ON public.user_locations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user locations" 
ON public.user_locations 
FOR ALL
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

CREATE POLICY "Managers can manage all user locations" 
ON public.user_locations 
FOR ALL
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'manager');

-- 15. Create RPC function to safely get a user's role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION get_user_role_rpc(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT FROM profiles WHERE id = user_id;
$$; 