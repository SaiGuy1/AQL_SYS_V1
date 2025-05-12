import { Job, Inspector, Defect, Timesheet, Report, Customer } from '@/types/aql';
import { supabase } from '@/lib/supabase';

// Mock data for the prototype
const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Ford Motors',
    email: 'contact@ford.com',
    phone: '(313) 555-1234',
    company: 'Ford Motor Company'
  },
  {
    id: 'cust-2',
    name: 'Toyota USA',
    email: 'support@toyota.com',
    phone: '(310) 555-4321',
    company: 'Toyota Motor Corporation'
  },
  {
    id: 'cust-3',
    name: 'GM Parts Division',
    email: 'parts@gm.com',
    phone: '(248) 555-7890',
    company: 'General Motors'
  }
];

const mockInspectors: Inspector[] = [
  {
    id: 'insp-1',
    name: 'John Smith',
    email: 'john.smith@aql.com',
    role: 'inspector',
    certifications: ['Safety Level 1', 'Quality Control Basics'],
    isAvailable: true
  },
  {
    id: 'insp-2',
    name: 'Maria Rodriguez',
    email: 'maria.rodriguez@aql.com',
    role: 'supervisor',
    certifications: ['Safety Level 2', 'Quality Control Advanced', 'Supervisor Training'],
    isAvailable: true
  },
  {
    id: 'insp-3',
    name: 'Robert Johnson',
    email: 'robert.johnson@aql.com',
    role: 'inspector',
    certifications: ['Safety Level 1'],
    isAvailable: false
  }
];

const mockJobs: Job[] = [
  {
    id: 'job-1001',
    title: 'Ford F-150 Door Panel Inspection',
    job_number: '1001',
    location_id: 'loc-1',
    inspector_ids: ['insp-1'],
    supervisor_ids: ['insp-2'],
    status: 'in-progress',
    form_data: {
      customerName: 'Ford Motors',
      jobDetails: 'Inspect door panels for dents, scratches and paint defects.',
      defectGuidelines: 'Any dent larger than 1mm is considered a defect.'
    },
    customer: {
      name: 'Ford Motors',
      email: 'contact@ford.com',
      phone: '(313) 555-1234',
      company: 'Ford Motor Company'
    },
    location: {
      id: 'loc-1',
      name: 'Ford Dearborn Plant',
      latitude: 42.331427,
      longitude: -83.045754,
      address: '1 American Rd, Dearborn, MI 48126'
    },
    user_id: 'user-1',
    created_at: '2023-06-01T09:00:00Z',
    updated_at: '2023-06-01T10:30:00Z'
  },
  {
    id: 'job-1002',
    title: 'Toyota Camry Headlight Assembly QC',
    job_number: '1002',
    location_id: 'loc-2',
    inspector_ids: ['insp-3'],
    supervisor_ids: ['insp-2'],
    status: 'assigned',
    form_data: {
      customerName: 'Toyota USA',
      jobDetails: 'Check headlight assembly for proper sealing and electrical connections.',
      defectGuidelines: 'Any moisture inside headlight or loose connections are defects.'
    },
    customer: {
      name: 'Toyota USA',
      email: 'support@toyota.com',
      phone: '(310) 555-4321',
      company: 'Toyota Motor Corporation'
    },
    location: {
      id: 'loc-2',
      name: 'Toyota Georgetown Plant',
      latitude: 38.132340,
      longitude: -85.575741,
      address: '1001 Cherry Blossom Way, Georgetown, KY 40324'
    },
    user_id: 'user-1',
    created_at: '2023-06-02T08:00:00Z',
    updated_at: '2023-06-02T08:30:00Z'
  },
  {
    id: 'job-1003',
    title: 'GM Brake Caliper Inspection',
    job_number: '1003',
    location_id: 'loc-3',
    inspector_ids: ['insp-1'],
    supervisor_ids: ['insp-2'],
    status: 'pending',
    form_data: {
      customerName: 'GM Parts Division',
      jobDetails: 'Inspect brake calipers for casting defects and proper assembly.',
      defectGuidelines: 'Any cracks, porosity or improper assembly must be reported.'
    },
    customer: {
      name: 'GM Parts Division',
      email: 'parts@gm.com',
      phone: '(248) 555-7890',
      company: 'General Motors'
    },
    location: {
      id: 'loc-3',
      name: 'GM Pontiac Plant',
      latitude: 42.549369,
      longitude: -83.210335,
      address: '2000 Centerpoint Pkwy, Pontiac, MI 48341'
    },
    user_id: 'user-1',
    created_at: '2023-06-03T09:30:00Z',
    updated_at: '2023-06-03T09:30:00Z'
  }
];

