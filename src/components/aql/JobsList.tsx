import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockJobs } from './jobs/mockData';
import { Job } from '@/types/aql';
import JobFilters from './jobs/JobFilters';
import JobTable from './jobs/JobTable';
import JobMetrics from './jobs/JobMetrics';
import { 
  getVisibleColumns, 
  filterJobsByRole, 
  applyFilters, 
  getUniqueFilterValues 
} from './jobs/JobsUtils';
import { useTranslation } from '@/contexts/TranslationContext';
import { fetchJobs } from '@/services/aqlService';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, useDisclosure, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react';
import { Attachment } from './jobs/types';
import { UserRole } from '@/pages/AQLSystem';
import JobDetails from './JobDetails';
import { refreshJobs } from '@/redux/jobsSlice';
import { useDispatch } from 'react-redux';
import { supabase } from '@/lib/supabase';

// Adapter to convert API job format to UI job format
const adaptJobFormat = (apiJob) => {
  // For logging/debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Adapting job format:', apiJob);
    console.log('Job location_id:', apiJob.location_id);
    console.log('Job Number:', apiJob.job_number);
    console.log('Location Number:', apiJob.location_number);
    console.log('Revision:', apiJob.revision);
  }
  
  // Get inspector name from various potential sources
  let inspectorName = 'Unassigned';
  if (apiJob.inspector_ids && apiJob.inspector_ids.length > 0) {
    // Use the first inspector in the array as the primary inspector
    const primaryInspectorId = apiJob.inspector_ids[0];
    const inspectorObj = mockInspectors.find(i => i.id === primaryInspectorId);
    inspectorName = inspectorObj ? inspectorObj.name : 'Unknown Inspector';
  } else if (apiJob.inspector) {
    // Direct inspector field
    inspectorName = apiJob.inspector;
  } else if (apiJob.assignedTo) {
    // assignedTo could be a string (name/id) or an object
    inspectorName = typeof apiJob.assignedTo === 'object' 
      ? apiJob.assignedTo.name || 'Unassigned'
      : apiJob.assignedTo;
  }
  
  // Handle location information
  // Priority: 1. location object with address, 2. locationName field, 3. fallback
  let locationName = 'Unknown Location';
  if (apiJob.location && typeof apiJob.location === 'object' && apiJob.location.address) {
    locationName = apiJob.location.address;
  } else if (apiJob.locationName) {
    locationName = apiJob.locationName;
  } else if (typeof apiJob.location === 'string') {
    locationName = apiJob.location;
  }
   
  return {
    id: apiJob.id || `job-${Date.now()}`,
    contractNumber: apiJob.contractNumber || apiJob.id || 'Unknown',
    job_number: apiJob.job_number || null,
    location_number: apiJob.location_number || null,
    revision: apiJob.revision || 1,
    customerName: apiJob.customer?.name || 'Unknown Customer',
    location: locationName, // Use the processed location name
    location_id: apiJob.location_id || null, // Ensure location_id is included
    startDate: apiJob.createdAt || new Date().toISOString().split('T')[0],
    status: apiJob.status?.toLowerCase() || 'pending',
    defects: 0,
    // Use the extracted inspector name
    inspector: inspectorName,
    inspector_id: apiJob.inspector_id || null, // Ensure inspector_id is included
    shift: 'Morning',
    partName: apiJob.title || 'Unknown Part',
    pphv: 0,
    billingStatus: 'pending' as const,
    // Add instructions if present
    instructions: apiJob.instructions || '',
    // Transform attachments if they exist
    attachments: apiJob.attachments?.map(att => ({
      id: att.id,
      name: att.name,
      url: att.content || att.url || '',
      type: att.type,
      _content: att._content || att.url, // Store content for display
      _size: att._size || 'Unknown size'
    })) || []
  };
};

