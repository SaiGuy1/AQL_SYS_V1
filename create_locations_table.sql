-- First, ensure the UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if the location table exists, and if not, create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'locations') THEN
        -- Create the locations table if it doesn't exist
        CREATE TABLE public.locations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            name TEXT NOT NULL,
            location_number INTEGER NOT NULL,
            address TEXT,
            city TEXT,
            state TEXT,
            country TEXT DEFAULT 'USA',
            region TEXT
        );

        -- Add unique constraints
        ALTER TABLE public.locations ADD CONSTRAINT location_number_unique UNIQUE (location_number);
        ALTER TABLE public.locations ADD CONSTRAINT name_unique UNIQUE (name);

        -- Setup RLS
        ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Authenticated users can read locations"
          ON public.locations
          FOR SELECT
          TO authenticated
          USING (true);

        CREATE POLICY "Anonymous users can read locations"
          ON public.locations
          FOR SELECT
          TO anon
          USING (true);

        CREATE POLICY "Admins can manage locations"
          ON public.locations
          FOR ALL
          TO service_role
          USING (true);
        
        RAISE NOTICE 'Created new locations table';
    ELSE
        -- Table exists, check for required columns
        IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.locations'::regclass AND attname = 'location_number' AND NOT attisdropped) THEN
            -- Add the location_number column if it doesn't exist
            ALTER TABLE public.locations ADD COLUMN location_number INTEGER;
            -- Add a unique constraint once we have the column
            ALTER TABLE public.locations ADD CONSTRAINT location_number_unique UNIQUE (location_number);
            RAISE NOTICE 'Added location_number column to existing table';
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.locations'::regclass AND attname = 'name' AND NOT attisdropped) THEN
            -- Add the name column if it doesn't exist
            ALTER TABLE public.locations ADD COLUMN name TEXT;
            -- Add a unique constraint once we have the column
            ALTER TABLE public.locations ADD CONSTRAINT name_unique UNIQUE (name);
            RAISE NOTICE 'Added name column to existing table';
        END IF;
        
        -- Ensure the unique constraints exist
        IF NOT EXISTS (SELECT FROM pg_constraint WHERE conrelid = 'public.locations'::regclass AND conname = 'location_number_unique') THEN
            ALTER TABLE public.locations ADD CONSTRAINT location_number_unique UNIQUE (location_number);
            RAISE NOTICE 'Added missing location_number_unique constraint';
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_constraint WHERE conrelid = 'public.locations'::regclass AND conname = 'name_unique') THEN
            ALTER TABLE public.locations ADD CONSTRAINT name_unique UNIQUE (name);
            RAISE NOTICE 'Added missing name_unique constraint';
        END IF;
        
        RAISE NOTICE 'Locations table already exists, checked for required columns and constraints';
    END IF;
END
$$;

-- Ensure RLS policies exist
DO $$
BEGIN
    -- Check if policies exist before creating them
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'locations' AND policyname = 'Authenticated users can read locations') THEN
        CREATE POLICY "Authenticated users can read locations"
          ON public.locations
          FOR SELECT
          TO authenticated
          USING (true);
        RAISE NOTICE 'Created Authenticated users can read locations policy';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'locations' AND policyname = 'Anonymous users can read locations') THEN
        CREATE POLICY "Anonymous users can read locations"
          ON public.locations
          FOR SELECT
          TO anon
          USING (true);
        RAISE NOTICE 'Created Anonymous users can read locations policy';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'locations' AND policyname = 'Admins can manage locations') THEN
        CREATE POLICY "Admins can manage locations"
          ON public.locations
          FOR ALL
          TO service_role
          USING (true);
        RAISE NOTICE 'Created Admins can manage locations policy';
    END IF;
END
$$;

-- Make sure RLS is enabled
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Now populate or update the table with official AQL locations
INSERT INTO public.locations (location_number, name)
VALUES
  (1, 'Romulus MI'),
  (2, 'Battle Creek MI'),
  (3, 'Grand Rapids MI'),
  (4, 'AAM Three Rivers, MI'),
  (5, 'Chicago, IL'),
  (6, 'Cottondale, AL'),
  (7, 'Kansas City'),
  (8, 'Lansing, MI'),
  (9, 'Thai Summit, E-Town, KY'),
  (10, 'Madisonville'),
  (11, 'KTP KY'),
  (12, 'Lexington KY'),
  (13, 'Granite City IL'),
  (14, 'Louisville KY'),
  (16, 'Grand Blanc MI'),
  (17, 'San Antonio TX'),
  (18, 'Wisconsin'),
  (19, 'Lordstown OH'),
  (21, 'Engineering Services'),
  (22, 'Dallas-Fort Worth'),
  (23, 'Lima OH'),
  (24, 'Hanon'),
  (25, 'London ON (Canada)'),
  (27, 'Rockford IL'),
  (28, 'Saginaw'),
  (29, 'Baltimore MD'),
  (30, 'Indianapolis IN'),
  (31, 'Duncan SC'),
  (32, 'Sharonville OH'),
  (33, 'Auburn AL'),
  (34, 'Plymouth, IN'),
  (35, 'Tillsonburg - Canada'),
  (36, 'Brampton - Ontario'),
  (37, 'Charlotte - NC'),
  (38, 'Atlanta - Georgia'),
  (39, 'Tenneco'),
  (40, 'Tennessee General'),
  (41, 'VW Assembly TN'),
  (42, 'Franklin, OH'),
  (43, 'Lorain, OH'),
  (44, 'NC General'),
  (46, 'Toledo, OH'),
  (47, 'Harness Michigan'),
  (48, 'Jib Street HQ, MI'),
  (49, 'Tenneco, IN'),
  (50, 'MacLean(Master) Inspection'),
  (51, 'MacLean(Master) Staffing'),
  (55, 'Tuscaloosa, AL'),
  (56, 'Utah'),
  (57, 'Yazaki St.Louis'),
  (58, 'Nebraska General'),
  (63, 'ZF Duncan, SC'),
  (64, 'Atkore - Unistrut'),
  (68, 'Detroit Mfg (DMS)'),
  (69, 'Detroit, MI'),
  (70, 'Unique - MI'),
  (71, 'Unique - Concord'),
  (72, 'Unique - Bryan'),
  (73, 'Columbia, IN'),
  (74, 'Contitech - NH')
ON CONFLICT (location_number) DO UPDATE 
SET name = EXCLUDED.name; 