import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Job } from '@/types/aql';

// Extend the Job type to include our custom fields
interface ExtendedJob extends Job {
  clockInTime?: string;
  clockOutTime?: string;
  timeWorked?: number;
  scannedBarcodes?: Array<{barcode: string, timestamp: string}>;
  inspectionResults?: Array<{
    barcode: string;
    defectPhotos: string[];
    timestamp: string;
    inspector: string;
  }>;
  completedAt?: string;
}

export const useInspection = (selectedJob: Job | null = null) => {
  const { toast } = useToast();
  
  // Store the selected job ID in localStorage for reference
  useEffect(() => {
    if (selectedJob) {
      localStorage.setItem('inspection_selectedJobId', selectedJob.id);
    } else {
      localStorage.removeItem('inspection_selectedJobId');
    }
  }, [selectedJob]);
  
  // Check for active job clock-in on initialization
  useEffect(() => {
    const activeJobId = localStorage.getItem('activeJobId');
    const activeJobClockInTime = localStorage.getItem('activeJobClockInTime');
    
    if (activeJobId && activeJobClockInTime && selectedJob && activeJobId === selectedJob.id) {
      // If there's an active job that matches the selected job, restore the clock-in state
      setClockedIn(true);
      setStartTime(new Date(activeJobClockInTime));
      console.log(`Restored clock-in state for job ${activeJobId}`);
    }
  }, [selectedJob]);
  
  // Initialize state from localStorage if available
  const [clockedIn, setClockedIn] = useState(() => {
    const saved = localStorage.getItem('inspection_clockedIn');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [startTime, setStartTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('inspection_startTime');
    return saved ? new Date(JSON.parse(saved)) : null;
  });
  
  const [currentTab, setCurrentTab] = useState(() => {
    const saved = localStorage.getItem('inspection_currentTab');
    return saved ? JSON.parse(saved) : 'scan';
  });
  
  const [defectPhotos, setDefectPhotos] = useState<string[]>(() => {
    const saved = localStorage.getItem('inspection_defectPhotos');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [barcode, setBarcode] = useState(() => {
    const saved = localStorage.getItem('inspection_barcode');
    return saved ? JSON.parse(saved) : '';
  });

  // Add a state for tracking scanned barcodes
  const [scannedBarcodes, setScannedBarcodes] = useState<Array<{barcode: string, timestamp: string}>>(() => {
    const saved = localStorage.getItem('inspection_scannedBarcodes');
    return saved ? JSON.parse(saved) : [];
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('inspection_clockedIn', JSON.stringify(clockedIn));
  }, [clockedIn]);

  useEffect(() => {
    if (startTime) {
      localStorage.setItem('inspection_startTime', JSON.stringify(startTime.toISOString()));
    } else {
      localStorage.removeItem('inspection_startTime');
    }
  }, [startTime]);

  useEffect(() => {
    localStorage.setItem('inspection_currentTab', JSON.stringify(currentTab));
  }, [currentTab]);

  useEffect(() => {
    localStorage.setItem('inspection_defectPhotos', JSON.stringify(defectPhotos));
  }, [defectPhotos]);

  useEffect(() => {
    localStorage.setItem('inspection_barcode', JSON.stringify(barcode));
  }, [barcode]);

  useEffect(() => {
    localStorage.setItem('inspection_scannedBarcodes', JSON.stringify(scannedBarcodes));
  }, [scannedBarcodes]);

  // Function to update the job in localStorage
  const updateJobInLocalStorage = (updatedJob: ExtendedJob) => {
    try {
      const jobs = JSON.parse(localStorage.getItem("jobs") || "[]");
      const newJobs = jobs.map((job: Job) => job.id === updatedJob.id ? updatedJob : job);
      localStorage.setItem("jobs", JSON.stringify(newJobs));
      console.log(`Job ${updatedJob.id} updated in localStorage`);
    } catch (error) {
      console.error("Error updating job in localStorage:", error);
    }
  };

  const handleClockIn = () => {
    if (!selectedJob) {
      toast({
        title: "Error",
        description: "No job selected",
        variant: "destructive",
      });
      return;
    }

    // Check if daily clock-in is completed
    const dailyClockIn = localStorage.getItem("inspectorDailyClockIn");
    if (!dailyClockIn) {
      toast({
        title: "Daily Clock-In Required",
        description: "You must clock in for the day before clocking in to a job",
        variant: "destructive",
      });
      return;
    }

    setClockedIn(true);
    const now = new Date();
    setStartTime(now);
    
    // Update the job status in localStorage
    if (selectedJob) {
      const updatedJob: ExtendedJob = {
        ...selectedJob,
        status: 'In Progress', // Use the literal type from Job
        updatedAt: now.toISOString(),
        clockInTime: now.toISOString()
      };
      
      // Store the active job ID in localStorage for persistence
      localStorage.setItem('activeJobId', updatedJob.id);
      localStorage.setItem('activeJobClockInTime', now.toISOString());
      
      updateJobInLocalStorage(updatedJob);
    }
    
    toast({
      title: "Clocked In",
      description: `You are now clocked in for Job #${selectedJob.id} at ${now.toLocaleTimeString()}`,
    });
  };

  const handleClockOut = () => {
    if (!startTime || !selectedJob) return;
    
    const endTime = new Date();
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    setClockedIn(false);
    setStartTime(null);
    
    // Update the job in localStorage
    if (selectedJob) {
      const updatedJob: ExtendedJob = {
        ...selectedJob,
        clockOutTime: endTime.toISOString(),
        timeWorked: ((selectedJob as ExtendedJob).timeWorked || 0) + diffMins,
        updatedAt: endTime.toISOString()
      };
      
      // Remove active job data from localStorage
      localStorage.removeItem('activeJobId');
      localStorage.removeItem('activeJobClockInTime');
      
      updateJobInLocalStorage(updatedJob);
    }
    
    toast({
      title: "Clocked Out",
      description: `You worked for ${diffMins} minutes on Job #${selectedJob.id}`,
    });
  };

  const handleBarcodeScan = () => {
    if (!barcode) {
      toast({
        title: "Error",
        description: "Please enter a barcode",
        variant: "destructive",
      });
      return;
    }
    
    // Add the scanned barcode to the list
    const now = new Date().toISOString();
    const updatedBarcodes = [...scannedBarcodes, { barcode, timestamp: now }];
    setScannedBarcodes(updatedBarcodes);
    
    // Update the job in localStorage
    if (selectedJob) {
      const updatedJob: ExtendedJob = {
        ...selectedJob,
        scannedBarcodes: updatedBarcodes,
        updatedAt: now
      };
      updateJobInLocalStorage(updatedJob);
    }
    
    toast({
      title: "Barcode Scanned",
      description: `Part ${barcode} has been scanned for inspection`,
    });
    
    setCurrentTab('inspect');
  };

  const handleSubmitInspection = () => {
    if (!selectedJob) return;
    
    const now = new Date().toISOString();
    // Update the job with inspection results
    const extendedJob = selectedJob as ExtendedJob;
    const currentResults = extendedJob.inspectionResults || [];
    
    const updatedJob: ExtendedJob = {
      ...selectedJob,
      inspectionResults: [
        ...currentResults,
        {
          barcode,
          defectPhotos,
          timestamp: now,
          inspector: localStorage.getItem("currentUser") || "Inspector"
        }
      ],
      updatedAt: now
    };
    updateJobInLocalStorage(updatedJob);
    
    toast({
      title: "Inspection Submitted",
      description: "Part has been marked as defective and sent for review",
    });
    
    setCurrentTab('scan');
    setDefectPhotos([]);
    setBarcode('');
  };

  // Function to mark a job as completed
  const markJobAsCompleted = () => {
    if (!selectedJob) {
      toast({
        title: "Error",
        description: "No job selected",
        variant: "destructive",
      });
      return;
    }
    
    // Make sure the user is clocked out
    if (clockedIn) {
      handleClockOut();
    }
    
    const now = new Date().toISOString();
    const updatedJob: ExtendedJob = {
      ...selectedJob,
      status: 'Completed',
      updatedAt: now,
      completedAt: now
    };
    
    updateJobInLocalStorage(updatedJob);
    
    toast({
      title: "Job Completed",
      description: `Job #${selectedJob.id} has been marked as completed.`,
    });
    
    // Reset the inspection state
    resetInspectionState();
  };

  // Function to reset the inspection state when selecting a new job
  const resetInspectionState = () => {
    setClockedIn(false);
    setStartTime(null);
    setCurrentTab('scan');
    setDefectPhotos([]);
    setBarcode('');
    setScannedBarcodes([]);
  };

  return {
    clockedIn,
    startTime,
    currentTab,
    setCurrentTab,
    defectPhotos,
    setDefectPhotos,
    barcode,
    setBarcode,
    scannedBarcodes,
    setScannedBarcodes,
    handleClockIn,
    handleClockOut,
    handleBarcodeScan,
    handleSubmitInspection,
    resetInspectionState,
    markJobAsCompleted
  };
};
