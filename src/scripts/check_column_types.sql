-- Script to check column types for all ID fields and role fields
-- This will help us understand the exact type mismatches

SELECT 
  table_name, 
  column_name, 
  data_type,
  udt_name  -- This shows the underlying type name
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' AND 
  (column_name LIKE '%id' OR column_name = 'role') 
ORDER BY 
  table_name, 
  column_name; 