const mockDefects: Defect[] = [];
const mockTimesheets: Timesheet[] = [];
const mockReports: Report[] = [];

// Simulated network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API functions
export const fetchJobs = async (): Promise<Job[]> => {
  // Simulate API delay with consistent latency
  await new Promise((res) => setTimeout(res, 500));
  
  try {
    // Get all jobs from localStorage without any filtering
    const jobsData = localStorage.getItem("jobs");
    
    if (!jobsData) {
      // If no jobs found in localStorage, return mockJobs as demo data
      console.log("No jobs found in localStorage, returning mock data");
      return [...mockJobs];
    }
    
    const jobs = JSON.parse(jobsData);
    
    // Validate that we have an array of jobs
    if (!Array.isArray(jobs)) {
      console.warn("Jobs data is not an array, using mock data instead");
      return [...mockJobs];
    }
    
    // Return all jobs without any filtering
    return jobs;
  } catch (error) {
    console.error("Error reading jobs from localStorage:", error);
    // Fall back to mock data if localStorage access fails
  return [...mockJobs];
  }
};

export const fetchJob = async (id: string): Promise<Job | null> => {
  await delay(500);
  const job = mockJobs.find(job => job.id === id);
  return job || null;
};

/**
 * Sanitizes a job object for storage in Supabase by:
 * 1. Converting nested objects to JSON strings where necessary
 * 2. Removing circular references and properties that Supabase can't handle
 * 3. Ensuring date fields are in ISO string format
 */
