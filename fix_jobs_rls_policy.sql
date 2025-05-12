-- Fix for infinite recursion in jobs table RLS policies
-- Run this in the Supabase SQL Editor

-- First, let's disable RLS temporarily to see the table structure
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on the jobs table to start fresh
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can insert their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can delete their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;
DROP POLICY IF EXISTS "Enable insert access for authenticated users only" ON public.jobs;
DROP POLICY IF EXISTS "Enable update access for users based on user_id" ON public.jobs;
DROP POLICY IF EXISTS "Enable delete access for users based on user_id" ON public.jobs;

-- Create new, simplified policies that avoid recursion
-- Policy for SELECT: Users can see their own jobs
CREATE POLICY "Users can view their own jobs"
ON public.jobs
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for INSERT: Users can create jobs and assign them to themselves
CREATE POLICY "Users can insert their own jobs"
ON public.jobs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can update their own jobs
CREATE POLICY "Users can update their own jobs"
ON public.jobs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE: Users can delete their own jobs
CREATE POLICY "Users can delete their own jobs"
ON public.jobs
FOR DELETE
USING (auth.uid() = user_id);

-- Re-enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Make sure RLS is enforced for all users (including the table owner)
ALTER TABLE public.jobs FORCE ROW LEVEL SECURITY;

-- Display current policies to verify
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'jobs';

-- Return success message
SELECT 'Jobs table RLS policies have been fixed. You should now be able to create jobs without recursion errors.' AS message; 