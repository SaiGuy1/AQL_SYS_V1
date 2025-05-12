// Simple script to test if we can insert and then read back a location
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables not set in .env file');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsertAndReadLocation() {
  console.log('Testing connection to Supabase...');
  
  try {
    // First, attempt to insert a test location
    const testLocation = {
      name: 'Test Location ' + new Date().toISOString(),
      location_number: 999,  // Use a number unlikely to conflict
    };
    
    console.log('Inserting test location:', testLocation);
    
    const { data: insertData, error: insertError } = await supabase
      .from('locations')
      .insert([testLocation])
      .select();
    
    if (insertError) {
      console.error('Error inserting test location:', insertError);
      console.log('This may indicate a permissions issue with the service role.');
    } else {
      console.log('Successfully inserted test location:', insertData);
    }
    
    // Now try to read all locations
    console.log('Fetching all locations...');
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('location_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching locations:', error);
      return;
    }
    
    console.log(`Successfully fetched ${data.length} locations`);
    if (data.length > 0) {
      console.log('First location:', data[0]);
      console.log('Last location:', data[data.length - 1]);
      
      // Try to find our test location
      const foundTestLocation = data.find(loc => loc.location_number === 999);
      if (foundTestLocation) {
        console.log('Found our test location in the results!', foundTestLocation);
      } else {
        console.log('Could not find our test location in the results.');
      }
    } else {
      console.log('No locations found in the database.');
    }
    
    // Try the simplified query used in the application
    console.log('\nTrying the exact query used in the application:');
    const { data: simpleData, error: simpleError } = await supabase
      .from('locations')
      .select('*');
    
    if (simpleError) {
      console.error('Error with simple query:', simpleError);
    } else {
      console.log(`Simple query returned ${simpleData.length} locations`);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testInsertAndReadLocation()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 