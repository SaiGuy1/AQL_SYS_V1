
import { useState, useEffect } from 'react';
import { 
  fetchCustomerJobs, 
  fetchJobMetrics, 
  fetchDefectTrends, 
  fetchDefectPareto, 
  fetchJobTasks, 
  fetchPerformanceMetrics,
  calculateCurrentPPHV,
  Job, 
  JobMetrics, 
  DefectTrend, 
  DefectPareto, 
  Task,
  PerformanceMetric
} from '@/services/jobService';
import { toast } from 'sonner';

export interface LoadingState {
  jobs: boolean;
  metrics: boolean;
  defectTrends: boolean;
  paretoData: boolean;
  tasks: boolean;
  performance: boolean;
}

// Mock data for fallback when API fails
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

export const useJobData = (customerId: string) => {
  // Job and shift state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [shift, setShift] = useState<string>('');
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  
  // Data states
  const [jobMetrics, setJobMetrics] = useState<JobMetrics | null>(null);
  const [defectTrends, setDefectTrends] = useState<DefectTrend[]>([]);
  const [paretoData, setParetoData] = useState<DefectPareto[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [currentPPHV, setCurrentPPHV] = useState<number>(0);
  
  // UI states
  const [loading, setLoading] = useState<LoadingState>({
    jobs: true,
    metrics: false,
    defectTrends: false,
    paretoData: false,
    tasks: false,
    performance: false
  });
  const [timeFilter, setTimeFilter] = useState('This month');

  // Initialize local storage for mock data
  useEffect(() => {
    if (!localStorage.getItem('aql_jobs')) {
      localStorage.setItem('aql_jobs', JSON.stringify(mockJobs));
    }
  }, []);

  // Load customer jobs on initial render
  useEffect(() => {
    const loadCustomerJobs = async () => {
      try {
        setLoading(prev => ({ ...prev, jobs: true }));
        const customerJobs = await fetchCustomerJobs(customerId);
        
        // Check if we got valid job data
        if (Array.isArray(customerJobs) && customerJobs.length > 0) {
          setJobs(customerJobs);
          
          // Select the first job by default if available
          setSelectedJob(customerJobs[0]);
          setShift(customerJobs[0].shifts[0]);
        } else {
          // Fallback to mock data if API returned invalid data
          console.warn("API returned invalid job data, using mock data");
          setJobs(mockJobs);
          setSelectedJob(mockJobs[0]);
          setShift(mockJobs[0].shifts[0]);
        }
      } catch (error) {
        console.error("Error loading customer jobs:", error);
        toast.error("Failed to load jobs from API. Using sample data.");
        
        // Use mock data as fallback
        setJobs(mockJobs);
        setSelectedJob(mockJobs[0]);
        setShift(mockJobs[0].shifts[0]);
      } finally {
        setLoading(prev => ({ ...prev, jobs: false }));
      }
    };
    
    loadCustomerJobs();
  }, [customerId]);
  
  // Load job data whenever selected job changes
  useEffect(() => {
    if (!selectedJob) return;
    
    const loadJobData = async () => {
      const jobId = selectedJob.job_id;
      
      // Set all data loading states to true
      setLoading({
        jobs: false,
        metrics: true,
        defectTrends: true,
        paretoData: true,
        tasks: true,
        performance: true
      });
      
      try {
        // Fetch all job data in parallel
        const [metrics, trends, pareto, jobTasks, performance] = await Promise.all([
          fetchJobMetrics(jobId),
          fetchDefectTrends(jobId, timeFilter.toLowerCase().replace(' ', '_')),
          fetchDefectPareto(jobId),
          fetchJobTasks(jobId),
          fetchPerformanceMetrics(jobId)
        ]);
        
        setJobMetrics(metrics);
        setDefectTrends(trends);
        setParetoData(pareto);
        setTasks(jobTasks);
        setPerformanceMetrics(performance);
        setCurrentPPHV(calculateCurrentPPHV(performance));
      } catch (error) {
        console.error("Error loading job data:", error);
        toast.error("Some data couldn't be loaded. Showing available information.");
      } finally {
        // Set all data loading states to false
        setLoading({
          jobs: false,
          metrics: false,
          defectTrends: false,
          paretoData: false,
          tasks: false,
          performance: false
        });
      }
    };
    
    loadJobData();
  }, [selectedJob, timeFilter]);
  
  // Handle job selection change
  const handleJobChange = (jobId: string) => {
    const job = jobs.find(j => j.job_id === jobId);
    if (job) {
      setSelectedJob(job);
      setShift(job.shifts[0]);
    }
  };
  
  // Handle task checkbox toggle
  const handleCheckItem = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.task_id === taskId 
        ? { ...task, progress: task.progress === 100 ? 50 : 100, status: task.progress === 100 ? 'in_progress' : 'completed' } 
        : task
    ));
  };

  return {
    jobs,
    selectedJob,
    shift,
    jobSearchQuery,
    jobMetrics,
    defectTrends,
    paretoData,
    tasks,
    performanceMetrics,
    currentPPHV,
    loading,
    timeFilter,
    setJobSearchQuery,
    handleJobChange,
    setShift,
    handleCheckItem,
    setTimeFilter
  };
};
