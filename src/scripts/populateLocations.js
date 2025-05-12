/**
 * Script to populate the locations table with official AQL locations
 * 
 * To run this script:
 * 1. Save your Supabase URL and service_role key in .env.local:
 *    SUPABASE_URL=your_supabase_url
 *    SUPABASE_SERVICE_KEY=your_service_role_key
 * 
 * 2. Run the script with Node.js:
 *    node src/scripts/populateLocations.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin privileges
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Must use service_role key for schema changes
const supabase = createClient(supabaseUrl, supabaseKey);

// Official AQL locations with numeric IDs
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

// Main function to set up the locations table
async function setupLocationsTable() {
  console.log('Starting locations table setup...');
  
  try {
    // 1. Check if location_number column exists, if not add it
    const { error: columnCheckError } = await supabase.rpc('schema_check_column_exists', {
      target_table: 'locations',
      target_column: 'location_number'
    });
    
    if (columnCheckError) {
      console.log('Adding location_number column to locations table...');
      
      // SQL to add the column
      const { error: addColumnError } = await supabase.rpc('exec_sql', {
        sql_string: 'ALTER TABLE locations ADD COLUMN IF NOT EXISTS location_number integer'
      });
      
      if (addColumnError) {
        throw new Error(`Failed to add location_number column: ${addColumnError.message}`);
      }
      
      console.log('location_number column added successfully');
    } else {
      console.log('location_number column already exists');
    }
    
    // 2. Add unique constraints on location_number and name
    console.log('Setting up unique constraints...');
    
    // First check if constraints exist
    const { error: constraintCheckError } = await supabase.rpc('schema_check_constraint_exists', {
      target_table: 'locations',
      constraint_name: 'locations_location_number_key'
    });
    
    if (constraintCheckError) {
      const { error: addConstraintsError } = await supabase.rpc('exec_sql', {
        sql_string: `
          ALTER TABLE locations ADD CONSTRAINT locations_location_number_key UNIQUE (location_number);
          ALTER TABLE locations ADD CONSTRAINT locations_name_key UNIQUE (name);
        `
      });
      
      if (addConstraintsError) {
        throw new Error(`Failed to add constraints: ${addConstraintsError.message}`);
      }
      
      console.log('Unique constraints added successfully');
    } else {
      console.log('Unique constraints already exist');
    }
    
    // 3. Clear existing locations if needed
    const { error: clearError } = await supabase.from('locations').delete().not('id', 'is', null);
    
    if (clearError) {
      throw new Error(`Failed to clear existing locations: ${clearError.message}`);
    }
    
    console.log('Cleared existing locations');
    
    // 4. Insert the official locations
    const { error: insertError } = await supabase.from('locations').insert(officialLocations);
    
    if (insertError) {
      throw new Error(`Failed to insert locations: ${insertError.message}`);
    }
    
    console.log(`Successfully inserted ${officialLocations.length} official AQL locations`);
    
    // 5. Verify the locations were inserted
    const { data: verifyData, error: verifyError } = await supabase
      .from('locations')
      .select('id, name, location_number')
      .order('location_number', { ascending: true });
    
    if (verifyError) {
      throw new Error(`Failed to verify locations: ${verifyError.message}`);
    }
    
    console.log(`Verification complete: ${verifyData.length} locations in the database`);
    console.log(verifyData.map(l => `${l.location_number.toString().padStart(2, '0')} - ${l.name}`).join('\n'));
    
    console.log('Locations table setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up locations table:', error);
  }
}

// Run the setup function
setupLocationsTable(); 