const JobsList: React.FC<JobsListProps> = ({ userRole }) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const { t } = useTranslation();
  const { toast } = useToast();

  // Load jobs based on role
  useEffect(() => {
    setLoading(true);
    
    // Get authenticated user and fetch jobs
    const fetchJobsForUser = async () => {
      try {
        // Get current authenticated user from Supabase
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.warn("No authenticated user found, loading all jobs");
        }
        
        // If user is authenticated, apply role-specific filtering when fetching from database
        let jobsQuery = supabase.from('jobs').select('*');
        
        // Apply role-specific filters
        if (user && userRole) {
          if (userRole === 'inspector') {
            // Inspectors should only see jobs assigned to them
            jobsQuery = jobsQuery.or(`inspector_id.eq.${user.id},assignedTo.eq.${user.id}`);
          } else if (userRole === 'supervisor') {
            // Supervisors might see jobs for their location
            // Get location_id from user metadata first
            let location_id = null;
            
            if (user.user_metadata && user.user_metadata.location_id) {
              location_id = user.user_metadata.location_id;
            } else {
              // Fallback to RPC if not in metadata
              const { data: rpcResult } = await supabase.rpc('get_user_location_id', { 
                user_id: user.id 
              });
              
              if (rpcResult) {
                location_id = rpcResult;
                
                // Update user metadata for future JWT claims
                await supabase.auth.updateUser({
                  data: { location_id: location_id }
                });
              }
            }
                  
            if (location_id) {
              jobsQuery = jobsQuery.eq('location_id', location_id);
            }
          }
          // Admin and managers see all jobs (no filter)
        }
        
        // Execute the query
        const { data, error } = await jobsQuery;
        
        if (error) {
          console.error("Error fetching jobs from Supabase:", error);
          throw error;
        }
        
        // Transform the jobs to match the UI format
        const adaptedJobs = data?.map(adaptJobFormat) || [];
        
        setJobs(adaptedJobs);
        setFilteredJobs(adaptedJobs);
        
        console.log(`Loaded ${adaptedJobs.length} jobs based on user role (${userRole})`);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        // Fallback to regular fetchJobs in case of error
        fetchJobs()
          .then(fetchedJobs => {
            const adaptedJobs = fetchedJobs.map(adaptJobFormat);
            setJobs(adaptedJobs);
            setFilteredJobs(adaptedJobs);
          })
          .catch(error => {
            console.error("Error with fallback job fetch:", error);
            // As a last resort, use mock data
            const adaptedJobs = mockJobs.map(job => ({...job}));
            setJobs(adaptedJobs);
            setFilteredJobs(adaptedJobs);
          });
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobsForUser();
  }, [userRole]);

  // Create a function to refresh the job list
  const refreshJobs = () => {
    setLoading(true);
    fetchJobs()
      .then(fetchedJobs => {
        const adaptedJobs = fetchedJobs.map(adaptJobFormat);
        // No role-based filtering for demo
        setJobs(adaptedJobs);
        setFilteredJobs(adaptedJobs);
      })
      .catch(error => {
        console.error("Error refreshing jobs:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Apply filters when any filter changes
  useEffect(() => {
    const result = applyFilters(
      jobs, 
      searchTerm, 
      statusFilter, 
      locationFilter, 
      customerFilter, 
      shiftFilter
    );
    setFilteredJobs(result);
  }, [searchTerm, statusFilter, locationFilter, customerFilter, shiftFilter, jobs]);

  // Get unique filter values
  const { locations, customers, shifts } = getUniqueFilterValues(jobs);
  
  // Get visible columns based on role
  const visibleColumns = getVisibleColumns(userRole);

  // Add debug button for demo to clear jobs (but not all localStorage data)
  const clearDemoData = () => {
    if (window.confirm('This will reset all job data. Continue?')) {
      // Only remove jobs data, preserving other localStorage items
      localStorage.removeItem("jobs");
      // Refresh the jobs list
      refreshJobs();
      // Show a notification
      toast({
        title: "Demo Reset",
        description: "All job data has been cleared."
      });
    }
  };

  // Add export job data function
  const exportJobData = () => {
    try {
      const jobsData = JSON.stringify(jobs, null, 2);
      const blob = new Blob([jobsData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = `aql-jobs-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: "Backup Created",
        description: "Job data has been exported to a JSON file"
      });
    } catch (error) {
      console.error("Error exporting job data:", error);
      toast({
        title: "Export Failed",
        description: "There was an error creating the backup file",
        variant: "destructive"
      });
    }
  };

  // Add import job data function
  const importJobData = () => {
    try {
      // Create a file input element
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      
      fileInput.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const jobsData = JSON.parse(event.target?.result as string);
            
            // Validate that jobsData is an array
            if (!Array.isArray(jobsData)) {
              throw new Error('Invalid job data format');
            }
            
            // Store jobs in localStorage
            localStorage.setItem("jobs", JSON.stringify(jobsData));
            
            // Refresh the jobs list
            refreshJobs();
            
            toast({
              title: "Jobs Imported Successfully",
              description: `${jobsData.length} jobs have been imported`
            });
          } catch (parseError) {
            console.error("Error parsing job data:", parseError);
            toast({
              title: "Import Failed",
              description: "The file contains invalid job data",
              variant: "destructive"
            });
          }
        };
        
        reader.onerror = () => {
          toast({
            title: "Import Failed",
            description: "Failed to read the file",
            variant: "destructive"
          });
        };
        
        reader.readAsText(file);
      };
      
      // Trigger file selection
      fileInput.click();
    } catch (error) {
      console.error("Error importing job data:", error);
      toast({
        title: "Import Failed",
        description: "There was an error importing the jobs",
        variant: "destructive"
      });
    }
  };

  // Add a function to make all jobs visible across roles
  const makeJobsVisibleAcrossRoles = () => {
    try {
      // Call the global function if available
      if (typeof window !== 'undefined' && (window as any).makeAllJobsVisibleAcrossRoles) {
        (window as any).makeAllJobsVisibleAcrossRoles();
        
        // Refresh the jobs list
        refreshJobs();
        
        toast({
          title: "Jobs Updated",
          description: "All jobs should now be visible across all user roles"
        });
      } else {
        toast({
          title: "Function Not Available",
          description: "The makeAllJobsVisibleAcrossRoles function is not available",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error making jobs visible:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the jobs",
        variant: "destructive"
      });
    }
  };
  
  // Add function to repair inspector assignments
  const repairInspectorAssignments = () => {
    try {
      // Call the global function if available
      if (typeof window !== 'undefined' && (window as any).repairInspectorAssignments) {
        (window as any).repairInspectorAssignments();
        
        // Refresh the jobs list
        refreshJobs();
        
        toast({
          title: "Inspector Assignments Repaired",
          description: "All jobs have been updated with consistent inspector assignments"
        });
      } else {
        toast({
          title: "Function Not Available",
          description: "The repairInspectorAssignments function is not available",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error repairing inspector assignments:", error);
      toast({
        title: "Repair Failed",
        description: "There was an error repairing inspector assignments",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <CardTitle className="text-xl font-bold">{t('job_management')}</CardTitle>
          <CardDescription>
            {t(userRole === 'admin' ? 'admin_dashboard' :
                userRole === 'manager' ? 'manager_dashboard' :
                userRole === 'supervisor' ? 'supervisor_dashboard' :
                userRole === 'inspector' ? 'inspector_dashboard' :
                userRole === 'hr' ? 'hr_dashboard' :
                userRole === 'accounting' ? 'accounting_dashboard' :
                'customer_dashboard')}
          </CardDescription>
        </div>
        
        <div className="flex items-center gap-2">
          <JobFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            locationFilter={locationFilter}
            setLocationFilter={setLocationFilter}
            customerFilter={customerFilter}
            setCustomerFilter={setCustomerFilter}
            shiftFilter={shiftFilter}
            setShiftFilter={setShiftFilter}
            locations={locations}
            customers={customers}
            shifts={shifts}
            userRole={userRole}
          />
          {(userRole === 'admin' || userRole === 'manager') && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={exportJobData}
                className="text-xs bg-blue-50 text-blue-700 border-blue-200 hidden sm:flex items-center gap-1"
              >
                <Download className="h-3 w-3" /> Backup Jobs
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={importJobData}
                className="text-xs bg-green-50 text-green-700 border-green-200 hidden sm:flex items-center gap-1"
              >
                <Upload className="h-3 w-3" /> Import Jobs
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={makeJobsVisibleAcrossRoles}
                className="text-xs bg-purple-50 text-purple-700 border-purple-200 hidden sm:flex items-center gap-1"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 19L17 21L21 17M12 15C8.13401 15 5 11.866 5 8C5 4.13401 8.13401 1 12 1C15.866 1 19 4.13401 19 8C19 9.93 18.2174 11.683 16.9357 12.9772M9 11L12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg> Make All Visible
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={repairInspectorAssignments}
                className="text-xs bg-cyan-50 text-cyan-700 border-cyan-200 hidden sm:flex items-center gap-1"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 10h8M8 14h8M8 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg> Fix Inspectors
              </Button>
              <Button 
                onClick={clearDemoData}
                size="sm"
                variant="outline"
                className="text-xs bg-red-100 text-red-700 border-red-200 hidden sm:block"
              >
                Reset Demo
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <JobTable 
          loading={loading} 
          filteredJobs={filteredJobs} 
          userRole={userRole} 
          visibleColumns={visibleColumns}
          onRefresh={refreshJobs}
        />

        <JobMetrics jobs={jobs} userRole={userRole} />
      </CardContent>
    </Card>
  );
};

export default JobsList;
