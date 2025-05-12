-- Helper Functions for Enum Type Handling in Supabase
-- Run this script to add functions that help with enum types

-- Function to check if a column is an enum type
CREATE OR REPLACE FUNCTION public.is_column_enum(p_table text, p_column text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_enum boolean;
  type_name text;
BEGIN
  -- Get the data type of the column
  SELECT data_type INTO type_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = p_table
    AND column_name = p_column;
    
  -- Check if the type is an enum (will be 'USER-DEFINED' in information_schema)
  IF type_name = 'USER-DEFINED' THEN
    -- Verify specifically if it's an enum
    SELECT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      JOIN information_schema.columns c ON t.typname = c.udt_name
        AND c.table_schema = n.nspname
      WHERE c.table_schema = 'public'
        AND c.table_name = p_table
        AND c.column_name = p_column
    ) INTO is_enum;
  ELSE
    is_enum := false;
  END IF;
  
  RETURN is_enum;
END;
$$;

-- Function to insert a profile with enum role type
CREATE OR REPLACE FUNCTION public.insert_profile_with_enum_role(
  p_id uuid,
  p_email text,
  p_name text,
  p_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Dynamic SQL to handle the enum casting
  EXECUTE format('
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (%L, %L, %L, %L::user_role)
  ', p_id, p_email, p_name, p_role);
END;
$$;

-- Function to update a profile's role with enum type
CREATE OR REPLACE FUNCTION public.update_profile_role(
  p_id uuid,
  p_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_updated_at boolean;
BEGIN
  -- Check if updated_at column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'updated_at'
  ) INTO has_updated_at;
  
  -- Dynamic SQL to handle the enum casting
  IF has_updated_at THEN
    EXECUTE format('
      UPDATE public.profiles
      SET role = %L::user_role, updated_at = now()
      WHERE id = %L
    ', p_role, p_id);
  ELSE
    EXECUTE format('
      UPDATE public.profiles
      SET role = %L::user_role
      WHERE id = %L
    ', p_role, p_id);
  END IF;
END;
$$;

-- Grant access to the enum helper functions
GRANT EXECUTE ON FUNCTION public.is_column_enum(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.is_column_enum(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_profile_with_enum_role(uuid, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_profile_with_enum_role(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_profile_role(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.update_profile_role(uuid, text) TO authenticated;

-- Test if the profiles.role is an enum
SELECT public.is_column_enum('profiles', 'role');

-- Print the current enum values for user_role
DO $$
DECLARE
  enum_values TEXT;
BEGIN
  SELECT string_agg(enumlabel, ', ') INTO enum_values
  FROM pg_enum
  WHERE enumtypid = 'user_role'::regtype;
  
  RAISE NOTICE 'Current user_role enum values: %', enum_values;
END
$$; 