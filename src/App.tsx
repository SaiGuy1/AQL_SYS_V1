import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import AQLSystem from "./pages/AQLSystem";
import DefectTrackingDashboard from "./pages/DefectTrackingDashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SignupInspector from "./pages/SignupInspector";
import NavBar from "./components/NavBar";
import { useEffect, useState } from "react";
import { TranslationProvider } from "./contexts/TranslationContext";
import { supabase } from "./lib/supabase";

// Initialize localStorage on app startup
const initLocalStorage = () => {
  // This ensures essential app data is initialized
  if (typeof window !== 'undefined') {
    const services = [
      { key: 'aql_initialized', defaultValue: 'false' }
    ];
    
    const isInitialized = localStorage.getItem('aql_initialized') === 'true';
    
    if (!isInitialized) {
      localStorage.setItem('aql_initialized', 'true');
    }
  }
};

initLocalStorage();

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        // Get current session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (!session) {
          setIsLoggedIn(false);
          setUserRole(null);
          setCheckingAuth(false);
          return;
        }
        
        // User is authenticated
        setIsLoggedIn(true);
        
        // Get the user object
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!mounted || !user) return;
        
        // Check localStorage first
        const storedRole = localStorage.getItem('aql_user_role');
        
        if (storedRole) {
          setUserRole(storedRole);
          setCheckingAuth(false);
          return;
        }
        
        // Only fetch from profiles if role is not in localStorage
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (!mounted) return;
        
        if (profile?.role) {
          setUserRole(profile.role);
          localStorage.setItem('aql_user_role', profile.role);
          localStorage.setItem('userId', user.id);
          localStorage.setItem('currentUser', user.email?.split('@')[0] || 'User');
        } else {
          setIsLoggedIn(false);
          setUserRole(null);
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Auth check error:', error);
        setIsLoggedIn(false);
        setUserRole(null);
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    };
    
    checkAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setUserRole(null);
        localStorage.removeItem('aql_user_role');
        localStorage.removeItem('userId');
        localStorage.removeItem('currentUser');
      } else if (session) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!mounted || !user) return;
        
        // Check localStorage first
        const storedRole = localStorage.getItem('aql_user_role');
        
        if (storedRole) {
          setIsLoggedIn(true);
          setUserRole(storedRole);
          return;
        }
        
        // Only fetch from profiles if role is not in localStorage
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (!mounted) return;
        
        if (profile?.role) {
          setIsLoggedIn(true);
          setUserRole(profile.role);
          localStorage.setItem('aql_user_role', profile.role);
          localStorage.setItem('userId', user.id);
          localStorage.setItem('currentUser', user.email?.split('@')[0] || 'User');
        } else {
          setIsLoggedIn(false);
          setUserRole(null);
        }
      }
    });
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  // Special handling for inspector role - no NavBar
  if (userRole === 'inspector') {
    return (
      <>
        <Toaster />
        <Sonner />
        {children}
      </>
    );
  }
  
  // Regular layout with NavBar for all other roles
  return (
    <>
      <NavBar />
      <Toaster />
      <Sonner />
      {children}
    </>
  );
};

const App = () => (
  <TranslationProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signup-inspector" element={<SignupInspector />} />
            
            {/* Protected routes */}
            <Route path="/" element={<Navigate to="/aql" replace />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/customer-dashboard"
              element={
                <ProtectedRoute>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/aql"
              element={
                <ProtectedRoute>
                  <AQLSystem />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/defect-tracking"
              element={
                <ProtectedRoute>
                  <DefectTrackingDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <NotFound />
                </ProtectedRoute>
              }
            />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </TranslationProvider>
);

export default App;
