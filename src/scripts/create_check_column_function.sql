-- Create a function to check if a column exists in a table
-- This is used by the AuthContext to safely create profiles

-- Create the function
CREATE OR REPLACE FUNCTION public.check_column_exists(
  table_name text,
  column_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$;

-- Add a comment explaining what this function does
COMMENT ON FUNCTION public.check_column_exists(text, text) 
  IS 'Checks if a column exists in a table. Returns true if the column exists, false otherwise.';

-- Grant access to the anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.check_column_exists(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_column_exists(text, text) TO authenticated;

-- Test the function
SELECT public.check_column_exists('profiles', 'id');
SELECT public.check_column_exists('profiles', 'created_at'); 