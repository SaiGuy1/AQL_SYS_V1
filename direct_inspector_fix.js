// direct_inspector_fix.js
// Script to directly fix inspector-location relationships in Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createExampleInspectors() {
  console.log('=== CREATING EXAMPLE INSPECTOR PROFILES ===\n');
  
  try {
    // 1. Check the profiles table structure first
    console.log('1. Checking profiles table structure...');
    
    try {
      const { data: sampleProfile, error: sampleError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
        
      if (sampleError) {
        console.error('Error fetching sample profile:', sampleError.message);
        if (sampleError.code === 'PGRST116') {
          console.error('The profiles table does not exist. You need to create it first.');
          return;
        }
      } else if (sampleProfile && sampleProfile.length > 0) {
        console.log('Detected profile fields:');
        Object.keys(sampleProfile[0]).forEach(key => {
          console.log(`  - ${key}`);
        });
      } else {
        console.log('No existing profiles found, but the table exists');
      }
    } catch (e) {
      console.error('Error checking profiles table:', e.message);
      return;
    }
    
    // 2. Get available locations to use for assignment
    console.log('\n2. Fetching available locations...');
    
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('id, name, location_number')
      .order('location_number', { ascending: true });
      
    if (locationsError) {
      console.error('Error fetching locations:', locationsError.message);
      return;
    }
    
    if (!locations || locations.length === 0) {
      console.error('No locations found. Please create locations first.');
      return;
    }
    
    console.log(`Found ${locations.length} locations available for assignment`);
    console.log(`First location: ${locations[0].name} (${locations[0].id})`);
    console.log(`Second location: ${locations.length > 1 ? locations[1].name : locations[0].name} (${locations.length > 1 ? locations[1].id : locations[0].id})`);
    
    // 3. Create example inspector profiles
    console.log('\n3. Creating example inspector profiles...');
    
    // Generate random UUIDs for the inspector profiles
    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    
    const exampleProfiles = [
      {
        id: generateUUID(),
        name: 'Example Inspector 1',
        email: 'inspector1@example.com',
        role: 'inspector',
        location_id: locations[0].id,
      },
      {
        id: generateUUID(),
        name: 'Example Inspector 2',
        email: 'inspector2@example.com',
        role: 'inspector',
        location_id: locations.length > 1 ? locations[1].id : locations[0].id,
      },
      {
        id: generateUUID(),
        name: 'Example Inspector 3',
        email: 'inspector3@example.com',
        role: 'inspector',
        location_id: locations.length > 2 ? locations[2].id : locations[0].id,
      }
    ];
    
    let successCount = 0;
    for (const profile of exampleProfiles) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([profile]);
        
      if (insertError) {
        console.error(`Error creating example profile for ${profile.name}:`, insertError.message);
        
        // Try alternative approach with only minimal fields if there's an error
        if (insertError.message.includes('column') || insertError.message.includes('field')) {
          // Create the profile with only the minimal set of fields
          const minimalProfile = {
            id: profile.id,
            name: profile.name,
            role: 'inspector',
            location_id: profile.location_id
          };
          
          const { error: retryError } = await supabase
            .from('profiles')
            .insert([minimalProfile]);
            
          if (retryError) {
            console.error(`Retry with minimal fields failed for ${profile.name}:`, retryError.message);
          } else {
            console.log(`✓ Created minimal profile for ${profile.name}`);
            successCount++;
          }
        }
      } else {
        console.log(`✓ Created profile for ${profile.name}`);
        successCount++;
      }
    }
    
    console.log(`\nSuccessfully created ${successCount} out of ${exampleProfiles.length} example inspector profiles`);
    
    // 4. Verify created profiles
    console.log('\n4. Verifying created inspector profiles...');
    
    const { data: inspectorProfiles, error: getError } = await supabase
      .from('profiles')
      .select('id, name, role, location_id')
      .eq('role', 'inspector');
      
    if (getError) {
      console.error('Error fetching inspector profiles:', getError.message);
    } else if (!inspectorProfiles || inspectorProfiles.length === 0) {
      console.error('No inspector profiles found with role = "inspector"');
    } else {
      console.log(`Found ${inspectorProfiles.length} inspector profiles:`);
      inspectorProfiles.forEach(profile => {
        console.log(`  - ${profile.name} (location_id: ${profile.location_id || 'NULL'})`);
      });
    }
    
    console.log('\n=== EXAMPLE INSPECTOR PROFILES CREATION COMPLETED ===');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Main function
async function main() {
  try {
    await createExampleInspectors();
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

main(); 