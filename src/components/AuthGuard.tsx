import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/supabase';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Component that checks if the user is authenticated and has the correct role before rendering children
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Get role from localStorage
  const userRole = localStorage.getItem('aql_user_role') as UserRole;
  console.log("Resolved role from profile:", userRole);

  // If specific roles are required, check user role
  if (allowedRoles && allowedRoles.length > 0) {
    // If role doesn't match required roles, show unauthorized
    if (!userRole || !allowedRoles.includes(userRole)) {
      return (
        <div className="flex h-screen flex-col items-center justify-center">
          <div className="mb-4 text-3xl font-bold text-red-600">Access Denied</div>
          <p className="mb-6 text-gray-700">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      );
    }
  }

  // User is authenticated and has correct role, render children
  return <>{children}</>;
};

export default AuthGuard; 