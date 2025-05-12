// Using CommonJS syntax
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get environment variables for Supabase connection
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables not set.');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Official AQL locations
const officialLocations = [
  { location_number: 1, name: "Romulus MI" },
  { location_number: 2, name: "Battle Creek MI" },
  { location_number: 3, name: "Grand Rapids MI" },
  { location_number: 4, name: "AAM Three Rivers, MI" },
  { location_number: 5, name: "Chicago, IL" },
  { location_number: 6, name: "Cottondale, AL" },
  { location_number: 7, name: "Kansas City" },
  { location_number: 8, name: "Lansing, MI" },
  { location_number: 9, name: "Thai Summit, E-Town, KY" },
  { location_number: 10, name: "Madisonville" },
  { location_number: 11, name: "KTP KY" },
  { location_number: 12, name: "Lexington KY" },
  { location_number: 13, name: "Granite City IL" },
  { location_number: 14, name: "Louisville KY" },
  { location_number: 16, name: "Grand Blanc MI" },
  { location_number: 17, name: "San Antonio TX" },
  { location_number: 18, name: "Wisconsin" },
  { location_number: 19, name: "Lordstown OH" },
  { location_number: 21, name: "Engineering Services" },
  { location_number: 22, name: "Dallas-Fort Worth" },
  { location_number: 23, name: "Lima OH" },
  { location_number: 24, name: "Hanon" },
  { location_number: 25, name: "London ON (Canada)" },
  { location_number: 27, name: "Rockford IL" },
  { location_number: 28, name: "Saginaw" },
  { location_number: 29, name: "Baltimore MD" },
  { location_number: 30, name: "Indianapolis IN" },
  { location_number: 31, name: "Duncan SC" },
  { location_number: 32, name: "Sharonville OH" },
  { location_number: 33, name: "Auburn AL" },
  { location_number: 34, name: "Plymouth, IN" },
  { location_number: 35, name: "Tillsonburg - Canada" },
  { location_number: 36, name: "Brampton - Ontario" },
  { location_number: 37, name: "Charlotte - NC" },
  { location_number: 38, name: "Atlanta - Georgia" },
  { location_number: 39, name: "Tenneco" },
  { location_number: 40, name: "Tennessee General" },
  { location_number: 41, name: "VW Assembly TN" },
  { location_number: 42, name: "Franklin, OH" },
  { location_number: 43, name: "Lorain, OH" },
  { location_number: 44, name: "NC General" },
  { location_number: 46, name: "Toledo, OH" },
  { location_number: 47, name: "Harness Michigan" },
  { location_number: 48, name: "Jib Street HQ, MI" },
  { location_number: 49, name: "Tenneco, IN" },
  { location_number: 50, name: "MacLean(Master) Inspection" },
  { location_number: 51, name: "MacLean(Master) Staffing" },
  { location_number: 55, name: "Tuscaloosa, AL" },
  { location_number: 56, name: "Utah" },
  { location_number: 57, name: "Yazaki St.Louis" },
  { location_number: 58, name: "Nebraska General" },
  { location_number: 63, name: "ZF Duncan, SC" },
  { location_number: 64, name: "Atkore - Unistrut" },
  { location_number: 68, name: "Detroit Mfg (DMS)" },
  { location_number: 69, name: "Detroit, MI" },
  { location_number: 70, name: "Unique - MI" },
  { location_number: 71, name: "Unique - Concord" },
  { location_number: 72, name: "Unique - Bryan" },
  { location_number: 73, name: "Columbia, IN" },
  { location_number: 74, name: "Contitech - NH" }
];

