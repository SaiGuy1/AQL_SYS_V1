
import React from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface NavItemProps {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  to?: string;
}

const NavItem = ({ icon, text, active = false, to }: NavItemProps) => {
  const classes = cn(
    "flex items-center px-4 py-3 text-sm font-medium rounded-lg",
    active 
      ? "bg-blue-50 text-blue-700" 
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
  );
  
  if (to) {
    return (
      <Link to={to} className={classes}>
        {icon}
        {text}
      </Link>
    );
  }
  
  return (
    <a href="#" className={classes}>
      {icon}
      {text}
    </a>
  );
};

export default NavItem;
