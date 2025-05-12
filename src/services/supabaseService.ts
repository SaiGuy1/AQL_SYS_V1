import { supabase } from '@/lib/supabase';

// Type definitions
export interface Inspector {
  id?: string;
  user_id: string;
  name: string;
  email: string;
  role?: string;
  location_id: string;
  created_at?: string;
}

export interface Location {
  id: string;
  name: string;
  location_number: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  created_at?: string;
}

// Job counter and job number functions
export interface JobCounter {
  id?: string;
  location_number: number;
  next_sequence: number;
}

// Job creation and management
export interface JobDraft {
  id?: string;
  job_number?: string;
  location_number?: number;
  revision?: number;
  title: string;
  customer: any;
  status: 'draft' | 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  location_id?: string;
  inspector_id?: string;
  created_at?: string;
  updated_at?: string;
  form_data?: any; // Stores the complete JobFormData during creation
  current_tab?: string; // Tracks which tab the user is on
}

// Authentication methods
export const signUpInspector = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Inspector profile methods
export const createInspectorProfile = async (inspectorData: Inspector) => {
  // Make sure we have the correct field mapping for profiles table
  const profileData = {
    id: inspectorData.user_id, // key difference - profiles table uses auth.uid() as id
    name: inspectorData.name,
    email: inspectorData.email,
    role: "inspector",
    location_id: inspectorData.location_id,
    isAvailable: true
  };
  
  // First try to insert into the profiles table (new schema)
  try {
    console.log("Inserting into profiles table with data:", profileData);
    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select();
    
    if (error) {
      console.error("Failed to insert into profiles table:", error);
      throw error;
    } else {
      console.log("Successfully inserted into profiles table");
      return data?.[0];
    }
  } catch (error) {
    console.error("Error inserting into profiles table:", error);
    throw error; // Important to throw the error to handle it in the UI
  }
};

export const getInspectorProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('inspectors')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

export const getInspectorsByLocation = async (locationId: string) => {
  const { data, error } = await supabase
    .from('inspectors')
    .select('*')
    .eq('location_id', locationId);
  
  if (error) throw error;
  return data;
};

// Get inspectors from profiles table by location
export const getInspectorProfilesByLocation = async (locationId: string, options?: { includeAllLocations?: boolean }) => {
  try {
    console.log(`Fetching inspectors for location_id: ${locationId}`, options);
    
    if (!locationId && !options?.includeAllLocations) {
      console.warn('No location ID provided to getInspectorProfilesByLocation');
      return [];
    }
    
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'inspector');
    
    // Only filter by location if we're not including all locations
    if (!options?.includeAllLocations) {
      query = query.eq('location_id', locationId);
    }
    
    // Execute the query
    const { data: profiles, error } = await query;
      
    if (error) {
      console.error("Error fetching inspector profiles by location:", error);
      throw error;
    }
    
    console.log(`Found ${profiles?.length || 0} inspectors in profiles table${options?.includeAllLocations ? ' (all locations)' : ` for location ${locationId}`}`);
    
    // If successful, return the profiles
    if (profiles && profiles.length > 0) {
      // Add isAvailable flag based on existing availability data or default to true
      // Also add metadata about whether their location matches the requested location
      return profiles.map(profile => ({
        ...profile,
        isAvailable: profile.isAvailable !== undefined ? profile.isAvailable : true,
        locationMatches: profile.location_id === locationId
      }));
    }
    
    // If no profiles found, try the legacy inspectors table
    let legacyQuery = supabase
      .from('inspectors')
      .select('*');
      
    // Only filter by location if we're not including all locations
    if (!options?.includeAllLocations) {
      legacyQuery = legacyQuery.eq('location_id', locationId);
    }
    
    const { data: inspectors, error: inspectorError } = await legacyQuery;
      
    if (inspectorError) {
      console.error("Error fetching inspectors by location:", inspectorError);
      throw inspectorError;
    }
    
    console.log(`Found ${inspectors?.length || 0} inspectors in inspectors table${options?.includeAllLocations ? ' (all locations)' : ` for location ${locationId}`}`);
    
    // Add isAvailable flag to inspector profiles from legacy table
    return (inspectors || []).map(inspector => ({
      ...inspector,
      isAvailable: inspector.isAvailable !== undefined ? inspector.isAvailable : true,
      role: inspector.role || 'inspector', // Ensure role is set for legacy records
      locationMatches: inspector.location_id === locationId
    }));
  } catch (error) {
    console.error("Failed to fetch inspectors for location:", locationId, error);
    throw error;
  }
};

