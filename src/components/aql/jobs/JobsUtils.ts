import { UserRole } from "@/pages/AQLSystem";
import { Job } from "./types";

// Get visible columns based on user role
export const getVisibleColumns = (userRole: UserRole): string[] => {
  const columns = {
    admin: ['Contract #', 'Job #', 'Customer', 'Location', 'Start Date', 'Status', 'Defects', 'PPHV', 'Inspector', 'Part Name', 'Billing Status', 'Actions'],
    manager: ['Contract #', 'Job #', 'Customer', 'Location', 'Start Date', 'Status', 'Defects', 'PPHV', 'Inspector', 'Part Name', 'Actions'],
    supervisor: ['Contract #', 'Job #', 'Customer', 'Location', 'Start Date', 'Status', 'Defects', 'PPHV', 'Inspector', 'Part Name', 'Actions'],
    inspector: ['Contract #', 'Job #', 'Customer', 'Location', 'Start Date', 'Status', 'Defects', 'Part Name', 'Actions'],
    hr: ['Contract #', 'Job #', 'Customer', 'Location', 'Start Date', 'Status', 'Inspector', 'Part Name', 'Actions'],
    accounting: ['Contract #', 'Job #', 'Customer', 'Location', 'Start Date', 'Status', 'PPHV', 'Part Name', 'Billing Status', 'Actions'],
    customer: ['Contract #', 'Job #', 'Location', 'Start Date', 'Status', 'Defects', 'Part Name', 'Actions'],
  };
  
  return columns[userRole] || columns.customer;
};

// Function to filter jobs based on user role
export const filterJobsByRole = (jobs: Job[], userRole: UserRole, currentUser: string = ''): Job[] => {
  // DEMO MODE ENABLED: All users see all jobs regardless of role
  // This change ensures full visibility of jobs across all roles for demonstration purposes
  // In a production environment, you would uncomment the role-based filtering logic below
  console.log(`Showing all ${jobs.length} jobs without role filtering for demo purposes`);
  return jobs;
  
  /*
  // Role-based filtering logic (disabled for demo)
  if (userRole === 'admin' || userRole === 'manager') {
    // Admin and manager can see all jobs
    return jobs;
  } else if (userRole === 'inspector') {
    // Inspectors can only see jobs assigned to them
    return jobs.filter(job => job.inspector === currentUser);
  } else if (userRole === 'customer') {
    // Customers can only see their own jobs
    return jobs.filter(job => job.customerName.toLowerCase().includes(currentUser.toLowerCase()));
  } else if (userRole === 'supervisor') {
    // Supervisors see jobs in their assigned locations
    return jobs.filter(job => job.location);
  } else {
    // Default fallback
    return jobs;
  }
  */
};

// Apply all filters to jobs
export const applyFilters = (
  jobs: Job[], 
  searchTerm: string, 
  statusFilter: string, 
  locationFilter: string, 
  customerFilter: string, 
  shiftFilter: string
): Job[] => {
  let result = [...jobs];
  
  // Apply text search
  if (searchTerm) {
    result = result.filter(job => 
      job.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.inspector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Apply status filter
  if (statusFilter !== 'all') {
    result = result.filter(job => job.status === statusFilter);
  }
  
  // Apply location filter
  if (locationFilter !== 'all') {
    // First try to filter by location_id (preferred)
    if (result.some(job => job.location_id)) {
      result = result.filter(job => job.location_id === locationFilter);
    } else {
      // Fallback to string matching on location name
      result = result.filter(job => job.location === locationFilter);
    }
  }
  
  // Apply customer filter
  if (customerFilter !== 'all') {
    result = result.filter(job => job.customerName === customerFilter);
  }
  
  // Apply shift filter
  if (shiftFilter !== 'all') {
    result = result.filter(job => job.shift === shiftFilter);
  }
  
  return result;
};

// Extract unique values for filters
export const getUniqueFilterValues = (jobs: Job[]): {
  locations: string[];
  customers: string[];
  shifts: string[];
} => {
  return {
    locations: ['all', ...new Set(jobs.map(job => job.location))],
    customers: ['all', ...new Set(jobs.map(job => job.customerName))],
    shifts: ['all', ...new Set(jobs.map(job => job.shift))]
  };
};
