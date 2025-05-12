import { UserRole } from "@/pages/AQLSystem";

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  _content?: string;
  _size?: string;
}

export interface Job {
  id: string;
  contractNumber: string;
  job_number?: string;
  location_number?: number;
  revision?: number;
  customerName: string;
  location: string;
  location_id?: string;
  startDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'on-hold' | 'needs-review' | 'rejected';
  defects: number;
  inspector?: string;
  inspector_id?: string;
  inspector_ids?: string[];
  shift: string;
  partName?: string;
  pphv?: number;
  billingStatus?: 'pending' | 'billed' | 'paid';
  certificationLevel?: 'basic' | 'standard' | 'premium';
  totalReviewed?: number;
  emergencyProcedures?: string;
  emergencyFloorPlan?: string;
  attachments?: Attachment[];
  instructions?: string;
}

export interface JobsListProps {
  userRole: UserRole;
}

export interface DefectType {
  id: string;
  name: string;
  description?: string;
  category?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface Defect {
  id: string;
  jobId: string;
  defectTypeId: string;
  defectTypeName: string;
  count: number;
  date: string;
  shift: string;
  reportedBy: string;
  status: 'pending' | 'approved' | 'rejected' | 'reworked';
  notes?: string;
  images?: string[];
}

export interface DefectLogEntry {
  date: string;
  defectTypeId: string;
  count: number;
}

export interface DailyReviewData {
  date: string;
  totalReviewed: number;
  totalDefects: number;
  pphv: number;
}

export interface DefectSummary {
  defectTypeId: string;
  defectTypeName: string;
  totalCount: number;
  byMonth: {
    [key: string]: number;
  };
  byDay: {
    [key: string]: number;
  };
}
