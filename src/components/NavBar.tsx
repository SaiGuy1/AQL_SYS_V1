import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Clipboard, LayoutDashboard, Menu, X, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/TranslationContext';
import LanguageSwitcher from './LanguageSwitcher';
import { NotificationsPanel } from './ui/NotificationsPanel';
import { UserRole } from '@/pages/AQLSystem';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const NavBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Get user data on mount
  useEffect(() => {
    let mounted = true;
    
    const getUserData = async () => {
      try {
        // Check localStorage first
        const storedRole = localStorage.getItem('aql_user_role') as UserRole;
        if (storedRole) {
          setUserRole(storedRole);
          setCheckingAuth(false);
        }
        
        // Get current session and user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!mounted || !user) return;
        
        // Set user email
        if (user.email) {
          setUserEmail(user.email);
        }
        
        // Only fetch from profiles if role is not in localStorage
        if (!storedRole) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (!mounted) return;
          
          if (profile?.role) {
            setUserRole(profile.role as UserRole);
            localStorage.setItem('aql_user_role', profile.role);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    };
    
    getUserData();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  if (checkingAuth) {
    return (
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-blue-600">{t('app_title')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const navItems = [
    { name: t('nav_customer_dashboard'), path: '/customer-dashboard', icon: LayoutDashboard },
    { name: t('nav_aql_system'), path: '/aql', icon: Clipboard },
  ];

  // Add Settings link for admin users
  if (userRole === 'admin') {
    navItems.push({ name: 'Settings', path: '/settings', icon: SettingsIcon });
  }

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    setIsLoggingOut(true);
    console.log('Logout button clicked'); // Debug log
    
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase signOut error:', error);
        throw error;
      }
      
      console.log('Supabase signOut successful'); // Debug log
      
      // Clear local storage data
      localStorage.removeItem('aql_logged_in');
      localStorage.removeItem('aql_user_role');
      localStorage.removeItem('userId');
      localStorage.removeItem('currentUser');
      
      // Show toast notification
      toast.success(t('logout_success'));
      
      // Redirect to login - add a small delay to ensure toast is visible
      setTimeout(() => {
        navigate('/login');
      }, 100);
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
      setIsLoggingOut(false);
    }
  };

  const LogoutButton = () => (
    <button 
      onClick={handleLogout}
      disabled={isLoggingOut}
      type="button"
      className={cn(
        "flex items-center bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm font-medium",
        isLoggingOut && "opacity-50 cursor-not-allowed"
      )}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isLoggingOut ? "Logging out..." : t('logout')}
    </button>
  );

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-600">{t('app_title')}</span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium flex items-center",
                    location.pathname === item.path
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-2">
              {userEmail && (
                <span className="text-sm text-gray-600 mr-2">
                  {userEmail}
                </span>
              )}
              <NotificationsPanel />
              <LanguageSwitcher />
              <LogoutButton />
            </div>
          </div>
          
          <div className="md:hidden flex items-center">
            {/* Mobile menu button */}
            <button 
              onClick={toggleMenu} 
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {menuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={cn("md:hidden", menuOpen ? "block" : "hidden")}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "block px-3 py-2 rounded-md text-base font-medium flex items-center",
                location.pathname === item.path
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              onClick={() => setMenuOpen(false)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.name}
            </Link>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-200">
            {userEmail && (
              <div className="px-3 py-2 text-sm text-gray-600">
                {userEmail}
              </div>
            )}
            <div className="px-3 py-2">
              <LanguageSwitcher />
            </div>
            <div className="mt-2">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
