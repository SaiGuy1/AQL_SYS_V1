import { toast } from "sonner";
import { supabase } from '@/lib/supabase';

export interface Job {
  job_id: string;
  name: string;
  customer_id: string;
  location_id: string;
  location_name: string;
  status: 'Active' | 'Pending' | 'Completed';
  start_date: string;
  shifts: string[];
}

export interface Defect {
  defect_id: string;
  job_id: string;
  defect_type_id: string;
  defect_type_name: string;
  status: 'pending' | 'approved' | 'rejected';
  reported_at: string;
  severity: 'minor' | 'major' | 'critical';
}

export interface Task {
  task_id: string;
  job_id: string;
  name: string;
  status: 'open' | 'in_progress' | 'completed';
  progress: number;
  quantity: number;
  updated_at: string;
}

export interface JobMetrics {
  total_inspected: number;
  total_defects: number;
  pending_defects: number;
  open_tasks: number;
  completion_rate: number;
}

export interface DefectTrend {
  date: string;
  category1: number;
  category2: number;
}

export interface DefectPareto {
  name: string;
  june: number;
  july: number;
  august: number;
}

export interface PerformanceMetric {
  date: string;
  value: number;
  average?: number;
}

export interface TimesheetEntry {
  timesheet_id: string;
  user_id: string;
  job_id: string;
  hours: number;
  is_billable: boolean;
  date: string;
  notes: string;
}

export interface AuditLog {
  log_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  details: string;
}

const mockJobs: Job[] = [
  { 
    job_id: '69-0010039', 
    name: 'Seat Assembly Project', 
    customer_id: 'cust001',
    location_id: 'loc001',
    location_name: 'Detroit, MI', 
    status: 'Active', 
    start_date: '2023-10-15',
    shifts: ['1st Shift', '2nd Shift', '3rd Shift']
  },
  { 
    job_id: '69-0010040', 
    name: 'Dashboard Installation', 
    customer_id: 'cust001',
    location_id: 'loc002',
    location_name: 'Chicago, IL', 
    status: 'Pending', 
    start_date: '2023-11-01',
    shifts: ['1st Shift', '2nd Shift']
  },
  { 
    job_id: '69-0010041', 
    name: 'Door Panel Assembly', 
    customer_id: 'cust001',
    location_id: 'loc001',
    location_name: 'Detroit, MI', 
    status: 'Completed', 
    start_date: '2023-09-01',
    shifts: ['1st Shift', '3rd Shift']
  },
  { 
    job_id: '69-0010042', 
    name: 'Interior Trim Installation', 
    customer_id: 'cust001',
    location_id: 'loc003',
    location_name: 'Toledo, OH', 
    status: 'Active', 
    start_date: '2023-10-10',
    shifts: ['2nd Shift']
  },
];

const mockDefectTrends: DefectTrend[] = [
  { date: 'Jun 24', category1: 2.8, category2: 3.9 },
  { date: 'Jul 10', category1: 2.3, category2: 3.2 },
  { date: 'Jul 24', category1: 3.6, category2: 4.4 },
  { date: 'Aug 8', category1: 3.0, category2: 3.5 },
  { date: 'Aug 24', category1: 3.3, category2: 5.1 },
  { date: 'Sep 1', category1: 3.8, category2: 5.3 },
];

const mockParetoData: DefectPareto[] = [
  { name: 'Headrest Functional', june: 4, july: 3, august: 6 },
  { name: 'White Locking Tab Lock', june: 2, july: 4, august: 6 },
  { name: 'Rat Holes Present', june: 6, july: 2, august: 3 },
];

const mockTasks: Task[] = [
  { task_id: '1', job_id: '69-0010039', name: 'Rat Holes', progress: 17.5, quantity: 2458, updated_at: '2021-01-24', status: 'open' },
  { task_id: '2', job_id: '69-0010039', name: 'Hog Ring Missing', progress: 10.8, quantity: 1485, updated_at: '2021-06-12', status: 'in_progress' },
  { task_id: '3', job_id: '69-0010039', name: 'Cup holder not loose', progress: 21.3, quantity: 1024, updated_at: '2021-01-05', status: 'in_progress' },
  { task_id: '4', job_id: '69-0010039', name: 'Dirt/Debris in Seat back', progress: 31.5, quantity: 858, updated_at: '2021-03-07', status: 'in_progress' },
  { task_id: '5', job_id: '69-0010039', name: 'White locking tab', progress: 12.2, quantity: 258, updated_at: '2021-12-17', status: 'open' },
];

const mockPerformanceData: PerformanceMetric[] = [
  { date: '9/1', value: 18 },
  { date: '9/2', value: 22 },
  { date: '9/3', value: 15 },
  { date: '9/4', value: 28 },
  { date: '9/5', value: 35 },
  { date: '9/6', value: 30 },
];