const sanitizeJobForStorage = (jobData: any): any => {
  // Clone the job to avoid modifying the original
  const sanitized = { ...jobData };
  
  // ---- HANDLE COMPLEX OBJECTS AND ARRAYS ----
  
  // Convert complex nested objects to strings
  if (sanitized.customer && typeof sanitized.customer === 'object') {
    // For PostgreSQL JSONB column, direct assignment works best
    sanitized.customer_data = sanitized.customer;
    // Keep customer.name directly accessible for filtering
    sanitized.customer_name = sanitized.customer.name;
  }

  // Handle parts array
  if (Array.isArray(sanitized.parts)) {
    // For PostgreSQL JSONB column, direct assignment works best
    sanitized.parts_data = sanitized.parts;
    // Remove original parts field
    delete sanitized.parts;
  }
  
  // Handle safety requirements array
  if (Array.isArray(sanitized.safetyRequirements)) {
    // Ensure the array is properly formatted for JSONB
    const cleanSafetyRequirements = sanitized.safetyRequirements.map(item => {
      // If item is an object, clean it, otherwise use as is
      if (typeof item === 'object' && item !== null) {
        const { _content, ...cleanItem } = item;
        return cleanItem;
      }
      return item;
    });
    
    // For PostgreSQL JSONB column, we're using JSON.stringify properly
    // The database is expecting valid JSON, not a string representation of JSON
    sanitized.safety_requirements = cleanSafetyRequirements;
    
    // Remove the original property
    delete sanitized.safetyRequirements;
    
    console.log('Processed safety requirements for database storage:', 
      typeof sanitized.safety_requirements, 
      Array.isArray(sanitized.safety_requirements) ? 'array' : 'not array');
  }
  
  // Handle attachments array
  if (Array.isArray(sanitized.attachments)) {
    // Filter out any problematic properties from attachments, like large content fields
    const cleanAttachments = sanitized.attachments.map(att => {
      const { _content, ...cleanAtt } = att;
      return cleanAtt;
    });
    // For PostgreSQL JSONB column, direct assignment works best
    sanitized.attachments_data = cleanAttachments;
    // Remove the original attachments property to avoid trying to save to a non-existent column
    delete sanitized.attachments;
  }
  
  // Handle certification questions
  if (Array.isArray(sanitized.certificationQuestions)) {
    // For PostgreSQL JSONB column, direct assignment works best
    sanitized.certification_questions = sanitized.certificationQuestions;
    // Remove the original certificationQuestions property to avoid trying to save to a non-existent column
    delete sanitized.certificationQuestions;
  }
  
  // Handle location object
  if (sanitized.location && typeof sanitized.location === 'object') {
    // For PostgreSQL JSONB column, direct assignment works best
    sanitized.location_data = sanitized.location;
    // Remove the original location property
    delete sanitized.location;
  }
  
  // ---- HANDLE TEXT FIELDS WITH CAMELCASE ----
  
  // Handle defect guidelines
  if (sanitized.defectGuidelines) {
    sanitized.defect_guidelines = sanitized.defectGuidelines;
    delete sanitized.defectGuidelines;
  }
  
  // Handle instructions (copy it to ensure it's preserved)
  if (sanitized.instructions) {
    sanitized.instructions = sanitized.instructions;
  }
  
  // ---- HANDLE NUMERIC FIELDS ----
  
  // Handle estimated hours
  if ('estimatedHours' in sanitized) {
    sanitized.estimated_hours = Number(sanitized.estimatedHours || 0);
    delete sanitized.estimatedHours;
  }
  
  // ---- HANDLE DATE FIELDS ----
  
  // Ensure dates are in ISO format
  if (sanitized.created_at && !(typeof sanitized.created_at === 'string')) {
    sanitized.created_at = new Date(sanitized.created_at).toISOString();
  }
  
  if (sanitized.updated_at && !(typeof sanitized.updated_at === 'string')) {
    sanitized.updated_at = new Date(sanitized.updated_at).toISOString();
  }
  
  // Convert JS-style camelCase dates to DB-style snake_case
  if (sanitized.createdAt) {
    sanitized.created_at = sanitized.createdAt;
    delete sanitized.createdAt;
  }
  
  if (sanitized.updatedAt) {
    sanitized.updated_at = sanitized.updatedAt;
    delete sanitized.updatedAt;
  }
  
  // ---- SET DATA TYPES FOR CRITICAL FIELDS ----
  
  sanitized.title = String(sanitized.title || '');
  sanitized.status = String(sanitized.status || 'pending').toLowerCase();
  sanitized.job_number = String(sanitized.job_number || '');
  
  // Handle priority field to accommodate enum or text type
  if (sanitized.priority) {
    // Make sure priority is properly capitalized for enum compatibility
    const priorityMap = {
      'high': 'High',
      'medium': 'Medium', 
      'low': 'Low',
      'urgent': 'Urgent',
      'critical': 'Critical'
    };
    
    const normalizedPriority = sanitized.priority.toLowerCase();
    if (priorityMap[normalizedPriority]) {
      sanitized.priority = priorityMap[normalizedPriority];
    } else {
      // Default to Medium if not a recognized priority
      sanitized.priority = 'Medium';
    }
    
    console.log(`Normalized priority: "${sanitized.priority}"`);
  } else {
    // Default priority if not provided
    sanitized.priority = 'Medium';
  }
  
  if (sanitized.location_number) {
    sanitized.location_number = Number(sanitized.location_number);
  }
  
  if (sanitized.revision) {
    sanitized.revision = Number(sanitized.revision || 0);
  }
  
  // Convert any remaining camelCase fields to snake_case
  const camelToSnakeMap = {
    isBatchJob: 'is_batch_job',
    jobNumber: 'job_number',
    locationNumber: 'location_number',
    locationId: 'location_id',
    inspectorId: 'inspector_id'
  };
  
  // Apply the camelCase to snake_case conversion
  Object.entries(camelToSnakeMap).forEach(([camelCase, snakeCase]) => {
    if (camelCase in sanitized) {
      sanitized[snakeCase] = sanitized[camelCase];
      delete sanitized[camelCase];
    }
  });
  
  // Remove any other properties that might cause issues with Supabase
  // These include functions, class instances, etc.
  const keysToRemove = ['form_data'];
  keysToRemove.forEach(key => {
    if (key in sanitized) {
      delete sanitized[key];
    }
  });
  
  return sanitized;
};