// Get all available inspectors (not currently assigned to jobs)
export const getAvailableInspectors = async () => {
  try {
    // First try to get all inspectors with availability flag from profiles table
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'inspector')
      .eq('isAvailable', true);
      
    if (error) {
      console.error("Error fetching available inspectors:", error);
      throw error;
    }
    
    // Also try to get available inspectors from the legacy table
    const { data: inspectors, error: inspectorError } = await supabase
      .from('inspectors')
      .select('*')
      .eq('isAvailable', true);
      
    if (inspectorError && inspectorError.code !== 'PGRST116') {
      // PGRST116 means column doesn't exist, which is fine for legacy compatibility
      console.error("Error fetching legacy inspectors:", inspectorError);
    }
    
    // Combine both results, prioritizing profiles table
    const profileMap = new Map();
    
    // Add profiles first
    if (profiles) {
      profiles.forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });
    }
    
    // Add any inspectors not already in the map
    if (inspectors) {
      inspectors.forEach(inspector => {
        if (!profileMap.has(inspector.user_id)) {
          profileMap.set(inspector.user_id, {
            ...inspector,
            role: 'inspector' // Ensure role is set for legacy records
          });
        }
      });
    }
    
    return Array.from(profileMap.values());
  } catch (error) {
    console.error("Failed to fetch available inspectors:", error);
    throw error;
  }
};

// Location methods

/**
 * Fetches all locations from the Supabase database, ordered by name alphabetically
 * @returns Promise resolving to an array of Location objects
 */
export const getLocations = async () => {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    throw error;
  }
};

/**
 * Fetches all locations from the Supabase database, ordered by location_number
 * This is the preferred function for displaying locations in dropdowns
 * @returns Promise resolving to an array of Location objects
 */
export const getLocationsOrdered = async () => {
  try {
    console.log('Fetching locations ordered by location_number...');
    console.log('Using Supabase client:', !!supabase);
    
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('location_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getLocationsOrdered:', error);
    throw error;
  }
};

/**
 * Formats a location object for display in UI components
 * Format: "01 - Location Name" (location number padded to 2 digits)
 * @param location The Location object to format
 * @returns Formatted location string
 */
export const formatLocationDisplay = (location: Location) => {
  if (!location) return 'Unknown Location';
  
  // Pad location number to 2 digits for consistent display
  const locationNumber = location.location_number 
    ? location.location_number.toString().padStart(2, '0') 
    : '??';
    
  return `${locationNumber} - ${location.name}`;
};

// Function to create a new location (admin only)
export const createLocation = async (location: Omit<Location, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('locations')
    .insert([location])
    .select();
  
  if (error) throw error;
  return data?.[0];
};

// Function to get location by ID
export const getLocationById = async (id: string) => {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Current user methods
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user;
};

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

/**
 * Gets the next job sequence number for a specific location
 * @param location_number The location number
 * @returns The next sequence number
 */
export const getNextJobSequence = async (location_number: number): Promise<number> => {
  try {
    // First check if the location exists in the job_counter table
    const { data: counterData, error: counterError } = await supabase
      .from('job_counter')
      .select('next_sequence')
      .eq('location_number', location_number)
      .single();
    
    if (counterError) {
      if (counterError.code === 'PGRST116') {
        // Record not found, create a new one starting at 1
        const { data: newCounter, error: insertError } = await supabase
          .from('job_counter')
          .insert([{ location_number, next_sequence: 1 }])
          .select()
          .single();
        
        if (insertError) {
          console.error('Error creating job counter:', insertError);
          throw insertError;
        }
        
        return newCounter.next_sequence;
      } else {
        // Some other error occurred
        console.error('Error retrieving job counter:', counterError);
        throw counterError;
      }
    }
    
    return counterData.next_sequence;
  } catch (error) {
    console.error('Error in getNextJobSequence:', error);
    // If in development/demo mode, fallback to a default sequence
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using fallback job sequence in dev mode');
      return Math.floor(10000 + Math.random() * 90000);
    }
    throw error;
  }
};

/**
 * Increments the job sequence counter for a specific location
 * @param location_number The location number
 * @returns The updated sequence number
 */
export const incrementJobSequence = async (location_number: number): Promise<number> => {
  try {
    // First get the current counter to ensure it exists
    const currentSequence = await getNextJobSequence(location_number);
    
    // Increment the counter
    const { data: updatedCounter, error: updateError } = await supabase
      .from('job_counter')
      .update({ next_sequence: currentSequence + 1 })
      .eq('location_number', location_number)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating job counter:', updateError);
      throw updateError;
    }
    
    return updatedCounter.next_sequence;
  } catch (error) {
    console.error('Error in incrementJobSequence:', error);
    // If in development/demo mode, return a mock value
    if (process.env.NODE_ENV === 'development') {
      return Math.floor(10000 + Math.random() * 90000);
    }
    throw error;
  }
};

