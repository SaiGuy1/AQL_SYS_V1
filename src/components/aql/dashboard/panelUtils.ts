
import { DashboardPanel } from './types';

// Default panels by user role
export const getDefaultPanels = (role: string): DashboardPanel[] => {
  const commonPanels = [
    { id: 'metrics', title: 'Job Metrics', type: 'metrics' as const, size: 'medium' as const, position: 0 },
    { id: 'defects', title: 'Defect Trends', type: 'defects' as const, size: 'medium' as const, position: 1 },
  ];
  
  switch (role) {
    case 'accounting':
      return [
        ...commonPanels,
        { id: 'billable', title: 'Billable Hours', type: 'billable' as const, size: 'large' as const, position: 2 },
        { id: 'performance', title: 'Performance', type: 'performance' as const, size: 'small' as const, position: 3 },
      ];
    case 'manager':
    case 'admin':
      return [
        ...commonPanels,
        { id: 'tasks', title: 'Tasks', type: 'tasks' as const, size: 'medium' as const, position: 2 },
        { id: 'audit', title: 'Audit Logs', type: 'audit' as const, size: 'large' as const, position: 3 },
      ];
    case 'supervisor':
      return [
        ...commonPanels,
        { id: 'tasks', title: 'Tasks', type: 'tasks' as const, size: 'large' as const, position: 2 },
        { id: 'performance', title: 'Performance', type: 'performance' as const, size: 'small' as const, position: 3 },
      ];
    case 'inspector':
      return [
        ...commonPanels,
        { id: 'tasks', title: 'Tasks', type: 'tasks' as const, size: 'medium' as const, position: 2 },
        { id: 'billable', title: 'Timesheet', type: 'billable' as const, size: 'medium' as const, position: 3 },
      ];
    case 'customer':
    default:
      return [
        ...commonPanels,
        { id: 'tasks', title: 'Tasks', type: 'tasks' as const, size: 'large' as const, position: 2 },
        { id: 'performance', title: 'Performance', type: 'performance' as const, size: 'small' as const, position: 3 },
      ];
  }
};

// Panel size to grid size mapping
export const sizeToClass = {
  small: 'col-span-1',
  medium: 'col-span-1 md:col-span-1 lg:col-span-1',
  large: 'col-span-1 md:col-span-2 lg:col-span-2',
  full: 'col-span-1 md:col-span-2 lg:col-span-4'
};