export const createJob = async (job: Omit<Job, 'created_at' | 'updated_at'> & { id?: string }): Promise<Job> => {
  console.log('Creating job with data:', JSON.stringify(job, null, 2));

  try {
    // Basic validation
    if (!job.title) {
      throw new Error('Job title is required');
    }

    // Validate customer data
    if (!job.customer?.name) {
      console.error('Customer name is missing');
      throw new Error('Customer name is required');
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting user:', userError);
      throw new Error('Authentication error: ' + userError.message);
    }
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate location_id
    if (!job.location_id) {
      console.error('Location ID is missing');
      throw new Error('Location ID is required');
    }

    // Check if location exists
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id, name')
      .eq('id', job.location_id)
      .single();

    if (locationError) {
      console.error('Error validating location:', locationError);
      throw new Error('Error validating location: ' + locationError.message);
    }
    if (!location) {
      throw new Error('Invalid location ID');
    }

    // Validate inspector_ids only if they are provided
    if (job.inspector_ids && job.inspector_ids.length > 0) {
      // Validate that inspectors are assigned to the location
      const { data: validInspectors, error: inspectorError } = await supabase
        .from('inspector_locations')
        .select('inspector_id')
        .eq('location_id', job.location_id)
        .in('inspector_id', job.inspector_ids);

      if (inspectorError) {
        console.error('Error validating inspectors:', inspectorError);
        throw new Error('Error validating inspector assignments: ' + inspectorError.message);
      }

      const validInspectorIds = validInspectors?.map(i => i.inspector_id) || [];
      const invalidInspectors = job.inspector_ids.filter(id => !validInspectorIds.includes(id));

      if (invalidInspectors.length > 0) {
        console.error('Invalid inspectors:', invalidInspectors);
        throw new Error(`Inspectors ${invalidInspectors.join(', ')} are not assigned to this location`);
      }
    }

    // Prepare job data
    const jobData = {
      ...job,
      user_id: user.id,
      status: job.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      form_data: typeof job.form_data === 'string' ? JSON.parse(job.form_data) : job.form_data,
      customer: {
        name: job.customer.name,
        email: job.customer.email,
        phone: job.customer.phone,
        address: job.customer.address,
        company: job.customer.company
      },
      location: {
        id: location.id,
        name: location.name,
        ...(typeof job.location === 'string' ? JSON.parse(job.location) : job.location)
      }
    };

    console.log('Prepared job data:', JSON.stringify(jobData, null, 2));

    if (job.id) {
      // Update existing job
      console.log('Updating existing job:', job.id);
      const { data: updatedJob, error: updateError } = await supabase
        .from('jobs')
        .update(jobData)
        .eq('id', job.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating job:', updateError);
        throw new Error('Failed to update job: ' + updateError.message);
      }

      console.log('Job updated successfully:', updatedJob);
      return updatedJob;
    } else {
      // Create new job
      console.log('Creating new job');
      const { data: newJob, error: insertError } = await supabase
        .from('jobs')
        .insert(jobData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating job:', insertError);
        throw new Error('Failed to create job: ' + insertError.message);
      }

      console.log('Job created successfully:', newJob);
      return newJob;
    }
  } catch (error) {
    console.error('Error in createJob:', error);
    throw error;
  }
};