// Main function to check schema and update locations
async function updateLocationsTable() {
  console.log('\n=== AQL LOCATIONS TABLE UPDATE ===');
  console.log('Connecting to Supabase...');
  
  try {
    // Check if we can connect to Supabase
    const { error: connectionError } = await supabase.from('locations').select('count', { count: 'exact', head: true });
    
    if (connectionError) {
      console.error('Error connecting to Supabase:', connectionError.message);
      process.exit(1);
    }
    
    console.log('Successfully connected to Supabase');
    
    // First step: Check the current schema of locations table
    console.log('1. Checking current schema of locations table...');
    
    // Get existing locations to check the schema
    const { data: existingLocations, error: fetchError } = await supabase
      .from('locations')
      .select('*')
      .limit(1);
      
    if (fetchError) {
      console.error('Error fetching locations table schema:', fetchError.message);
      
      if (fetchError.message.includes("relation") && fetchError.message.includes("does not exist")) {
        console.log('\n⚠️ The locations table does not exist.');
        console.log('\nRun the following SQL in the Supabase SQL Editor to create the table:');
        console.log(`
-- First, ensure the UUID extension is available (it usually is by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the locations table
CREATE TABLE IF NOT EXISTS public.locations (
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
ALTER TABLE public.locations DROP CONSTRAINT IF EXISTS location_number_unique;
ALTER TABLE public.locations ADD CONSTRAINT location_number_unique UNIQUE (location_number);

ALTER TABLE public.locations DROP CONSTRAINT IF EXISTS name_unique;
ALTER TABLE public.locations ADD CONSTRAINT name_unique UNIQUE (name);

-- Setup RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read locations" ON public.locations;
DROP POLICY IF EXISTS "Anonymous users can read locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can manage locations" ON public.locations;

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
`);
        console.log('\nAfter creating the table, run this script again to populate it with locations.\n');
        process.exit(1);
      }
      
      process.exit(1);
    }
    
    // Check if required fields exist
    const hasRequiredFields = existingLocations && existingLocations.length > 0 && 
                             'location_number' in existingLocations[0] &&
                             'name' in existingLocations[0];
    
    // If the required fields don't exist, we need to create them
    if (!hasRequiredFields) {
      console.log('\n⚠️ The locations table exists but is missing required fields.');
      console.log('\nRun the following SQL in the Supabase SQL Editor to update the table:');
      console.log(`
-- First, ensure the UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- If the table exists but is missing fields, drop and recreate it
DROP TABLE IF EXISTS public.locations;

-- Create the locations table
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
`);
      console.log('\nAfter updating the table structure, run this script again to populate it with locations.\n');
      process.exit(1);
    }
    
    console.log('✓ Required fields are present in the schema.');
    
    // Second step: Get existing locations
    console.log('\n2. Fetching existing locations...');
    const { data: allExistingLocations, error: allFetchError } = await supabase
      .from('locations')
      .select('id, location_number, name')
      .order('location_number', { ascending: true });
      
    if (allFetchError) {
      console.error('Error fetching existing locations:', allFetchError.message);
      process.exit(1);
    }
    
    console.log(`Found ${allExistingLocations.length} existing locations in the database.`);
    
    // Map existing locations by location_number for quick lookup
    const existingLocationMap = {};
    allExistingLocations.forEach(loc => {
      existingLocationMap[loc.location_number] = loc;
    });
    
    // Third step: Insert or update locations
    console.log('\n3. Inserting or updating official locations...');
    
    // Track statistics for reporting
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    
    // Process each official location
    for (const location of officialLocations) {
      // Check if this location number already exists
      if (existingLocationMap[location.location_number]) {
        const existingLoc = existingLocationMap[location.location_number];
        
        // If the name is different, update it
        if (existingLoc.name !== location.name) {
          console.log(`- Updating location ${location.location_number}: "${existingLoc.name}" -> "${location.name}"`);
          
          const { error: updateError } = await supabase
            .from('locations')
            .update({ name: location.name })
            .eq('id', existingLoc.id);
            
          if (updateError) {
            console.error(`  Error updating location ${location.location_number}:`, updateError.message);
            continue;
          }
          
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Insert new location
        console.log(`- Inserting new location ${location.location_number}: "${location.name}"`);
        
        const { error: insertError } = await supabase
          .from('locations')
          .insert(location);
          
        if (insertError) {
          console.error(`  Error inserting location ${location.location_number}:`, insertError.message);
          continue;
        }
        
        inserted++;
      }
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total official locations: ${officialLocations.length}`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped (already up-to-date): ${skipped}`);
    console.log(`Failed: ${officialLocations.length - (inserted + updated + skipped)}`);
    
    if (inserted + updated > 0) {
      console.log('\n✅ Locations table has been successfully updated with official locations.');
    } else {
      console.log('\n✓ No changes were needed. Locations table already has all official locations.');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the main function
updateLocationsTable().then(() => {
  console.log('\nScript completed.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 