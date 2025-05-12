import { createClient } from '@supabase/supabase-js';

// Temporary Database type definition for use until proper types are available
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          first_name: string | null;
          last_name: string | null;
          role: UserRole | null;
          location_id: string | null;
          active_sessions?: number;
          created_at: string;
          updated_at: string;
          isAvailable?: boolean;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          role?: UserRole | null;
          location_id?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          role?: UserRole | null;
          location_id?: string | null;
        };
      };
    };
  };
}

// Get environment variables - fallback to empty strings if not defined
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Log environment variables (remove in production)
console.log('Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('Supabase Anon Key:', supabaseAnonKey ? '✓ Set' : '✗ Missing');

// Initialize the Supabase client with database type safety
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Export auth-related helpers
export type UserRole = 'admin' | 'manager' | 'supervisor' | 'inspector' | 'hr' | 'customer';

// Password validation regex patterns
export const PASSWORD_VALIDATIONS = {
  minLength: 8,
  maxLength: 20,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
  noSpaces: /^\S*$/
};

// Helper function to validate password
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { valid: false, errors };
  }
  
  if (password.length < PASSWORD_VALIDATIONS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_VALIDATIONS.minLength} characters`);
  }
  
  if (password.length > PASSWORD_VALIDATIONS.maxLength) {
    errors.push(`Password must be less than ${PASSWORD_VALIDATIONS.maxLength} characters`);
  }
  
  if (!PASSWORD_VALIDATIONS.uppercase.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!PASSWORD_VALIDATIONS.lowercase.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!PASSWORD_VALIDATIONS.number.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!PASSWORD_VALIDATIONS.special.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  if (!PASSWORD_VALIDATIONS.noSpaces.test(password)) {
    errors.push('Password cannot contain spaces');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Get and return the current session
export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

// Get and return the current user
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
};

// Sign up a new user
export const signUp = async (
  email: string, 
  password: string, 
  userData: { 
    first_name: string; 
    last_name: string; 
    role: UserRole;
    location_id: string;
  }
) => {
  // Validate the password first
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    throw new Error(passwordCheck.errors.join(', '));
  }
  
  // Sign up the user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        full_name: `${userData.first_name} ${userData.last_name}`,
        role: userData.role,
        location_id: userData.location_id
      }
    }
  });
  
  if (error) throw error;
  
  // Update the profile
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: `${userData.first_name} ${userData.last_name}`,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        location_id: userData.location_id
      })
      .eq('id', data.user.id);
    
    if (profileError) throw profileError;
  }
  
  return data;
};

// Sign in a user
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

// Sign out the user
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Request a password reset
export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) throw error;
};

// Update password
export const updatePassword = async (password: string) => {
  // Validate the password first
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    throw new Error(passwordCheck.errors.join(', '));
  }
  
  const { error } = await supabase.auth.updateUser({
    password,
  });
  
  if (error) throw error;
};

// Fetch user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, first_name, last_name, role, location_id, created_at, updated_at')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
  
  console.log("Fetched user profile:", data);
  return data;
};

// Update user profile
export const updateUserProfile = async (userId: string, profileData: Partial<{
  first_name: string;
  last_name: string;
  name: string;
  role: UserRole;
  location_id: string;
  isAvailable: boolean;
}>) => {
  let dbProfileData = {...profileData};
  
  // If first_name and last_name are provided, update the full name
  if (profileData.first_name && profileData.last_name) {
    dbProfileData.name = `${profileData.first_name} ${profileData.last_name}`;
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...dbProfileData,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select();
    
  if (error) throw error;
  
  return data[0];
}; 