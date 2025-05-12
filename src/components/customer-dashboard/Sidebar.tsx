import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Landmark, 
  Home, 
  FileClock, 
  AlertTriangle, 
  Table2, 
  KanbanSquare, 
  User, 
  LogOut 
} from 'lucide-react';
import { UserRole } from '@/lib/supabase';

// Extended role type for dashboard compatibility (includes accounting which is not in UserRole)
type DashboardRole = UserRole | 'accounting';

interface SidebarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  userRole: DashboardRole;
  changeUserRole: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sidebarOpen, 
  toggleSidebar,
  userRole
}) => {
  
  interface NavItemProps {
    icon: React.ReactNode;
    text: string;
    active?: boolean;
    to?: string;
  }

  const NavItem: React.FC<NavItemProps> = ({ icon, text, active, to = "#" }) => (
    <Link 
      to={to}
      className={cn(
        "flex items-center py-3 px-4 text-gray-700 rounded-lg transition-colors",
        active ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100",
        "font-medium"
      )}
    >
      {icon}
      {text}
    </Link>
  );

  return (
    <>
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-40 transition-transform duration-300 ease-in-out",
          "flex flex-col justify-between",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Landmark className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold">AQL System</span>
            </div>
          </div>
          
          <nav className="p-4 space-y-1">
            <NavItem icon={<Home className="mr-3 h-5 w-5" />} text="Dashboard" active />
            <NavItem icon={<FileClock className="mr-3 h-5 w-5" />} text="Jobs" />
            <NavItem 
              icon={<AlertTriangle className="mr-3 h-5 w-5" />} 
              text="Defect Tracking" 
              to="/defect-tracking"
            />
            <NavItem icon={<Table2 className="mr-3 h-5 w-5" />} text="Tables" />
            <NavItem icon={<KanbanSquare className="mr-3 h-5 w-5" />} text="Kanban" />
            <NavItem icon={<User className="mr-3 h-5 w-5" />} text="Profile" />
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <Button variant="ghost" className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </div>
      </div>

      <div 
        className={cn(
          "md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30",
          sidebarOpen ? "block" : "hidden"
        )}
        onClick={toggleSidebar}
      />
    </>
  );
};

export default Sidebar;
