export type JobStatus = 'draft' | 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';

export interface Customer {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
}

export interface Location {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
}

export interface JobFormData {
  // Basic Info
  contractNumber?: string;
  job_number?: string;
  serviceStartDate?: string;
  aqlContact?: string;
  estimatedHours?: number;
  
  // Customer Information
  customerName: string;
  customerContact?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerCity?: string;
  customerCellPhone?: string;
  customerState?: string;
  customerEmail?: string;
  
  // Job Details
  requiredService?: string;
  additionalCharges?: string;
  authorizationType?: string;
  reportingRequested?: string;
  parts?: Array<{
    partNumber: string;
    partName: string;
    defectDescription: string;
  }>;
  batchProcessing?: boolean;
  batchSize?: number;
  timeStudy?: number;
  cleanPointFrequency?: string;
  cleanPointInstructions?: string;
  
  // Location
  jobLocation?: string;
  location_id?: string;
  jobLocationContact?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  locationNumber?: string;
  geoRadius?: number;
  
  // Requirements
  safetyRequirements?: Array<{
    id: string;
    label: string;
    checked: boolean;
  }>;
  customSafety?: string;
  jobDetails?: string;
  defectGuidelines?: string;
  
  // Work Instructions
  instructions?: string;
  isGeneratingInstructions?: boolean;
  generationError?: string | null;
  
  // Emergency
  emergencyEvacuationProcedures?: string;
  emergencyEvacuationImage?: string | null;
  
  // Inspector Assignment
  inspectorId?: string;
  inspector_ids?: string[];
  supervisor_ids?: string[];
  
  // Attachments
  attachments?: Array<{
    type: 'sop' | 'defect' | 'other';
    name: string;
    size: string;
    url: string;
    content: string;
  }>;
  
  // Service Limits
  qtyNumberOfParts?: number;
  timeInHours?: number;
  cost?: number;
}

export interface Job {
  id?: string;
  title: string;
  job_number?: string;
  location_id: string;
  inspector_ids: string[];
  supervisor_ids: string[];
  status: JobStatus;
  form_data: JobFormData;
  customer: Customer;
  location: Location;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Inspector {
  id: string;
  name: string;
  email: string;
  role: 'inspector' | 'supervisor' | 'admin' | 'manager';
  certifications: string[];
  isAvailable: boolean;
}

export interface Defect {
  id: string;
  job_id: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  reported_at: string;
  resolved_at?: string;
  comments: Array<{
    id: string;
    text: string;
    user_id: string;
    created_at: string;
  }>;
}

export interface Timesheet {
  id: string;
  inspector_id: string;
  inspector_name: string;
  job_id: string;
  job_title: string;
  clock_in: string;
  clock_out?: string;
  total_hours?: number;
  is_billable: boolean;
  is_approved: boolean;
  overtime: number;
}

export interface Report {
  id: string;
  name: string;
  type: 'defect' | 'performance' | 'billing' | 'custom';
  date_range: {
    start: string;
    end: string;
  };
  customer_id?: string;
  format: 'PDF' | 'CSV' | 'EXCEL';
  created_at: string;
  created_by: string;
  data: any;
} 