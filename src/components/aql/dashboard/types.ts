
export interface DashboardPanel {
  id: string;
  title: string;
  type: 'metrics' | 'defects' | 'tasks' | 'performance' | 'billable' | 'audit';
  size: 'small' | 'medium' | 'large' | 'full';
  position: number;
}

export interface BasePanelProps {
  panel: DashboardPanel;
  isEditing: boolean;
}