const mockTimesheetEntries: TimesheetEntry[] = [
  { 
    timesheet_id: '1', 
    user_id: 'user001', 
    job_id: '69-0010039', 
    hours: 8, 
    is_billable: true, 
    date: '2023-09-01', 
    notes: 'Regular inspection work' 
  },
  { 
    timesheet_id: '2', 
    user_id: 'user001', 
    job_id: '69-0010039', 
    hours: 2, 
    is_billable: false, 
    date: '2023-09-01', 
    notes: 'Team meeting' 
  },
  { 
    timesheet_id: '3', 
    user_id: 'user002', 
    job_id: '69-0010039', 
    hours: 6, 
    is_billable: true, 
    date: '2023-09-02', 
    notes: 'Defect reporting' 
  },
  { 
    timesheet_id: '4', 
    user_id: 'user002', 
    job_id: '69-0010040', 
    hours: 4, 
    is_billable: true, 
    date: '2023-09-02', 
    notes: 'Minimum billable hours' 
  },
];

const mockAuditLogs: AuditLog[] = [
  {
    log_id: '1',
    user_id: 'user001',
    action: 'update',
    entity_type: 'timesheet',
    entity_id: '1',
    timestamp: '2023-09-01T14:30:00Z',
    details: 'Changed billable status from true to false'
  },
  {
    log_id: '2',
    user_id: 'user002',
    action: 'create',
    entity_type: 'defect',
    entity_id: 'def123',
    timestamp: '2023-09-02T10:15:00Z',
    details: 'Created new defect report'
  },
  {
    log_id: '3',
    user_id: 'user003',
    action: 'approve',
    entity_type: 'defect',
    entity_id: 'def124',
    timestamp: '2023-09-03T09:45:00Z',
    details: 'Approved defect resolution'
  }
];

const API_BASE_URL = '/api';

const initializeLocalStorage = () => {
  if (!localStorage.getItem('aql_jobs')) {
    localStorage.setItem('aql_jobs', JSON.stringify(mockJobs));
  }
  
  if (!localStorage.getItem('aql_timesheets')) {
    localStorage.setItem('aql_timesheets', JSON.stringify(mockTimesheetEntries));
  }
  
  if (!localStorage.getItem('aql_audit_logs')) {
    localStorage.setItem('aql_audit_logs', JSON.stringify(mockAuditLogs));
  }
};

(() => {
  try {
    initializeLocalStorage();
  } catch (error) {
    console.error("Error initializing localStorage:", error);
  }
})();

const handleApiError = (error: any, fallbackData: any, errorMessage: string) => {
  console.error(errorMessage, error);
  toast.error("Unable to fetch data. Using cached data.");
  return fallbackData;
};

export const fetchCustomerJobs = async (customerId: string): Promise<Job[]> => {
  try {
    console.log(`Fetching jobs for customer ${customerId}`);
    
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('customer_id', customerId);
    
    if (error) {
      console.error("Error fetching customer jobs:", error);
      throw error;
    }
    
    // Map to Job interface expected by components
    const jobs: Job[] = data.map(job => ({
      job_id: job.id,
      name: job.title,
      customer_id: job.customer_id,
      location_id: job.location_id,
      location_name: job.location_data?.address || 'Unknown',
      status: job.status,
      start_date: job.created_at,
      shifts: job.shifts_data || []
    }));
    
    console.log(`Retrieved ${jobs.length} jobs for customer ${customerId}`);
    return jobs;
  } catch (error) {
    console.error("Error in fetchCustomerJobs:", error);
    throw error;
  }
};

export const fetchJobMetrics = async (jobId: string): Promise<JobMetrics> => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/metrics`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch job metrics: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return handleApiError(error, {
      total_inspected: 8064,
      total_defects: 1576,
      pending_defects: 42,
      open_tasks: 154,
      completion_rate: 78.5
    }, "Failed to fetch job metrics");
  }
};

export const fetchDefectTrends = async (jobId: string, timeRange: string = 'this_month'): Promise<DefectTrend[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/defect-trends?range=${timeRange}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch defect trends: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return handleApiError(error, mockDefectTrends, "Failed to fetch defect trends");
  }
};

export const fetchDefectPareto = async (jobId: string, timeRange: string = '3_months'): Promise<DefectPareto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/defects?group_by=type&time_range=${timeRange}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch defect pareto data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return handleApiError(error, mockParetoData, "Failed to fetch defect pareto data");
  }
};

export const fetchJobTasks = async (jobId: string): Promise<Task[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/tasks`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch job tasks: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return handleApiError(
      error, 
      mockTasks.filter(task => task.job_id === jobId), 
      "Failed to fetch job tasks"
    );
  }
};

