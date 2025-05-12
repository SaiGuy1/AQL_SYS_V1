-- Setup User Authentication System
-- This script creates the necessary profiles schema and triggers for user auth

-- 1. Ensure the public.profiles table exists with the correct schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'supervisor', 'inspector', 'hr', 'customer')),
  location_id UUID REFERENCES public.locations(id),
  active_sessions INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  isAvailable BOOLEAN DEFAULT TRUE
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_location_id ON public.profiles(location_id);

-- 3. Create or replace function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Drop any existing trigger to avoid duplicates (as specified in requirements)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 5. Create the trigger to automatically create a profile entry when a new user is created
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 6. Create function to check and limit active sessions
CREATE OR REPLACE FUNCTION public.check_session_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment the active_sessions count for the user
  UPDATE public.profiles 
  SET active_sessions = active_sessions + 1
  WHERE id = NEW.user_id;
  
  -- Check if user now has more than 3 active sessions
  IF (SELECT active_sessions FROM public.profiles WHERE id = NEW.user_id) > 3 THEN
    -- Keep only the 3 most recent sessions by deleting the oldest
    DELETE FROM auth.sessions
    WHERE user_id = NEW.user_id
    AND created_at < (
      SELECT created_at FROM auth.sessions
      WHERE user_id = NEW.user_id
      ORDER BY created_at DESC
      LIMIT 1 OFFSET 2
    );
    
    -- Reset the counter to 3
    UPDATE public.profiles 
    SET active_sessions = 3
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for session management
DROP TRIGGER IF EXISTS on_auth_session_created ON auth.sessions;
CREATE TRIGGER on_auth_session_created
AFTER INSERT ON auth.sessions
FOR EACH ROW
EXECUTE FUNCTION public.check_session_limit();

-- 8. Create function to decrement session count on logout/expiry
CREATE OR REPLACE FUNCTION public.handle_session_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement the active_sessions count when a session is deleted
  UPDATE public.profiles 
  SET active_sessions = GREATEST(0, active_sessions - 1)
  WHERE id = OLD.user_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for session deletion
DROP TRIGGER IF EXISTS on_auth_session_deleted ON auth.sessions;
CREATE TRIGGER on_auth_session_deleted
AFTER DELETE ON auth.sessions
FOR EACH ROW
EXECUTE FUNCTION public.handle_session_delete();

-- 10. Set up RLS policies for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to view and update their own profile
CREATE POLICY IF NOT EXISTS "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for admin/manager to view all profiles
CREATE POLICY IF NOT EXISTS "Admin/Manager can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IN (
  SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
));

-- Policy for admin/manager to update profiles
CREATE POLICY IF NOT EXISTS "Admin/Manager can update all profiles"
ON public.profiles
FOR UPDATE
USING (auth.uid() IN (
  SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
))
WITH CHECK (auth.uid() IN (
  SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
));

-- Policy for admin/manager to delete profiles
CREATE POLICY IF NOT EXISTS "Admin/Manager can delete profiles"
ON public.profiles
FOR DELETE
USING (auth.uid() IN (
  SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
));

-- Ensure anon role can insert into profiles (for registration)
CREATE POLICY IF NOT EXISTS "Public registration"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id); 