export const updateJob = async (id: string, updates: Partial<Job>): Promise<Job> => {
  await delay(800);
  
  try {
    // First update the mock data for API simulation
    const jobIndex = mockJobs.findIndex(job => job.id === id);
    if (jobIndex === -1) throw new Error('Job not found in mock data');
  
    mockJobs[jobIndex] = {
      ...mockJobs[jobIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    // Then ensure the update is also applied to localStorage
    const jobsData = localStorage.getItem("jobs");
    if (jobsData) {
      const jobs = JSON.parse(jobsData);
      if (Array.isArray(jobs)) {
        const localJobIndex = jobs.findIndex(job => job.id === id);
        
        if (localJobIndex !== -1) {
          // Update the job in localStorage
          jobs[localJobIndex] = {
            ...jobs[localJobIndex],
            ...updates,
            updated_at: new Date().toISOString()
          };
          
          // Save changes back to localStorage
          localStorage.setItem("jobs", JSON.stringify(jobs));
          console.log(`Job ${id} updated in localStorage`);
        }
      }
    }
  
    return mockJobs[jobIndex];
  } catch (error) {
    console.error("Error updating job:", error);
    throw error;
  }
};

export const assignJob = async (jobId: string, inspectorId: string): Promise<Job> => {
  await delay(600);
  return updateJob(jobId, { 
    inspector_ids: [inspectorId],
    status: 'assigned'
  });
};

// Function to assign an inspector to a job by ID, ensuring consistent inspector information
export const assignInspector = async (jobId: string, inspectorId: string): Promise<boolean> => {
  try {
    console.log(`Assigning inspector with ID "${inspectorId}" to job ${jobId}`);
    
    // First get the job data to check location and current inspectors
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('location_id, title, job_number, inspector_ids')
      .eq('id', jobId)
      .single();
    
    if (jobError) {
      console.error(`Error fetching job ${jobId}:`, jobError);
      throw jobError;
    }

    // Get inspector details
    const { data: inspector, error: inspectorError } = await supabase
      .from('profiles')
      .select('name, location_id, isAvailable')
      .eq('id', inspectorId)
      .single();

    if (inspectorError) {
      console.error(`Error fetching inspector ${inspectorId}:`, inspectorError);
      throw inspectorError;
    }

    // Validate inspector availability
    if (!inspector.isAvailable) {
      console.error(`Inspector ${inspector.name} is not available`);
      throw new Error('Inspector is not available for assignment');
    }

    // Check location match
    if (jobData.location_id && inspector.location_id && jobData.location_id !== inspector.location_id) {
      console.warn(`Location mismatch: Job (${jobData.location_id}) and Inspector (${inspector.location_id})`);
      throw new Error('Inspector is assigned to a different location');
    }

    // Prepare inspector_ids array
    const currentInspectorIds = jobData.inspector_ids || [];
    const newInspectorIds = [...new Set([...currentInspectorIds, inspectorId])];

    // Update job with new inspector
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        inspector_ids: newInspectorIds,
        inspector_id: inspectorId, // Keep for backward compatibility
        inspector: inspector.name, // Keep for backward compatibility
        assignedTo: inspectorId, // Keep for backward compatibility
        status: 'Assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      console.error(`Error updating job ${jobId}:`, updateError);
      throw updateError;
    }

    // Create notification
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: inspectorId,
        message: `You have been assigned to job: ${jobData.title || `#${jobData.job_number || jobId}`}`,
        type: 'assignment',
        job_id: jobId,
        read: false,
        created_at: new Date().toISOString()
      });

    if (notifError) {
      console.warn('Failed to create notification:', notifError);
    }

    return true;
  } catch (error) {
    console.error("Error assigning inspector:", error);
    return false;
  }
};

export const fetchInspectors = async (): Promise<Inspector[]> => {
  await delay(800);
  return [...mockInspectors];
};

export const fetchCustomers = async (): Promise<Customer[]> => {
  await delay(800);
  return [...mockCustomers];
};

export const reportDefect = async (defect: Omit<Defect, 'id' | 'reported_at' | 'status' | 'comments'>): Promise<Defect> => {
  await delay(1000);
  const newDefect: Defect = {
    ...defect,
    id: `def-${mockDefects.length + 1}`,
    reported_at: new Date().toISOString(),
    status: 'open',
    comments: []
  };
  mockDefects.push(newDefect);
  return newDefect;
};

export const fetchDefects = async (job_id?: string): Promise<Defect[]> => {
  await delay(800);
  if (job_id) {
    return mockDefects.filter(defect => defect.job_id === job_id);
  }
  return [...mockDefects];
};

export const clockIn = async (inspector_id: string, job_id: string): Promise<Timesheet> => {
  await delay(600);
  const newTimesheet: Timesheet = {
    id: `ts-${mockTimesheets.length + 1}`,
    inspector_id,
    inspector_name: mockInspectors.find(i => i.id === inspector_id)?.name || 'Unknown',
    job_id,
    job_title: mockJobs.find(j => j.id === job_id)?.title || 'Unknown Job',
    clock_in: new Date().toISOString(),
    is_billable: true,
    is_approved: false,
    overtime: 0
  };
  mockTimesheets.push(newTimesheet);
  return newTimesheet;
};

export const clockOut = async (timesheetId: string): Promise<Timesheet> => {
  await delay(600);
  const index = mockTimesheets.findIndex(ts => ts.id === timesheetId);
  if (index === -1) throw new Error('Timesheet not found');
  
  const clock_in = new Date(mockTimesheets[index].clock_in);
  const clock_out = new Date();
  const total_hours = (clock_out.getTime() - clock_in.getTime()) / (1000 * 60 * 60);
  
  mockTimesheets[index] = {
    ...mockTimesheets[index],
    clock_out: clock_out.toISOString(),
    total_hours
  };
  
  return mockTimesheets[index];
};

