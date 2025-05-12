// Location Initialization Script for AQL System
// ===================================================
//
// This script initializes the locations table with official AQL facility locations.
// It can be run to set up the initial locations or update them if needed.
//
// Prerequisites:
// 1. Node.js installed
// 2. Supabase CLI installed (npm install -g supabase)
// 3. Supabase project set up with proper credentials
//
// To run this script:
// 1. Ensure your Supabase environment variables are set in .env file:
//    - VITE_SUPABASE_URL=your_supabase_url
//    - VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
// 2. Run with Node.js: node src/scripts/initLocations.js
//
// This script will:
// - Check if locations already exist
// - Add missing locations from the official list
// - Report on the operations performed

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase environment variables not set.');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Official AQL locations
const officialLocations = [
  { location_number: 1, name: "Neenah" },
  { location_number: 2, name: "Battle Creek" },
  { location_number: 3, name: "Grand Rapids" },
  { location_number: 4, name: "Chicago" },
  { location_number: 5, name: "Chicago - Komatsu" },
  { location_number: 6, name: "Chicago - CNH" },
  { location_number: 7, name: "Cleveland - Covia" },
  { location_number: 8, name: "Cleveland - Eaton" },
  { location_number: 9, name: "Cleveland - Flats Ind" },
  { location_number: 10, name: "Davenport" },
  { location_number: 11, name: "Decatur" },
  { location_number: 12, name: "Bowling Green" },
  { location_number: 13, name: "Dura Automotive" },
  { location_number: 14, name: "East Peoria" },
  { location_number: 15, name: "Fairfield" },
  { location_number: 16, name: "Flint" },
  { location_number: 17, name: "Fort Smith" },
  { location_number: 18, name: "Fort Wayne" },
  { location_number: 19, name: "Cleveland - Lubrizol" },
  { location_number: 20, name: "Fremont" },
  { location_number: 21, name: "Hamilton" },
  { location_number: 22, name: "Indianapolis" },
  { location_number: 23, name: "Howell" },
  { location_number: 24, name: "Horicon" },
  { location_number: 25, name: "Huntsville" },
  { location_number: 26, name: "Iowa City" },
  { location_number: 27, name: "Jefferson City" },
  { location_number: 28, name: "Kalamazoo" },
  { location_number: 29, name: "Kansas City" },
  { location_number: 30, name: "Lansing" },
  { location_number: 31, name: "Louisville" },
  { location_number: 32, name: "Mayville - MEC" },
  { location_number: 33, name: "Maumee" },
  { location_number: 34, name: "Marion" },
  { location_number: 35, name: "Memphis" },
  { location_number: 36, name: "Middletown - AK Steel" },
  { location_number: 37, name: "Milwaukee - Harley" },
  { location_number: 38, name: "Milwaukee - Rexnord" },
  { location_number: 39, name: "Minneapolis" },
  { location_number: 40, name: "Murfreesboro" },
  { location_number: 41, name: "Nashville" },
  { location_number: 42, name: "New Castle" },
  { location_number: 43, name: "Owensboro" },
  { location_number: 44, name: "Peoria" },
  { location_number: 45, name: "Peoria - CAT Proven Ground" },
  { location_number: 46, name: "Racine" },
  { location_number: 47, name: "Rantoul" },
  { location_number: 48, name: "Richmond" },
  { location_number: 49, name: "Rochelle" },
  { location_number: 50, name: "Sheboygan" },
  { location_number: 51, name: "St. Louis" },
  { location_number: 52, name: "Stone Mountain" },
  { location_number: 53, name: "Tiffin" },
  { location_number: 54, name: "Toledo" },
  { location_number: 55, name: "Toledo - Jeep" },
  { location_number: 56, name: "Traverse City" },
  { location_number: 57, name: "Troy" },
  { location_number: 58, name: "Wausau" },
  { location_number: 59, name: "Wixom" },
  { location_number: 60, name: "York - Harley" },
  { location_number: 61, name: "North Canton" },
  { location_number: 62, name: "Adrian" },
  { location_number: 63, name: "Kendallville" },
  { location_number: 64, name: "Avon Lake" },
  { location_number: 65, name: "Cambridge" },
  { location_number: 66, name: "Alma" },
  { location_number: 67, name: "Kimberly" },
  { location_number: 68, name: "St. Paul" },
  { location_number: 69, name: "Detroit" },
  { location_number: 70, name: "Port Huron" },
  { location_number: 71, name: "Indianapolis - Service" },
  { location_number: 72, name: "Grand Rapids - Denso" },
  { location_number: 73, name: "Detroit - Contitech" },
  { location_number: 74, name: "Contitech - NH" }
];

// Main function to initialize locations
async function initializeLocations() {
  console.log('\n=== AQL LOCATION INITIALIZATION ===');
  console.log('Connecting to Supabase...');
  
  try {
    // Check if we can connect to Supabase
    const { error: connectionError } = await supabase.from('locations').select('count', { count: 'exact', head: true });
    
    if (connectionError) {
      console.error('Error connecting to Supabase:', connectionError.message);
      process.exit(1);
    }
    
    console.log('Successfully connected to Supabase');
    
    // Get existing locations
    const { data: existingLocations, error: fetchError } = await supabase
      .from('locations')
      .select('location_number, name')
      .order('location_number', { ascending: true });
      
    if (fetchError) {
      console.error('Error fetching existing locations:', fetchError.message);
      process.exit(1);
    }
    
    console.log(`Found ${existingLocations.length} existing locations in the database`);
    
    // Determine which locations need to be added
    const existingLocationNumbers = existingLocations.map(loc => loc.location_number);
    const locationsToAdd = officialLocations.filter(loc => 
      !existingLocationNumbers.includes(loc.location_number)
    );
    
    if (locationsToAdd.length === 0) {
      console.log('\n✓ All official locations are already in the database');
      console.log('\nLocation initialization complete!');
      return;
    }
    
    console.log(`\nAdding ${locationsToAdd.length} new locations to the database...`);
    
    // Add new locations
    const { data: insertedData, error: insertError } = await supabase
      .from('locations')
      .insert(locationsToAdd)
      .select();
      
    if (insertError) {
      console.error('Error inserting new locations:', insertError.message);
      process.exit(1);
    }
    
    console.log(`\n✓ Successfully added ${insertedData.length} new locations:`);
    insertedData.forEach(loc => {
      console.log(`  - [${loc.location_number.toString().padStart(2, '0')}] ${loc.name}`);
    });
    
    console.log('\nLocation initialization complete!');
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the initialization
initializeLocations(); 