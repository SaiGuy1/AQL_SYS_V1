-- Functions for verifying table structure

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION public.check_table_exists(table_name text) 
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = $1
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$;

-- Function to get table columns
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text) 
RETURNS json 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(cols)
  FROM (
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = $1
  ) cols INTO result;
  
  RETURN result;
END;
$$;

-- Function to get table policies
CREATE OR REPLACE FUNCTION public.get_table_policies(table_name text) 
RETURNS json 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(pols)
  FROM (
    SELECT policyname, cmd
    FROM pg_policies
    WHERE tablename = $1
    AND schemaname = 'public'
  ) pols INTO result;
  
  RETURN result;
END;
$$;

-- General SQL execution function
CREATE OR REPLACE FUNCTION public.exec_sql(sql text) 
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execute permissions on these functions
GRANT EXECUTE ON FUNCTION public.check_table_exists(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_table_columns(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_table_policies(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon, authenticated, service_role;

-- Verify if functions are created
SELECT proname, proargtypes, prosrc 
FROM pg_proc 
WHERE proname IN ('check_table_exists', 'get_table_columns', 'get_table_policies', 'exec_sql')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'); 