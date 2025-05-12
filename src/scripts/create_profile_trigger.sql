-- Script to create a trigger that ensures every new user has a corresponding profile
-- This should be executed in the Supabase SQL Editor

-- First, let's create a function that will be triggered when a new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.profiles table
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')  -- Default role is 'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger on auth.users table that calls the function after insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a comment explaining what this trigger does
COMMENT ON TRIGGER on_auth_user_created ON auth.users 
  IS 'Trigger to create a corresponding profile for each new user';

-- Verify if the trigger exists
SELECT pg_get_triggerdef(oid) 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Run the following to ensure existing users have profiles
INSERT INTO public.profiles (id, email, name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email) as name,
  COALESCE(raw_user_meta_data->>'role', 'customer') as role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING; 