export const fetchTimesheets = async (inspector_id?: string): Promise<Timesheet[]> => {
  await delay(800);
  if (inspector_id) {
    return mockTimesheets.filter(ts => ts.inspector_id === inspector_id);
  }
  return [...mockTimesheets];
};

export const generateReport = async (type: 'defect' | 'performance' | 'billing' | 'custom', date_range: { start: string; end: string }, customer_id?: string): Promise<Report> => {
  console.log(`Generating ${type} report for date range:`, date_range);
  
  try {
    const report: Report = {
      id: `report-${Date.now()}`,
      name: `${type} Report - ${new Date().toLocaleDateString()}`,
      type,
      date_range,
      customer_id,
      format: 'PDF',
      created_at: new Date().toISOString(),
      created_by: 'system',
      data: {}
    };
    
    // Store the report
    localStorage.setItem(`report-${report.id}`, JSON.stringify(report));
    return report;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

export const fetchReports = async (): Promise<Report[]> => {
  await delay(800);
  return [...mockReports];
};

// Function to preload demo jobs - can be called from console before demo
// e.g. window.preloadDemoJobs() in browser console
export const preloadDemoJobs = (): void => {
  // Only preload if no jobs exist yet
  const existingJobs = localStorage.getItem("jobs");
  if (existingJobs && existingJobs !== "[]") {
    console.log("Demo jobs already exist, skipping preload");
    return;
  }
  
  // Create a set of jobs that are visible to all roles
  const demoJobs = mockJobs.map(job => {
    // Get inspector name from inspector_ids if it exists
    const inspectorObj = job.inspector_ids?.[0] ? 
      mockInspectors.find(i => i.id === job.inspector_ids[0]) : null;
    const inspectorName = inspectorObj ? inspectorObj.name : 'Luis Garcia';
    
    return {
      ...job,
      // Ensure jobs have the necessary fields for visibility across roles
      // For the inspector role - make sure jobs have inspector_ids
      inspector_ids: job.inspector_ids || ['insp-1'],
      // For customer role - ensure customer info is populated
      customer: job.customer || mockCustomers[0],
      // For supervisor role - ensure location is defined
      location: job.location || {
        id: 'loc-1',
        name: 'Default Location',
        latitude: 42.331427,
        longitude: -83.045754,
        address: 'Detroit, MI 48126'
      },
      // Ensure the status is set to make it appear in various filters
      status: job.status || 'pending'
    };
  });
  
  // Use our enhanced jobs as the initial demo data
  localStorage.setItem("jobs", JSON.stringify(demoJobs));
  console.log(`Preloaded ${demoJobs.length} demo jobs that are visible to all roles`);
};

// Function to update existing jobs to be visible across all roles
export const makeAllJobsVisibleAcrossRoles = (): void => {
  try {
    // Get existing jobs from localStorage
    const existingJobsStr = localStorage.getItem("jobs");
    if (!existingJobsStr) {
      console.log("No jobs found in localStorage");
      return;
    }
    
    const existingJobs = JSON.parse(existingJobsStr);
    if (!Array.isArray(existingJobs) || existingJobs.length === 0) {
      console.log("No jobs to update in localStorage");
      return;
    }
    
    // Update each job to ensure it has all the necessary fields for visibility
    const updatedJobs = existingJobs.map(job => {
      // First determine what type of job interface we're dealing with
      // (component/aql/jobs/types.ts Job interface vs types/aql.d.ts Job interface)
      const isComponentJob = 'customerName' in job;
      
      if (isComponentJob) {
        // Handle job from component/aql/jobs/types.ts
        return {
          ...job,
          // Fields for inspector visibility
          inspector: job.inspector || 'Luis Garcia',
          // Fields for customer visibility
          customerName: job.customerName || 'Burgula OES',
          // Fields for supervisor visibility
          location: job.location || 'Detroit, MI',
          // Ensure status is set
          status: job.status || 'pending'
        };
      } else {
        // Handle job from types/aql.d.ts
        return {
          ...job,
          // Fields for inspector visibility
          assignedTo: job.assignedTo || 'insp-1',
          // Fields for customer visibility
          customer: job.customer || mockCustomers[0],
          // Fields for supervisor visibility
          location: job.location || {
            latitude: 42.331427,
            longitude: -83.045754,
            address: 'Detroit, MI 48126'
          },
          // Ensure status is set
          status: job.status || 'Pending'
        };
      }
    });
    
    // Save the updated jobs back to localStorage
    localStorage.setItem("jobs", JSON.stringify(updatedJobs));
    console.log(`Updated ${updatedJobs.length} jobs to be visible across all roles`);
  } catch (error) {
    console.error("Error updating jobs:", error);
  }
};

// Function to diagnose and repair inspector assignments
export const repairInspectorAssignments = (): void => {
  const jobs = JSON.parse(localStorage.getItem("jobs") || "[]");
  const updatedJobs = jobs.map((job: any) => {
    console.log(`Checking job ${job.id}:`, job);
    
    // Initialize inspector_ids array if it doesn't exist
    if (!job.inspector_ids) {
      job.inspector_ids = [];
    }
    
    // If job has inspector but no assignedTo, add assignedTo
    if (job.inspector && !job.assignedTo) {
      console.log(`Repair: Adding assignedTo=${job.inspector} to job ${job.id}`);
      job.assignedTo = job.inspector;
    }
    
    // If job has assignedTo but no inspector, add inspector name
    if (job.assignedTo && !job.inspector) {
      const inspectorObj = mockInspectors.find(i => i.id === job.assignedTo);
      const inspectorName = inspectorObj ? inspectorObj.name : 'Unknown Inspector';
      console.log(`Repair: Adding inspector=${inspectorName} to job ${job.id}`);
      job.inspector = inspectorName;
    }
    
    // If job has assignedTo but not in inspector_ids, add it
    if (job.assignedTo && !job.inspector_ids.includes(job.assignedTo)) {
      console.log(`Repair: Adding assignedTo=${job.assignedTo} to inspector_ids for job ${job.id}`);
      job.inspector_ids.push(job.assignedTo);
    }
    
    // If job has inspector_id but not in inspector_ids, add it
    if (job.inspector_id && !job.inspector_ids.includes(job.inspector_id)) {
      console.log(`Repair: Adding inspector_id=${job.inspector_id} to inspector_ids for job ${job.id}`);
      job.inspector_ids.push(job.inspector_id);
    }
    
    return job;
  });
  
  localStorage.setItem("jobs", JSON.stringify(updatedJobs));
  console.log(`Repaired inspector assignments for ${updatedJobs.length} jobs`);
};

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).preloadDemoJobs = preloadDemoJobs;
  (window as any).makeAllJobsVisibleAcrossRoles = makeAllJobsVisibleAcrossRoles;
  (window as any).repairInspectorAssignments = repairInspectorAssignments;
}

