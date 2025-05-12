import React from 'react';
import { cn } from '@/lib/utils';
import PanelItem from './PanelItem';
import { DashboardPanel } from './types';
import { sizeToClass } from './panelUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PanelGridProps {
  panels: DashboardPanel[];
  layout: 'grid' | 'list';
  isEditing: boolean;
  userRole: string;
  updatePanelSize: (panelId: string, size: 'small' | 'medium' | 'large' | 'full') => void;
  removePanel: (panelId: string) => void;
  setPanels: React.Dispatch<React.SetStateAction<DashboardPanel[]>>;
  getPanelContent: (type: string) => React.ReactNode;
}

const PanelGrid: React.FC<PanelGridProps> = ({
  panels,
  layout,
  isEditing,
  userRole,
  updatePanelSize,
  removePanel,
  setPanels,
  getPanelContent
}) => {
  const sortedPanels = [...panels].sort((a, b) => a.position - b.position);
  
  return (
    <>
      <div className={cn(
        layout === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" 
          : "space-y-4"
      )}>
        {sortedPanels.map((panel) => (
          <div 
            key={panel.id}
            className={cn(
              layout === 'grid' ? sizeToClass[panel.size] : 'w-full',
              "transition-all duration-200"
            )}
          >
            <PanelItem
              panel={panel}
              isEditing={isEditing}
              updatePanelSize={updatePanelSize}
              removePanel={removePanel}
              panelContent={getPanelContent(panel.type)}
            />
          </div>
        ))}
      </div>
      
      {isEditing && panels.length < 6 && (
        <Card className="bg-white border-dashed border-2 mt-4">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <h3 className="font-medium mb-2">Add Panel</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPanels([...panels, { 
                  id: `metrics-${Date.now()}`, 
                  title: 'Metrics', 
                  type: 'metrics', 
                  size: 'medium', 
                  position: panels.length 
                }])}
              >
                Metrics
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPanels([...panels, { 
                  id: `defects-${Date.now()}`, 
                  title: 'Defects', 
                  type: 'defects', 
                  size: 'medium', 
                  position: panels.length 
                }])}
              >
                Defects
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPanels([...panels, { 
                  id: `tasks-${Date.now()}`, 
                  title: 'Tasks', 
                  type: 'tasks', 
                  size: 'medium', 
                  position: panels.length 
                }])}
              >
                Tasks
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPanels([...panels, { 
                  id: `performance-${Date.now()}`, 
                  title: 'Performance', 
                  type: 'performance', 
                  size: 'small', 
                  position: panels.length 
                }])}
              >
                Performance
              </Button>
              
              {(() => {
                const userRole = localStorage.getItem('aql_user_role');
                console.log("Resolved role from profile:", userRole);
                return (userRole === 'accounting' || userRole === 'admin' || userRole === 'inspector') && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPanels([...panels, { 
                      id: `billable-${Date.now()}`, 
                      title: 'Billable Hours', 
                      type: 'billable', 
                      size: 'large', 
                      position: panels.length 
                    }])}
                  >
                    Billable Hours
                  </Button>
                );
              })()}
              
              {(() => {
                const userRole = localStorage.getItem('aql_user_role');
                console.log("Resolved role from profile:", userRole);
                return (userRole === 'manager' || userRole === 'admin') && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPanels([...panels, { 
                      id: `audit-${Date.now()}`, 
                      title: 'Audit Logs', 
                      type: 'audit', 
                      size: 'large', 
                      position: panels.length 
                    }])}
                  >
                    Audit Logs
                  </Button>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default PanelGrid;