export const fetchPerformanceMetrics = async (jobId: string, timeRange: string = 'current_period'): Promise<PerformanceMetric[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/performance-metrics?time_range=${timeRange}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch performance metrics: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return handleApiError(error, mockPerformanceData, "Failed to fetch performance metrics");
  }
};

export const fetchTimesheetEntries = async (jobId: string): Promise<TimesheetEntry[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/timesheets`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch timesheet entries: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    const savedTimesheets = localStorage.getItem('aql_timesheets');
    if (savedTimesheets) {
      const timesheets: TimesheetEntry[] = JSON.parse(savedTimesheets);
      return timesheets.filter(entry => entry.job_id === jobId);
    }
    
    return handleApiError(
      error, 
      mockTimesheetEntries.filter(entry => entry.job_id === jobId), 
      "Failed to fetch timesheet entries"
    );
  }
};

export const updateTimesheetBillableStatus = async (
  timesheetId: string, 
  isBillable: boolean,
  notes: string = ''
): Promise<TimesheetEntry> => {
  try {
    const response = await fetch(`${API_BASE_URL}/timesheets/${timesheetId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_billable: isBillable, notes }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update timesheet: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to update timesheet billable status:", error);
    toast.error("Changes saved locally but not to the server");
    
    const savedTimesheets = localStorage.getItem('aql_timesheets');
    let timesheets: TimesheetEntry[] = savedTimesheets ? JSON.parse(savedTimesheets) : [];
    
    const updatedTimesheets = timesheets.map(t => {
      if (t.timesheet_id === timesheetId) {
        return { ...t, is_billable: isBillable, notes: notes || t.notes };
      }
      return t;
    });
    
    localStorage.setItem('aql_timesheets', JSON.stringify(updatedTimesheets));
    
    const newAuditLog: AuditLog = {
      log_id: `log-${Date.now()}`,
      user_id: 'current_user',
      action: 'update',
      entity_type: 'timesheet',
      entity_id: timesheetId,
      timestamp: new Date().toISOString(),
      details: `Changed billable status to ${isBillable ? 'billable' : 'non-billable'}`
    };
    
    const savedLogs = localStorage.getItem('aql_audit_logs');
    let logs: AuditLog[] = savedLogs ? JSON.parse(savedLogs) : [];
    logs.push(newAuditLog);
    localStorage.setItem('aql_audit_logs', JSON.stringify(logs));
    
    const updatedTimesheet = updatedTimesheets.find(t => t.timesheet_id === timesheetId);
    return updatedTimesheet || mockTimesheetEntries[0];
  }
};

export const fetchAuditLogs = async (entityType?: string, entityId?: string): Promise<AuditLog[]> => {
  try {
    let url = `${API_BASE_URL}/audit-logs`;
    
    if (entityType || entityId) {
      url += '?';
      if (entityType) url += `entity_type=${entityType}`;
      if (entityType && entityId) url += '&';
      if (entityId) url += `entity_id=${entityId}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch audit logs: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    const savedLogs = localStorage.getItem('aql_audit_logs');
    if (savedLogs) {
      let logs: AuditLog[] = JSON.parse(savedLogs);
      
      if (entityType) {
        logs = logs.filter(log => log.entity_type === entityType);
      }
      
      if (entityId) {
        logs = logs.filter(log => log.entity_id === entityId);
      }
      
      return logs;
    }
    
    let filteredLogs = [...mockAuditLogs];
    
    if (entityType) {
      filteredLogs = filteredLogs.filter(log => log.entity_type === entityType);
    }
    
    if (entityId) {
      filteredLogs = filteredLogs.filter(log => log.entity_id === entityId);
    }
    
    return handleApiError(error, filteredLogs, "Failed to fetch audit logs");
  }
};

export const fetchJobBillableHours = async (jobId: string): Promise<{total: number, billable: number, unbillable: number}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/billable-hours`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch billable hours: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    const timesheets = mockTimesheetEntries.filter(t => t.job_id === jobId);
    const total = timesheets.reduce((sum, t) => sum + t.hours, 0);
    const billable = timesheets.filter(t => t.is_billable).reduce((sum, t) => sum + t.hours, 0);
    const unbillable = total - billable;
    
    return handleApiError(error, { total, billable, unbillable }, "Failed to fetch billable hours");
  }
};

export const calculateCurrentPPHV = (metrics: PerformanceMetric[]): number => {
  if (!metrics || metrics.length === 0) return 0;
  
  const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
  return Number((sum / metrics.length).toFixed(2));
};