/**
 * Generates a formatted job number based on location, sequence, and revision
 * Format: {location_number}-{sequence}-{revision}
 * Example: 16-0013893-1
 * 
 * @param location_number The location number (e.g., 16)
 * @param sequence The sequence number for this location
 * @param revision The revision number (defaults to 1)
 * @returns The formatted job number string
 */
export const generateJobNumber = (
  location_number: number,
  sequence: number,
  revision: number = 1
): string => {
  // Pad the sequence to 7 digits
  const paddedSequence = sequence.toString().padStart(7, '0');
  // Create the full job number string
  return `${location_number}-${paddedSequence}-${revision}`;
};

/**
 * Sanitizes a job draft for storage in Supabase
 * Converting nested objects to strings and ensuring data types are correct
 */
const sanitizeDraftForStorage = (jobData: any): any => {
  // Clone the job to avoid modifying the original
  const sanitized = { ...jobData };
  
  // Convert customer object to string if it exists
  if (sanitized.customer && typeof sanitized.customer === 'object') {
    sanitized.customer_data = JSON.stringify(sanitized.customer);
    // Keep customer_name directly accessible
    sanitized.customer_name = sanitized.customer.name || '';
  }
  
  // Store the complete form_data as a JSON string
  if (sanitized.form_data && typeof sanitized.form_data === 'object') {
    sanitized.form_data_json = JSON.stringify(sanitized.form_data);
    // Remove the original complex object
    delete sanitized.form_data;
  }
  
  // Convert location object to string if present
  if (sanitized.location && typeof sanitized.location === 'object') {
    sanitized.location_data = JSON.stringify(sanitized.location);
  }
  
  // Ensure dates are in ISO format
  if (sanitized.created_at && !(typeof sanitized.created_at === 'string')) {
    sanitized.created_at = new Date(sanitized.created_at).toISOString();
  }
  
  if (sanitized.updated_at && !(typeof sanitized.updated_at === 'string')) {
    sanitized.updated_at = new Date(sanitized.updated_at).toISOString();
  }
  
  // Ensure proper data types for critical fields
  sanitized.title = String(sanitized.title || '');
  sanitized.status = String(sanitized.status || 'draft').toLowerCase();
  
  if (sanitized.job_number) {
    sanitized.job_number = String(sanitized.job_number);
  }
  
  if (sanitized.location_number) {
    sanitized.location_number = Number(sanitized.location_number);
  }
  
  if (sanitized.revision) {
    sanitized.revision = Number(sanitized.revision);
  }
  
  // Ensure current_tab is a string
  if (sanitized.current_tab) {
    sanitized.current_tab = String(sanitized.current_tab);
  }
  
  return sanitized;
};

/**
 * Creates a new job draft in Supabase or updates an existing one
 * @param jobData - The job data to save
 * @returns The created or updated job record
 */
