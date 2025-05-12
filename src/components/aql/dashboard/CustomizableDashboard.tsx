import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DashboardPanel } from './types';
import { getDefaultPanels } from './panelUtils';
import DashboardHeader from './DashboardHeader';
import PanelGrid from './PanelGrid';
import { UserRole } from '@/lib/supabase';

// Extended role type for dashboard compatibility (includes accounting which is not in UserRole)
type DashboardRole = UserRole | 'accounting';

interface CustomizableDashboardProps {
  userRole: DashboardRole;
  jobId?: string;
  children: React.ReactNode;
}

const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({ 
  userRole,
  jobId,
  children
}) => {
  // Get panels from localStorage or use defaults
  const [panels, setPanels] = useState<DashboardPanel[]>(() => {
    const savedPanels = localStorage.getItem(`dashboard-panels-${userRole}`);
    return savedPanels ? JSON.parse(savedPanels) : getDefaultPanels(userRole);
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  
  // Save panels to localStorage when they change
  useEffect(() => {
    localStorage.setItem(`dashboard-panels-${userRole}`, JSON.stringify(panels));
  }, [panels, userRole]);
  
  // Update panel size
  const updatePanelSize = (panelId: string, size: 'small' | 'medium' | 'large' | 'full') => {
    setPanels(panels.map(panel => 
      panel.id === panelId ? { ...panel, size } : panel
    ));
  };
  
  // Remove panel
  const removePanel = (panelId: string) => {
    setPanels(panels.filter(panel => panel.id !== panelId));
  };
  
  // Reset to defaults
  const resetToDefaults = () => {
    setPanels(getDefaultPanels(userRole));
    toast.success("Dashboard reset to defaults");
  };
  
  // Get child component by panel type
  const getPanelContent = (type: string) => {
    const childrenArray = React.Children.toArray(children);
    const panel = childrenArray.find((child) => {
      if (React.isValidElement(child)) {
        return child.props.id === type;
      }
      return false;
    });
    
    return panel;
  };
  
  return (
    <div className="space-y-4">
      <DashboardHeader 
        layout={layout}
        isEditing={isEditing}
        setLayout={setLayout}
        setIsEditing={setIsEditing}
        resetToDefaults={resetToDefaults}
      />
      
      <PanelGrid 
        panels={panels}
        layout={layout}
        isEditing={isEditing}
        userRole={userRole}
        updatePanelSize={updatePanelSize}
        removePanel={removePanel}
        setPanels={setPanels}
        getPanelContent={getPanelContent}
      />
    </div>
  );
};

export default CustomizableDashboard;
