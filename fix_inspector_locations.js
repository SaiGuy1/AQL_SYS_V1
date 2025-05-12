// fix_inspector_locations.js
// Script to fix inspector-location relationships in Supabase
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

async function checkColumnExists(table, column) {
  try {
    // Use dynamic SQL to check if column exists
    const sql = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = '${table}' 
      AND column_name = '${column}'
    `;
    
    const { data, error } = await supabase.rpc('pgadmin_exec_sql', { sql });
    
    if (error) {
      console.error(`Error checking if ${column} exists in ${table}:`, error.message);
      // Fallback approach: try to get a row and check if the column exists
      const { data: sample, error: sampleError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (sampleError) {
        console.error(`Error fetching sample from ${table}:`, sampleError.message);
        return false;
      }
      
      if (sample && sample.length > 0) {
        return column in sample[0];
      }
      
      return false;
    }
    
    const parsedData = JSON.parse(data);
    return parsedData && parsedData.length > 0;
  } catch (error) {
    console.error(`Error checking if ${column} exists in ${table}:`, error.message);
    return false;
  }
}

async function fixInspectorLocations() {
  console.log('=== FIXING INSPECTOR-LOCATION RELATIONSHIPS ===\n');
  
  try {
    // 1. Check if the profiles table has the location_id column
    console.log('1. Checking for location_id column in profiles table...');
    
    const hasLocationIdColumn = await checkColumnExists('profiles', 'location_id');
    
    // If location_id column doesn't exist, add it
    if (!hasLocationIdColumn) {
      console.log('location_id column not found in profiles table. Adding it...');
      
      // SQL to add the location_id column
      const addColumnSQL = `
        ALTER TABLE public.profiles
        ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);
      `;
      
      const { error: alterError } = await supabase.rpc('pgadmin_exec_sql', { sql: addColumnSQL });
      
      if (alterError) {
        console.error('Error adding location_id column:', alterError.message);
        throw alterError;
      }
      
      console.log('✓ Successfully added location_id column to profiles table');
    } else {
      console.log('✓ location_id column already exists in profiles table');
    }
    
    // 2. Check if there are any inspectors with no location_id
    console.log('\n2. Checking for inspectors without location_id...');
    
    const { data: inspectorsWithoutLocation, error: inspectorError } = await supabase
      .from('profiles')
      .select('id, user_id, name, email, role, location_id')
      .eq('role', 'inspector')
      .is('location_id', null);
      
    if (inspectorError) {
      console.error('Error fetching inspectors:', inspectorError.message);
      throw inspectorError;
    }
    
    if (!inspectorsWithoutLocation || inspectorsWithoutLocation.length === 0) {
      console.log('✓ All inspectors have a location_id assigned');
    } else {
      console.log(`Found ${inspectorsWithoutLocation.length} inspectors without a location_id:`);
      
      // 3. Get the first available location to assign
      console.log('\n3. Fetching available locations...');
      
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('id, name, location_number')
        .limit(1);
        
      if (locationsError) {
        console.error('Error fetching locations:', locationsError.message);
        throw locationsError;
      }
      
      if (!locations || locations.length === 0) {
        console.error('❌ No locations found in the database. Please create locations first.');
        return;
      }
      
      const defaultLocationId = locations[0].id;
      console.log(`Using default location: ${locations[0].name} (${defaultLocationId})`);
      
      // 4. Update the inspectors with the default location
      console.log('\n4. Updating inspectors with default location...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ location_id: defaultLocationId })
        .eq('role', 'inspector')
        .is('location_id', null);
        
      if (updateError) {
        console.error('Error updating inspectors:', updateError.message);
        throw updateError;
      }
      
      console.log(`✓ Successfully updated ${inspectorsWithoutLocation.length} inspectors with location_id: ${defaultLocationId}`);
    }
    
    // 5. Check if the inspectors table exists and sync if it does
    console.log('\n5. Checking for inspectors table...');
    
    try {
      const { data: inspectorsCount, error: inspectorsCountError } = await supabase
        .from('inspectors')
        .select('*', { count: 'exact', head: true });
        
      if (inspectorsCountError) {
        console.log('Inspectors table does not exist or cannot be accessed, skipping sync step');
      } else {
        console.log('✓ Inspectors table exists with accessible records');
        
        // Sync inspectors between profiles and inspectors tables
        console.log('\n6. Syncing inspectors between profiles and inspectors tables...');
        
        // Get all inspectors from profiles
        const { data: profileInspectors, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, name, email, role, location_id')
          .eq('role', 'inspector');
          
        if (profilesError) {
          console.error('Error fetching profile inspectors:', profilesError.message);
          throw profilesError;
        }
        
        if (!profileInspectors || profileInspectors.length === 0) {
          console.log('No inspectors found in profiles table, skipping sync');
        } else {
          console.log(`Found ${profileInspectors.length} inspectors in profiles table`);
          
          // For each inspector in profiles, make sure they're in the inspectors table
          let syncedCount = 0;
          
          for (const inspector of profileInspectors) {
            // Check if inspector exists in inspectors table
            const { data: existingInspector, error: checkError } = await supabase
              .from('inspectors')
              .select('id, user_id')
              .eq('user_id', inspector.user_id)
              .maybeSingle();
              
            if (checkError) {
              console.error(`Error checking for inspector ${inspector.user_id}:`, checkError.message);
              continue;
            }
            
            if (existingInspector) {
              // Update the existing inspector record
              const { error: updateError } = await supabase
                .from('inspectors')
                .update({
                  name: inspector.name,
                  email: inspector.email,
                  role: inspector.role,
                  location_id: inspector.location_id
                })
                .eq('user_id', inspector.user_id);
                
              if (updateError) {
                console.error(`Error updating inspector ${inspector.user_id}:`, updateError.message);
              } else {
                syncedCount++;
              }
            } else {
              // Insert a new inspector record
              const { error: insertError } = await supabase
                .from('inspectors')
                .insert([{
                  user_id: inspector.user_id,
                  name: inspector.name,
                  email: inspector.email,
                  role: inspector.role,
                  location_id: inspector.location_id
                }]);
                
              if (insertError) {
                console.error(`Error inserting inspector ${inspector.user_id}:`, insertError.message);
              } else {
                syncedCount++;
              }
            }
          }
          
          console.log(`✓ Successfully synced ${syncedCount} inspectors between profiles and inspectors tables`);
        }
      }
    } catch (e) {
      console.error('Error checking inspectors table:', e.message);
    }
    
    // 7. Ensure the role column exists and has a value of 'inspector'
    console.log('\n7. Checking and fixing role values...');
    
    const hasRoleColumn = await checkColumnExists('profiles', 'role');
    
    if (!hasRoleColumn) {
      console.log('role column not found in profiles table. Adding it...');
      
      // SQL to add the role column
      const addRoleColumnSQL = `
        ALTER TABLE public.profiles
        ADD COLUMN IF NOT EXISTS role TEXT;
      `;
      
      const { error: alterError } = await supabase.rpc('pgadmin_exec_sql', { sql: addRoleColumnSQL });
      
      if (alterError) {
        console.error('Error adding role column:', alterError.message);
        throw alterError;
      }
      
      console.log('✓ Successfully added role column to profiles table');
    }
    
    // Update any inspectors without a role value to 'inspector'
    const { error: roleUpdateError } = await supabase
      .from('profiles')
      .update({ role: 'inspector' })
      .is('role', null)
      .neq('email', '');
      
    if (roleUpdateError) {
      console.error('Error updating roles:', roleUpdateError.message);
      throw roleUpdateError;
    }
    
    console.log('✓ Successfully fixed role values for inspectors');
    
    // 8. Add isAvailable flag if it doesn't exist
    console.log('\n8. Checking for isAvailable column in profiles...');
    
    const hasAvailableColumn = await checkColumnExists('profiles', 'isAvailable');
    
    if (!hasAvailableColumn) {
      console.log('isAvailable column not found in profiles table. Adding it...');
      
      // SQL to add the isAvailable column
      const addAvailableColumnSQL = `
        ALTER TABLE public.profiles
        ADD COLUMN IF NOT EXISTS "isAvailable" BOOLEAN DEFAULT true;
      `;
      
      const { error: alterError } = await supabase.rpc('pgadmin_exec_sql', { sql: addAvailableColumnSQL });
      
      if (alterError) {
        console.error('Error adding isAvailable column:', alterError.message);
        throw alterError;
      }
      
      console.log('✓ Successfully added isAvailable column to profiles table');
    } else {
      console.log('✓ isAvailable column already exists in profiles table');
    }
    
    // 9. Final check of the location relationships
    console.log('\n9. Final check of inspector-location relationships...');
    
    try {
      const { data: inspectorsWithLocations, error: relationError } = await supabase
        .from('profiles')
        .select(`
          id, name, email, role, location_id,
          locations:location_id (id, name, location_number)
        `)
        .eq('role', 'inspector');
        
      if (relationError) {
        console.error('Error checking inspector-location relationships:', relationError.message);
      } else if (!inspectorsWithLocations || inspectorsWithLocations.length === 0) {
        console.log('No inspectors found with role = "inspector"');
      } else {
        let validRelationships = 0;
        let invalidRelationships = 0;
        
        inspectorsWithLocations.forEach(inspector => {
          if (inspector.locations) {
            validRelationships++;
            console.log(`  ✓ ${inspector.name || 'Unnamed'} is linked to location: ${inspector.locations.name}`);
          } else {
            invalidRelationships++;
            console.log(`  ❌ ${inspector.name || 'Unnamed'} has invalid location_id: ${inspector.location_id || 'NULL'}`);
          }
        });
        
        console.log(`\nFinal result: ${validRelationships} valid relationships, ${invalidRelationships} invalid relationships`);
        
        if (invalidRelationships > 0) {
          console.warn('Some inspectors still have invalid location relationships. This might be because:');
          console.warn('1. The location_id exists but points to a non-existent location');
          console.warn('2. There may be permissions issues preventing proper foreign key joins');
          console.warn('Try manually setting valid location_ids for these inspectors in the Supabase dashboard');
        }
      }
    } catch (e) {
      console.error('Error performing final relationship check:', e.message);
    }
    
    console.log('\n=== INSPECTOR-LOCATION FIXES COMPLETED ===');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Main function
async function main() {
  try {
    await fixInspectorLocations();
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

main(); 