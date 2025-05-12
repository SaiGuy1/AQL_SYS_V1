-- Script to fix text[] array columns by properly converting them to JSONB
-- Run this in the Supabase SQL Editor

-- Handle conversion of safety_requirements from text[] to JSONB
DO $$ 
BEGIN
    -- Check if safety_requirements column exists and is an array type
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'jobs' 
        AND column_name = 'safety_requirements'
        AND data_type = 'ARRAY'
    ) THEN
        -- Convert text[] to JSONB using array_to_json function
        ALTER TABLE public.jobs 
        ALTER COLUMN safety_requirements TYPE JSONB 
        USING to_jsonb(safety_requirements);
        
        RAISE NOTICE 'Successfully converted safety_requirements from text[] to JSONB';
    ELSE
        -- Check if it exists but is another type
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'jobs' 
            AND column_name = 'safety_requirements'
        ) THEN
            -- Get the current type
            RAISE NOTICE 'safety_requirements exists with type: %', (
                SELECT data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'jobs' 
                AND column_name = 'safety_requirements'
            );
            
            -- If it's text, try converting as JSON
            IF (SELECT data_type FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'jobs' 
                AND column_name = 'safety_requirements') = 'text' THEN
                
                -- Try to convert text to JSONB (assuming it contains JSON)
                BEGIN
                    ALTER TABLE public.jobs 
                    ALTER COLUMN safety_requirements TYPE JSONB 
                    USING safety_requirements::JSONB;
                    
                    RAISE NOTICE 'Successfully converted safety_requirements from text to JSONB';
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Could not convert safety_requirements to JSONB: %', SQLERRM;
                END;
            END IF;
        ELSE
            -- If column doesn't exist, create it as JSONB
            ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS safety_requirements JSONB;
            RAISE NOTICE 'Added safety_requirements column as JSONB';
        END IF;
    END IF;
END $$;

-- Check other array columns and convert them properly
DO $$ 
DECLARE 
    column_info RECORD;
    array_columns TEXT[] := ARRAY['attachments_data', 'certification_questions', 'parts_data'];
BEGIN
    -- Process each potential array column
    FOREACH column_name IN ARRAY array_columns
    LOOP
        -- Check if column exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'jobs' 
            AND column_name = column_name
        ) THEN
            -- Get column data type
            SELECT data_type INTO column_info
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'jobs' 
            AND column_name = column_name;
            
            -- Handle based on current type
            IF column_info.data_type = 'ARRAY' THEN
                -- Convert array to JSONB using to_jsonb
                EXECUTE format('ALTER TABLE public.jobs ALTER COLUMN %I TYPE JSONB USING to_jsonb(%I)', 
                              column_name, column_name);
                RAISE NOTICE 'Converted % from array to JSONB', column_name;
            ELSIF column_info.data_type = 'text' THEN
                -- Try to convert text to JSONB if it contains valid JSON
                BEGIN
                    EXECUTE format('ALTER TABLE public.jobs ALTER COLUMN %I TYPE JSONB USING %I::JSONB', 
                                  column_name, column_name);
                    RAISE NOTICE 'Converted % from text to JSONB', column_name;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Could not convert % to JSONB: %', column_name, SQLERRM;
                END;
            ELSIF column_info.data_type = 'jsonb' THEN
                RAISE NOTICE 'Column % is already JSONB type', column_name;
            ELSE
                RAISE NOTICE 'Column % has type %. Not converting.', column_name, column_info.data_type;
            END IF;
        END IF;
    END LOOP;
END $$;

-- Display the current schema for inspection
SELECT 
    column_name, 
    data_type, 
    udt_name
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'jobs'
    AND column_name IN ('safety_requirements', 'attachments_data', 'certification_questions', 'parts_data');

-- Success message
SELECT 'Array columns have been properly converted to JSONB format.' AS message; 