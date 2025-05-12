export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

export interface Inspector {
  id: string;
  name: string;
  email: string;
  role: 'Inspector' | 'Supervisor' | 'Manager';
  certifications: string[];
  isAvailable: boolean;
}

export interface Job {
  id: string;
  title: string;
  job_number?: string;
  location_number?: number;
  revision?: number;
  customer: Customer;
  safetyRequirements: string[];
  instructions: string;
  defectGuidelines: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  location_id?: string;
  estimatedHours: number;
  isBatchJob: boolean;
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
  assignedTo?: string;
  inspector?: string;
  inspector_id?: string;
  createdAt: string;
  updatedAt: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  attachments: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

export interface Defect {
  id: string;
  jobId: string;
  description: string;
  severity: 'Minor' | 'Major' | 'Critical';
  images: string[];
  batchNumber?: string;
  lotNumber?: string;
  reportedBy: string;
  reportedAt: string;
  status: 'Open' | 'Under Review' | 'Resolved';
  resolution?: string;
  comments: {
    id: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: string;
  }[];
}

export interface Timesheet {
  id: string;
  inspectorId: string;
  inspectorName: string;
  jobId: string;
  jobTitle: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  isBillable: boolean;
  isApproved: boolean;
  approvedBy?: string;
  comments?: string;
  overtime: number;
}

export interface Report {
  id: string;
  name: string;
  type: 'Defect' | 'Performance' | 'Billing' | 'Custom';
  dateRange: {
    start: string;
    end: string;
  };
  customerId?: string;
  format: 'CSV' | 'Excel' | 'PDF';
  createdAt: string;
  createdBy: string;
  data: any;
}
