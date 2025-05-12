-- TEMPORARY SCRIPT: Disable RLS for demo/testing purposes
-- WARNING: Only use this in development/demo environments!
-- Run this in the Supabase SQL Editor

-- Disable RLS on the jobs table
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;

-- Return success message
SELECT 'Row Level Security has been temporarily disabled for the jobs table. 
WARNING: This should only be used in development/testing environments. 
Remember to re-enable RLS before deploying to production.' AS message;

-- When you're ready to re-enable RLS, run this:
-- ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.jobs FORCE ROW LEVEL SECURITY; 