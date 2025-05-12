
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BasePanelProps } from './types';
import PanelActions from './PanelActions';

interface PanelItemProps extends BasePanelProps {
  updatePanelSize: (panelId: string, size: 'small' | 'medium' | 'large' | 'full') => void;
  removePanel: (panelId: string) => void;
  panelContent: React.ReactNode;
  className?: string;
}

const PanelItem: React.FC<PanelItemProps> = ({
  panel,
  isEditing,
  updatePanelSize,
  removePanel,
  panelContent,
  className
}) => {
  return (
    <Card className={cn("h-full bg-white", className)}>
      {isEditing && (
        <PanelActions 
          panel={panel} 
          updatePanelSize={updatePanelSize} 
          removePanel={removePanel} 
        />
      )}
      
      <CardContent className={cn(
        "p-0 overflow-hidden",
        isEditing ? "opacity-50 pointer-events-none" : ""
      )}>
        {panelContent || (
          <div className="flex items-center justify-center h-40">
            <AlertCircle className="h-8 w-8 text-gray-300" />
            <p className="ml-2 text-gray-500">Panel not found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PanelItem;
