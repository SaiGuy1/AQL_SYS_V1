import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  supabase, 
  signIn as supabaseSignIn, 
  signOut as supabaseSignOut,
  signUp as supabaseSignUp,
  resetPassword as supabaseResetPassword,
  updatePassword as supabaseUpdatePassword,
  getUserProfile,
  updateUserProfile,
  UserRole,
  Database
} from '@/lib/supabase';

// Define the profile type based on our database schema
export type Profile = Database['public']['Tables']['profiles']['Row'];

// Define the auth context interface
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: AuthError | Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (
    email: string, 
    password: string, 
    userData: { 
      first_name: string; 
      last_name: string; 
      role: UserRole;
      location_id: string;
    }
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (profileData: Partial<Profile>) => Promise<void>;
  refreshUserProfile: () => Promise<Profile | null>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  signUp: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  updateProfile: async () => {},
  refreshUserProfile: async () => null,
});

// Hook for consuming the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<AuthError | Error | null>(null);
  
  const navigate = useNavigate();

  // Function to fetch and set user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const profileData = await getUserProfile(userId);
      console.log("Setting profile data:", profileData);
      
      // TEMPORARY WORKAROUND: Override role to 'inspector' for testing
      const modifiedProfile = {
        ...profileData,
        role: 'inspector' as UserRole // Force role to be inspector
      };
      
      console.log("OVERRIDE: Setting inspector role for testing:", modifiedProfile);
      setProfile(modifiedProfile);
      return modifiedProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(error as Error);
      return null;
    }
  };

  // Function to refresh the user profile
  const refreshUserProfile = async () => {
    if (user?.id) {
      return await fetchUserProfile(user.id);
    }
    return null;
  };

  // Initialize auth state
  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Get the current session from Supabase
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      
      if (data.session?.user) {
        setUser(data.session.user);
        await fetchUserProfile(data.session.user.id);
      }
    } catch (err) {
      console.error('Error initializing auth:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up auth change listener
  useEffect(() => {
    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    // Clean up the subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { session, user } = await supabaseSignIn(email, password);
      
      setSession(session);
      setUser(user);
      
      if (user) {
        const userProfile = await fetchUserProfile(user.id);
        console.log("User profile after login:", userProfile);
        
        // Check for role in profile
        if (userProfile?.role) {
          console.log("Redirecting based on role:", userProfile.role);
          
          switch (userProfile.role) {
            case 'admin':
              navigate('/admin');
              break;
            case 'manager':
              navigate('/manager');
              break;
            case 'supervisor':
              navigate('/supervisor');
              break;
            case 'inspector':
              navigate('/inspector');
              break;
            case 'hr':
              navigate('/hr');
              break;
            case 'customer':
              navigate('/customer');
              break;
            default:
              console.warn(`Unknown role: ${userProfile.role}, redirecting to default page`);
              navigate('/');
              break;
          }
        } else {
          console.warn("User profile exists but role is missing. Profile data:", userProfile);
          navigate('/');
        }
        
        toast.success(`Welcome back, ${userProfile?.name || email}!`);
      }
    } catch (err) {
      console.error('Error signing in:', err);
      setError(err as AuthError);
      toast.error(`Sign in failed: ${(err as Error).message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await supabaseSignOut();
      
      setSession(null);
      setUser(null);
      setProfile(null);
      
      // Redirect to login page after sign out
      navigate('/login');
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const signUp = async (
    email: string, 
    password: string, 
    userData: { 
      first_name: string; 
      last_name: string; 
      role: UserRole;
      location_id: string;
    }
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await supabaseSignUp(email, password, userData);
      
      // Show success message
      toast.success('Account created successfully! Please check your email to confirm your account.');
      
      // Redirect to login page
      navigate('/login');
    } catch (err) {
      console.error('Error signing up:', err);
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await supabaseResetPassword(email);
      
      toast.success('Password reset link sent to your email.');
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update password function
  const updatePassword = async (password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await supabaseUpdatePassword(password);
      
      toast.success('Password updated successfully.');
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (profileData: Partial<Profile>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const updatedProfile = await updateUserProfile(user.id, profileData);
      setProfile(updatedProfile);
      
      toast.success('Profile updated successfully.');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Provide the auth context to children
  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        error,
        signIn,
        signOut,
        signUp,
        resetPassword,
        updatePassword,
        updateProfile,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};