export const createOrUpdateJobDraft = async (jobData: JobDraft): Promise<JobDraft> => {
  try {
    const now = new Date().toISOString();
    
    // Prepare the data with timestamps
    const data = {
      ...jobData,
      updated_at: now,
      status: jobData.status || 'draft'
    };
    
    // Sanitize the data for storage
    const sanitizedData = sanitizeDraftForStorage(data);
    
    console.log('Creating/updating job draft with data:', {
      id: sanitizedData.id || 'new draft',
      title: sanitizedData.title,
      status: sanitizedData.status
    });
    
    if (!jobData.id) {
      // This is a new job draft, insert it
      sanitizedData.created_at = now;
      
      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert([sanitizedData])
        .select('*')
        .single();
      
      if (error) {
        console.error('Error creating job draft:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('Created new job draft:', newJob);
      
      // Reconstruct form_data if it was saved as JSON
      const reconstructedJob = {
        ...newJob,
        form_data: newJob.form_data_json ? JSON.parse(newJob.form_data_json) : undefined
      };
      
      return reconstructedJob;
    } else {
      // This is an update to an existing draft
      const { data: updatedJob, error } = await supabase
        .from('jobs')
        .update(sanitizedData)
        .eq('id', jobData.id)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error updating job draft:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('Updated job draft:', updatedJob);
      
      // Reconstruct form_data if it was saved as JSON
      const reconstructedJob = {
        ...updatedJob,
        form_data: updatedJob.form_data_json ? JSON.parse(updatedJob.form_data_json) : undefined
      };
      
      return reconstructedJob;
    }
  } catch (error) {
    console.error('Error in createOrUpdateJobDraft:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
    throw error;
  }
};

/**
 * Loads a job draft by its ID
 * @param id - The ID of the job draft to load
 * @returns The job draft or null if not found
 */
export const getJobDraft = async (id: string): Promise<JobDraft | null> => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .eq('status', 'draft')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Record not found
        console.log(`Job draft with ID ${id} not found`);
        return null;
      }
      console.error('Error loading job draft:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    if (!data) {
      return null;
    }
    
    // Reconstruct the job from stored data
    try {
      const reconstructedJob: JobDraft = {
        ...data,
        // Restore form_data from JSON if it exists
        form_data: data.form_data_json ? JSON.parse(data.form_data_json) : undefined,
        // Restore customer object if it was stored as JSON
        customer: data.customer_data ? JSON.parse(data.customer_data) : data.customer,
        // Restore location object if it was stored as JSON
        location: data.location_data ? JSON.parse(data.location_data) : data.location
      };
      
      console.log('Loaded job draft:', {
        id: reconstructedJob.id,
        title: reconstructedJob.title,
        current_tab: reconstructedJob.current_tab
      });
      
      return reconstructedJob;
    } catch (parseError) {
      console.error('Error parsing stored JSON data in job draft:', parseError);
      console.error('Raw data received:', data);
      // Return the raw data as fallback
      return data as JobDraft;
    }
  } catch (error) {
    console.error('Error in getJobDraft:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
    throw error;
  }
};

/**
 * Gets all job drafts for the current user
 * @returns Array of job drafts
 */
export const getUserJobDrafts = async (): Promise<JobDraft[]> => {
  try {
    // Get the current user
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      console.log('No user found, returning empty drafts array');
      return [];
    }
    
    // Get all drafts created by this user
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'draft')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error loading user job drafts:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('No drafts found for user');
      return [];
    }
    
    console.log(`Found ${data.length} draft jobs for user`);
    
    // Reconstruct each job with proper objects from their JSON strings
    const reconstructedDrafts = data.map(draft => {
      try {
        return {
          ...draft,
          // Reconstruct form_data if available
          form_data: draft.form_data_json ? JSON.parse(draft.form_data_json) : undefined,
          // Reconstruct customer object if available
          customer: draft.customer_data ? JSON.parse(draft.customer_data) : draft.customer,
          // Reconstruct other complex objects as needed
          location: draft.location_data ? JSON.parse(draft.location_data) : draft.location,
        };
      } catch (parseError) {
        console.error(`Error parsing JSON data for draft ${draft.id}:`, parseError);
        // Return the raw draft as fallback
        return draft;
      }
    });
    
    return reconstructedDrafts;
  } catch (error) {
    console.error('Error in getUserJobDrafts:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
    throw error;
  }
};

/**
 * Updates a job draft's status to finalize it
 * @param id - The ID of the job to finalize
 * @param status - The new status (default: 'pending')
 * @returns The updated job
 */
export const finalizeJobDraft = async (id: string, status: string = 'pending'): Promise<JobDraft> => {
  try {
    const now = new Date().toISOString();
    
    // First get the current draft to ensure it exists
    const { data: currentDraft, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching job draft for finalization:', fetchError);
      console.error('Error details:', JSON.stringify(fetchError, null, 2));
      throw fetchError;
    }
    
    if (!currentDraft) {
      throw new Error(`Job draft with ID ${id} not found`);
    }
    
    // Sanitize and prepare the update data
    const updateData = sanitizeDraftForStorage({
      ...currentDraft,
      status: status,
      updated_at: now
    });
    
    console.log(`Finalizing job draft ${id} with status: ${status}`);
    
    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error finalizing job draft:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    // Reconstruct form_data if it was saved as JSON
    const reconstructedJob = {
      ...data,
      form_data: data.form_data_json ? JSON.parse(data.form_data_json) : undefined,
      customer: data.customer_data ? JSON.parse(data.customer_data) : data.customer,
    };
    
    console.log(`Successfully finalized job draft ${id}`);
    return reconstructedJob;
  } catch (error) {
    console.error('Error in finalizeJobDraft:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
    throw error;
  }
};

/**
 * Deletes a job draft
 * @param id - The ID of the job draft to delete
 * @returns Success boolean
 */
export const deleteJobDraft = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)
      .eq('status', 'draft'); // Safety check: only delete drafts
    
    if (error) {
      console.error('Error deleting job draft:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteJobDraft:', error);
    throw error;
  }
};

// Notification methods
export const fetchNotifications = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };

    return await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { data: [], error };
  }
};

export const markNotificationAsRead = async (id: string) => {
  try {
    return await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { data: null, error };
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('No user found') };

    return await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { data: null, error };
  }
}; 