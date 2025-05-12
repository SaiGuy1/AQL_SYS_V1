#!/usr/bin/env node
/**
 * Fix User Role - Sets a user's role to manager in the profiles table
 * 
 * Usage: node fix_user_role.js <email or user id>
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL and key must be set in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserRole() {
  try {
    // Get user identifier from command line arguments
    const userIdentifier = process.argv[2];
    
    if (!userIdentifier) {
      console.error('Error: Please provide a user email or ID as an argument.');
      console.log('Usage: node fix_user_role.js <email or user id>');
      process.exit(1);
    }
    
    console.log(`Looking for user: ${userIdentifier}`);
    
    // Try to find the user by email or ID
    let user;
    
    // Check if it's a UUID format (rough check)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdentifier);
    
    if (isUuid) {
      // Search by ID
      console.log('Searching by user ID...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userIdentifier)
        .single();
        
      if (error) {
        console.error('Error fetching user by ID:', error.message);
      } else {
        user = data;
      }
    } else {
      // Search by email
      console.log('Searching by email...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', userIdentifier)
        .single();
        
      if (error) {
        console.error('Error fetching user by email:', error.message);
      } else {
        user = data;
      }
    }
    
    if (!user) {
      console.error('Error: User not found.');
      process.exit(1);
    }
    
    console.log('User found:');
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Current role: ${user.role || 'None'}`);
    
    // Update the user's role to 'manager'
    console.log('\nUpdating role to "manager"...');
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'manager' })
      .eq('id', user.id);
      
    if (updateError) {
      console.error('Error updating user role:', updateError.message);
      process.exit(1);
    }
    
    console.log('✅ Role successfully updated to "manager"');
    
    // Verify the update
    const { data: updatedUser, error: verifyError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (verifyError) {
      console.error('Error verifying update:', verifyError.message);
    } else {
      console.log(`Verified new role: ${updatedUser.role}`);
    }
    
    console.log('\nPlease log out and log back in for the role change to take effect.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

fixUserRole(); 