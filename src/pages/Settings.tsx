import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/contexts/TranslationContext";
import LocationsManager from '@/components/admin/LocationsManager';
import UserManagement from '@/components/admin/UserManagement';
import { supabase } from '@/lib/supabase';

// Define user roles
export type UserRole = 'admin' | 'manager' | 'supervisor' | 'inspector' | 'hr' | 'accounting' | 'customer';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("locations");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkRole = async () => {
      try {
        setCheckingAuth(true);
        
        // First check localStorage for role
        const storedRole = localStorage.getItem('aql_user_role') as UserRole;
        if (storedRole) {
          setUserRole(storedRole);
          setCheckingAuth(false);
          return;
        }
        
        // If no role in localStorage, fetch from profiles table
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
            setCheckingAuth(false);
            return;
          }
          
          if (profile?.role) {
            setUserRole(profile.role as UserRole);
            localStorage.setItem('aql_user_role', profile.role);
          }
        }
      } catch (error) {
        console.error('Error checking role:', error);
      } finally {
        setCheckingAuth(false);
      }
    };
    
    checkRole();
  }, []);

  // Redirect non-admin users
  useEffect(() => {
    if (!checkingAuth && userRole !== 'admin') {
      navigate('/aql');
    }
  }, [userRole, checkingAuth, navigate]);

  if (checkingAuth) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            <p className="mt-4 text-lg font-medium text-gray-700">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is not an admin, show access denied
  if (userRole !== 'admin') {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access the system settings. Please contact an administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
        <p className="text-slate-500 mt-2">
          Manage system-wide settings, users, and locations
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Location Management</CardTitle>
              <CardDescription>
                Add, edit, or remove locations from the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LocationsManager userRole={userRole} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement userRole={userRole} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings; 