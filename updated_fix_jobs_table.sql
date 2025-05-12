-- SQL script to add missing columns to the jobs table
-- Run this in the Supabase SQL Editor

-- Add JSON data columns for complex objects
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS attachments_data jsonb DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS safety_requirements jsonb DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS parts_data jsonb DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS certification_questions jsonb DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS customer_data jsonb DEFAULT '{}';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS location_data jsonb DEFAULT '{}';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS customer_name text;

-- Fix any issue with RLS policies - drop ALL possibly existing policies first
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.jobs;
DROP POLICY IF EXISTS "Enable update for all authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.jobs;

-- Create a simpler policy that avoids recursion
CREATE POLICY "Enable update for all authenticated users" 
  ON public.jobs 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Make sure RLS is enabled
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create or replace basic policies for access control - drop existing ones first
DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;
CREATE POLICY "Enable read access for all users" 
  ON public.jobs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.jobs;
CREATE POLICY "Enable insert for authenticated users" 
  ON public.jobs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add any other columns that might be missing but required
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS inspector_id text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS inspector text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS assignedTo text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS estimatedHours numeric DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS location_id text; 