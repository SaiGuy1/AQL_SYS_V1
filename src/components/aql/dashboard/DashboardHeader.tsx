
import React from 'react';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelRightClose } from 'lucide-react';

interface DashboardHeaderProps {
  layout: 'grid' | 'list';
  isEditing: boolean;
  setLayout: (layout: 'grid' | 'list') => void;
  setIsEditing: (isEditing: boolean) => void;
  resetToDefaults: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  layout,
  isEditing,
  setLayout,
  setIsEditing,
  resetToDefaults
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
      <h2 className="text-xl font-bold">Dashboard</h2>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')}
        >
          {layout === 'grid' ? (
            <><PanelLeftClose className="h-4 w-4 mr-1" /> List View</>
          ) : (
            <><PanelRightClose className="h-4 w-4 mr-1" /> Grid View</>
          )}
        </Button>
        
        <Button 
          variant={isEditing ? "default" : "outline"} 
          size="sm" 
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Save Layout' : 'Customize'}
        </Button>
        
        {isEditing && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetToDefaults}
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
