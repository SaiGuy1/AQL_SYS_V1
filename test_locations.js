// Simple script to test if Supabase is returning locations
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Set up directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Get Supabase credentials from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables not set in .env file');
  
  // Try to read the .env file directly
  try {
    const envContent = fs.readFileSync(`${__dirname}/.env`, 'utf8');
    console.log('Contents of .env file:');
    console.log(envContent);
  } catch (err) {
    console.error('Could not read .env file:', err.message);
  }
  
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLocations() {
  console.log('Testing connection to Supabase...');
  
  try {
    console.log('Fetching locations...');
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
    } else {
      console.log('No locations found in the database.');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testLocations()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 