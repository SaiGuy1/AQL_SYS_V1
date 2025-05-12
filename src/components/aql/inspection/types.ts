import { Dispatch, SetStateAction } from 'react';

export interface InspectionProps {
  jobId?: string;
}

export interface ScanTabProps {
  barcode: string;
  setBarcode: Dispatch<SetStateAction<string>>;
  handleBarcodeScan: () => void;
  clockedIn: boolean;
  scannedBarcodes: Array<{barcode: string, timestamp: string}>;
}

export interface InspectTabProps {
  barcode: string;
  defectPhotos: string[];
  setDefectPhotos: Dispatch<SetStateAction<string[]>>;
  handleSubmitInspection: () => void;
  setCurrentTab: Dispatch<SetStateAction<string>>;
}

export interface ChatTabProps {
  // Any props needed for the chat tab
}

export interface ClockControlProps {
  clockedIn: boolean;
  startTime: Date | null;
  handleClockIn: () => void;
  handleClockOut: () => void;
}

export interface TimesheetEntry {
  id: string;
  jobId: string;
  clockIn: Date;
  clockOut?: Date;
  totalHours?: number;
  isBillable: boolean;
  notes?: string;
}

export interface DefectReport {
  id: string;
  barcode: string;
  jobId: string;
  defectType: string;
  severity: 'minor' | 'major' | 'critical';
  notes: string;
  photos: string[];
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}