// Define interface for certification questions
export interface CertificationQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

// Function to generate certification questions using OpenAI
export const generateCertificationQuestions = async (jobData: any): Promise<CertificationQuestion[]> => {
  console.log("Generating certification questions for job:", jobData);
  
  // Check if API key is configured
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file and restart the dev server.");
    throw new Error("API key not configured. Please set VITE_OPENAI_API_KEY in .env and restart the server.");
  }
  
  try {
    // Extract relevant information from job data
    const partName = jobData.parts?.[0]?.partName || jobData.title?.split(' ')[0] || 'Component';
    const jobDescription = jobData.jobDetails || jobData.description || jobData.instructions || 'Quality inspection';
    const safetyRequirements = Array.isArray(jobData.safetyRequirements) 
      ? jobData.safetyRequirements.join(', ') 
      : 'Standard safety protocols';
      
    // Prepare the prompt for OpenAI
    const prompt = `Generate 3-4 multiple-choice certification questions about this quality inspection job:
    
Part Name: ${partName}
Job Description: ${jobDescription}
Safety Requirements: ${safetyRequirements}

The questions should test an inspector's knowledge on:
1. Proper inspection techniques for this specific part
2. Safety protocols relevant to this job
3. Quality standards and defect identification
4. Procedural knowledge about this type of inspection

Each question should have 4 options with exactly one correct answer.
Return ONLY a JSON array with objects in this format:
{
  "question": "The full question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswerIndex": 0 // Index of the correct answer (0-3)
}`;

    // Log the data being sent to OpenAI for debugging
    console.log('Sending prompt to OpenAI:', prompt);
    
    // Call the OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a manufacturing certification expert who creates assessment questions for quality inspectors. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API call failed with status: ${response.status}`, errorText);
      throw new Error(`API call failed with status: ${response.status}`);
    }
    
    // Parse the response as JSON
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (jsonError) {
      console.error("Failed to parse response as JSON:", responseText);
      throw new Error("Failed to parse OpenAI response as JSON");
    }
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Unexpected response format from OpenAI API");
    }
    
    // Extract the content from the response
    const content = data.choices[0].message.content;
    
    // Parse the questions from the content
    try {
      // Find the JSON array in the response (in case there's any extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      
      const questions = JSON.parse(jsonString) as CertificationQuestion[];
      
      // Validate the structure of the questions
      const validatedQuestions = questions.map(q => {
        // Ensure options array has exactly 4 items
        if (!q.options || q.options.length !== 4) {
          q.options = q.options || [];
          while (q.options.length < 4) {
            q.options.push(`Option ${q.options.length + 1}`);
          }
        }
        
        // Ensure correctAnswerIndex is a valid index
        if (typeof q.correctAnswerIndex !== 'number' || q.correctAnswerIndex < 0 || q.correctAnswerIndex > 3) {
          q.correctAnswerIndex = 0;
        }
        
        return q;
      });
      
      console.log("Generated certification questions:", validatedQuestions);
      return validatedQuestions;
    } catch (parseError) {
      console.error("Error parsing questions from OpenAI response:", parseError, content);
      throw new Error("Could not parse certification questions from OpenAI response");
    }
  } catch (error) {
    console.error("Error generating certification questions:", error);
    
    // Return fallback questions if OpenAI call fails
    return generateFallbackQuestions(jobData);
  }
};

