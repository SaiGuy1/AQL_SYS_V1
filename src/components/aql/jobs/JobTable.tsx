import React, { useState, useEffect } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import StatusBadge from './StatusBadge';
import ActionButtons from './ActionButtons';
import JobAttachments from './JobAttachments';
import { Job } from './types';
import { UserRole } from '@/pages/AQLSystem';
import { useTranslation } from '@/contexts/TranslationContext';
import { supabase } from '@/lib/supabase';

// Define inspector profile interface
interface InspectorProfile {
  id?: string;
  user_id: string;
  name: string;
  email?: string;
  role?: string;
}

interface JobTableProps {
  loading: boolean;
  filteredJobs: Job[];
  userRole: UserRole;
  visibleColumns: string[];
  onRefresh?: () => void;
}

// Add a new column for attachments
const getVisibleColumnsWithAttachments = (visibleColumns: string[]) => {
  // If visibleColumns includes Actions, insert Attachments before Actions
  if (visibleColumns.includes('Actions')) {
    const actionIndex = visibleColumns.indexOf('Actions');
    const newColumns = [...visibleColumns];
    newColumns.splice(actionIndex, 0, 'Attachments');
    return newColumns;
  }
  
  // Otherwise, add Attachments at the end
  return [...visibleColumns, 'Attachments'];
};

const JobTable: React.FC<JobTableProps> = ({ 
  loading, 
  filteredJobs, 
  userRole, 
  visibleColumns,
  onRefresh 
}) => {
  const { t } = useTranslation();
  const [inspectorProfiles, setInspectorProfiles] = useState<Record<string, InspectorProfile>>({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  
  // Fetch inspector profiles
  useEffect(() => {
    const fetchInspectorProfiles = async () => {
      setLoadingProfiles(true);
      try {
        // First try to get profiles from profiles table (new schema)
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('user_id, name, email, role')
          .eq('role', 'inspector');
          
        if (error) {
          console.error("Error fetching inspector profiles:", error);
          throw error;
        }
        
        // Map profiles by user_id for easy lookup
        const profileMap: Record<string, InspectorProfile> = {};
        if (profiles) {
          profiles.forEach(profile => {
            profileMap[profile.user_id] = profile;
          });
        }
        
        // Also try to get inspectors from inspectors table (legacy)
        const { data: inspectors, error: inspectorError } = await supabase
          .from('inspectors')
          .select('user_id, name, email, location_id');
          
        if (!inspectorError && inspectors) {
          // Add any missing inspectors to the profileMap
          inspectors.forEach(inspector => {
            if (!profileMap[inspector.user_id]) {
              profileMap[inspector.user_id] = inspector;
            }
          });
        }
        
        setInspectorProfiles(profileMap);
        console.log("Loaded inspector profiles:", Object.keys(profileMap).length);
      } catch (err) {
        console.error("Failed to load inspector profiles:", err);
      } finally {
        setLoadingProfiles(false);
      }
    };
    
    fetchInspectorProfiles();
  }, []);
  
  // Helper to get inspector name from profile
  const getInspectorName = (inspector_id?: string): string => {
    if (!inspector_id) return 'Unassigned';
    
    // Try to find in profiles
    const profile = inspectorProfiles[inspector_id];
    if (profile) return profile.name;
    
    // Fallback to original inspector name in job
    return 'Unknown';
  };
  
  // Get the extended visible columns with Attachments
  const extendedColumns = getVisibleColumnsWithAttachments(visibleColumns);
  
  // Map column names to translation keys
  const getColumnTranslation = (column: string) => {
    switch(column) {
      case 'Contract #': return t('contract_number');
      case 'Job #': return t('job_number');
      case 'Customer': return t('customer');
      case 'Location': return t('location');
      case 'Start Date': return t('start_date');
      case 'Status': return t('status');
      case 'Defects': return t('defects');
      case 'PPHV': return t('pphv');
      case 'Inspector': return t('inspector');
      case 'Part Name': return t('part_name');
      case 'Billing Status': return t('billing_status');
      case 'Attachments': return 'Attachments';
      case 'Actions': return t('actions');
      default: return column;
    }
  };
  
  // Map billing status to translation keys
  const getBillingStatusTranslation = (status: string) => {
    switch(status) {
      case 'pending': return t('billing_pending');
      case 'billed': return t('billing_billed');
      case 'paid': return t('billing_paid');
      default: return status;
    }
  };

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {extendedColumns.map((column) => (
                <TableHead key={column} className="text-xs uppercase tracking-wider text-gray-500">
                  {getColumnTranslation(column)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || loadingProfiles ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  {Array(extendedColumns.length).fill(0).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredJobs.length > 0 ? (
              filteredJobs.map(job => (
                <TableRow key={job.id} className="hover:bg-gray-50">
                  {extendedColumns.includes('Contract #') && (
                    <TableCell className="font-medium">{job.contractNumber}</TableCell>
                  )}
                  
                  {extendedColumns.includes('Job #') && (
                    <TableCell className="font-medium text-blue-600">
                      {job.job_number || '-'}
                    </TableCell>
                  )}
                  
                  {extendedColumns.includes('Customer') && (
                    <TableCell>{job.customerName}</TableCell>
                  )}
                  
                  {extendedColumns.includes('Location') && (
                    <TableCell>{job.location}</TableCell>
                  )}
                  
                  {extendedColumns.includes('Start Date') && (
                    <TableCell>{new Date(job.startDate).toLocaleDateString()}</TableCell>
                  )}
                  
                  {extendedColumns.includes('Status') && (
                    <TableCell><StatusBadge status={job.status} /></TableCell>
                  )}
                  
                  {extendedColumns.includes('Defects') && (
                    <TableCell>{job.defects}</TableCell>
                  )}
                  
                  {extendedColumns.includes('PPHV') && (
                    <TableCell>{job.pphv || 'N/A'}</TableCell>
                  )}
                  
                  {extendedColumns.includes('Inspector') && (
                    <TableCell>
                      {job.inspector_ids && job.inspector_ids.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {job.inspector_ids.map((inspectorId, index) => (
                            <Badge key={inspectorId} variant="secondary" className="w-fit">
                              {getInspectorName(inspectorId)}
                            </Badge>
                          ))}
                        </div>
                      ) : job.inspector ? (
                        <Badge variant="secondary" className="w-fit">
                          {job.inspector}
                        </Badge>
                      ) : (
                        <span className="text-gray-500">Unassigned</span>
                      )}
                    </TableCell>
                  )}
                  
                  {extendedColumns.includes('Part Name') && (
                    <TableCell>{job.partName || 'N/A'}</TableCell>
                  )}
                  
                  {extendedColumns.includes('Billing Status') && (
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          job.billingStatus === 'pending' ? "bg-yellow-50 text-yellow-700 border-yellow-300" :
                          job.billingStatus === 'billed' ? "bg-blue-50 text-blue-700 border-blue-300" :
                          "bg-green-50 text-green-700 border-green-300"
                        }
                      >
                        {getBillingStatusTranslation(job.billingStatus)}
                      </Badge>
                    </TableCell>
                  )}
                  
                  {extendedColumns.includes('Attachments') && (
                    <TableCell>
                      {job['attachments'] && Array.isArray(job['attachments']) && job['attachments'].length > 0 ? (
                        <JobAttachments attachments={job['attachments']} />
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                  )}
                  
                  {extendedColumns.includes('Actions') && (
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <ActionButtons 
                          job={job} 
                          userRole={userRole}
                          onJobUpdated={onRefresh}
                        />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={extendedColumns.length} className="py-8 text-center text-gray-500">
                  {t('no_jobs_found')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default JobTable;
