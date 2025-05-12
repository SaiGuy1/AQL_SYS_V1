
import React from 'react';
import { GripVertical, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DashboardPanel } from './types';

interface PanelActionsProps {
  panel: DashboardPanel;
  updatePanelSize: (panelId: string, size: 'small' | 'medium' | 'large' | 'full') => void;
  removePanel: (panelId: string) => void;
}

const PanelActions: React.FC<PanelActionsProps> = ({ 
  panel, 
  updatePanelSize, 
  removePanel 
}) => {
  return (
    <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
      <div className="flex items-center">
        <GripVertical className="h-4 w-4 text-gray-400 cursor-move mr-2" />
        <span className="text-sm font-medium">{panel.title}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Select 
          value={panel.size} 
          onValueChange={(value: any) => updatePanelSize(panel.id, value)}
        >
          <SelectTrigger className="h-7 text-xs w-24">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large</SelectItem>
            <SelectItem value="full">Full Width</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7" 
          onClick={() => removePanel(panel.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PanelActions;