// Generate fallback questions if the OpenAI call fails
const generateFallbackQuestions = (jobData: any): CertificationQuestion[] => {
  const partName = jobData.parts?.[0]?.partName || jobData.title?.split(' ')[0] || 'Component';
  
  return [
    {
      question: `What is the most important safety equipment to wear when inspecting ${partName}?`,
      options: ['Sunglasses', 'Safety glasses', 'Headphones', 'Wristwatch'],
      correctAnswerIndex: 1
    },
    {
      question: 'What should you do if you identify a critical defect?',
      options: [
        'Ignore it and continue working',
        'Fix it yourself immediately',
        'Document it and report it to a supervisor',
        'Discard the part without documentation'
      ],
      correctAnswerIndex: 2
    },
    {
      question: 'Which of the following is a best practice for quality inspection?',
      options: [
        'Rush through inspections to maximize productivity',
        'Work in a dimly lit area to better see contrasts',
        'Use consistent methodology and lighting for all inspections',
        'Rely on memory instead of documentation for quality standards'
      ],
      correctAnswerIndex: 2
    }
  ];
};

/**
 * Update a job revision when the job is edited
 * @param jobId - The ID of the job to update
 * @param jobData - Updated job data
 * @returns The updated job with incremented revision number
 */
export const updateJobWithRevision = async (jobId: string, jobData: any) => {
  try {
    // First, get the current job to access its revision number
    const { data: currentJob, error: getError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (getError) {
      console.error('Error fetching job for revision update:', getError);
      throw getError;
    }
    
    // Increment the revision number
    const revision = (currentJob.revision || 1) + 1;
    
    // Generate the updated job number with new revision
    const location_number = currentJob.location_number;
    const sequenceMatch = currentJob.job_number?.match(/^(\d+)-(\d+)-\d+$/);
    const sequence = sequenceMatch ? sequenceMatch[2] : "1";
    
    // Format: {location_number}-{sequence}-{revision}
    const updatedJobNumber = `${location_number}-${sequence}-${revision}`;
    
    console.log(`Updating job number to ${updatedJobNumber}`);
    
    // Update job with new revision
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        job_number: updatedJobNumber,
        revision: revision,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('Error updating job:', updateError);
      throw updateError;
    }

    return {
      ...currentJob,
      job_number: updatedJobNumber,
      revision: revision,
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error updating job:', error);
    throw error;
  }
};
