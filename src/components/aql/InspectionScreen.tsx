import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Barcode, ClipboardList, MessageCircle, ShieldCheck } from "lucide-react";
import { InspectionProps } from './inspection/types';
import ScanTab from './inspection/ScanTab';
import InspectTab from './inspection/InspectTab';
import ChatTab from './inspection/ChatTab';
import ClockControl from './inspection/ClockControl';
import { useInspection } from './inspection/hooks/useInspection';
import CertificationDialog from './inspection/CertificationDialog';
import { toast } from "sonner";
import { fetchJobs } from '@/services/aqlService';
import { Job } from '@/types/aql';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CertificationQuestion } from '@/services/aqlService';

// Extend Job type to include inspector field and certification questions
interface ExtendedJob extends Job {
  inspector?: string;
  parts?: Array<{partNumber: string, partName: string}>;
  certificationQuestions?: CertificationQuestion[];
}

const InspectionScreen: React.FC<InspectionProps> = () => {
  const [selectedJob, setSelectedJob] = useState<ExtendedJob | null>(null);
  const [availableJobs, setAvailableJobs] = useState<ExtendedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = localStorage.getItem("currentUser") || "Inspector";
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const {
    clockedIn,
    startTime,
    currentTab,
    setCurrentTab,
    defectPhotos,
    setDefectPhotos,
    barcode,
    setBarcode,
    handleClockIn,
    handleClockOut,
    handleBarcodeScan,
    handleSubmitInspection,
    scannedBarcodes,
    setScannedBarcodes,
    resetInspectionState,
    markJobAsCompleted
  } = useInspection(selectedJob);

  const [showCertification, setShowCertification] = useState(false);
  const [isCertified, setIsCertified] = useState(false);

  // Custom job completion handler that also refreshes the job list
  const handleMarkJobAsCompleted = () => {
    markJobAsCompleted();
    setSelectedJob(null);
    setRefreshTrigger(prev => prev + 1);
  };

  // Load available jobs for the current inspector
  useEffect(() => {
    const loadJobs = async () => {
      setIsLoading(true);
      try {
        const allJobs = await fetchJobs();
        // For demo purposes: show all jobs with appropriate statuses to the inspector 
        // regardless of actual inspector assignment
        const inspectorJobs = allJobs.filter(job => {
          // Include jobs that are in valid inspector status
          return (
            job.status === 'Assigned' || 
            job.status === 'In Progress' || 
            job.status === 'Pending' ||
            // 'Scheduled' status check is for compatibility
            (job.status as string) === 'Scheduled'
          );
        });
        
        setAvailableJobs(inspectorJobs);
        
        // For debugging
        console.log(`Loaded ${inspectorJobs.length} jobs for inspector view (demo mode)`);
      } catch (error) {
        console.error("Error loading jobs:", error);
        toast.error("Failed to load assigned jobs");
      } finally {
        setIsLoading(false);
      }
    };

    loadJobs();
  }, [currentUser, refreshTrigger]);

  // Check for certification status in local storage
  useEffect(() => {
    const lastCertification = localStorage.getItem('lastCertification');
    const certificationExpiry = localStorage.getItem('certificationExpiry');
    
    if (lastCertification && certificationExpiry) {
      const now = new Date().getTime();
      
      if (now < parseInt(certificationExpiry)) {
        // Certification is still valid
        setIsCertified(true);
      }
    }
  }, []);

  // Custom clock-in handler to check certification
  const handleCertifiedClockIn = () => {
    if (!selectedJob) {
      toast.error("Please select a job first");
      return;
    }
    
    if (!isCertified) {
      setShowCertification(true);
    } else {
      handleClockIn();
    }
  };

  // Handle certification completion
  const handleCertificationComplete = () => {
    // Set expiration for 3 days
    const now = new Date().getTime();
    const expiryTime = now + (3 * 24 * 60 * 60 * 1000); // 3 days in milliseconds
    
    // Store certification status
    localStorage.setItem('lastCertification', now.toString());
    localStorage.setItem('certificationExpiry', expiryTime.toString());
    
    setIsCertified(true);
    setShowCertification(false);
    
    // Proceed with clock in
    handleClockIn();
    toast.success("You're now certified for this job!");
  };

  // Handle selecting a job
  const handleSelectJob = (job: ExtendedJob) => {
    setSelectedJob(job);
    resetInspectionState();
  };

  // Return to job selection
  const handleBackToJobSelection = () => {
    if (clockedIn) {
      // Ask for confirmation before leaving a clocked-in job
      if (window.confirm("You are currently clocked in. Do you want to clock out and select a different job?")) {
        handleClockOut();
        setSelectedJob(null);
        setRefreshTrigger(prev => prev + 1);
      }
    } else {
      setSelectedJob(null);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  // When no job is selected, show the job selection screen
  if (!selectedJob) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Card>
          <CardHeader className="p-4 md:p-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base md:text-xl font-bold">
                Assigned Jobs
              </CardTitle>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                Demo Mode
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <p>Loading assigned jobs...</p>
              </div>
            ) : availableJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
                <h3 className="text-lg font-medium">No Jobs Assigned</h3>
                <p className="text-sm text-gray-500 mt-1">
                  You don't have any jobs assigned at the moment.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {availableJobs.map((job) => (
                  <li key={job.id}>
                    <div
                      onClick={() => handleSelectJob(job)}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">
                            Contract #{job.id}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {job.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Customer: {job.customer.name}
                          </p>
                        </div>
                        <Badge
                          variant={
                            job.status === 'In Progress'
                              ? 'default'
                              : job.status === 'Assigned' || (job.status as string) === 'Scheduled'
                              ? 'outline'
                              : 'secondary'
                          }
                        >
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // When a job is selected, show the inspection execution screen
  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToJobSelection}
              className="mb-2"
            >
              ← Back to job list
            </Button>
            <CardTitle className="text-base md:text-xl font-bold">
              {selectedJob.title}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Contract #{selectedJob.id} • {selectedJob.customer.name}
            </p>
          </div>
          <div className="flex flex-col space-y-2">
            <ClockControl 
              clockedIn={clockedIn} 
              startTime={startTime} 
              handleClockIn={handleCertifiedClockIn} 
              handleClockOut={handleClockOut} 
            />
            <div className="flex space-x-2">
              {!clockedIn && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (window.confirm("Are you sure you want to mark this job as completed? This action cannot be undone.")) {
                      handleMarkJobAsCompleted();
                    }
                  }}
                  className="mt-2"
                >
                  Complete Job
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCertification(true)}
                className="mt-2 flex items-center"
              >
                <ShieldCheck className="h-3 w-3 mr-1" />
                {isCertified ? "View Certification" : "Take Certification"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 md:p-6">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="scan" disabled={!clockedIn} className="text-xs md:text-sm">
                <Barcode className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> <span className="hidden xs:inline">Scan</span> Barcode
              </TabsTrigger>
              <TabsTrigger value="inspect" disabled={!clockedIn} className="text-xs md:text-sm">
                <ClipboardList className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> Inspect <span className="hidden xs:inline">Part</span>
              </TabsTrigger>
              <TabsTrigger value="chat" disabled={!clockedIn} className="text-xs md:text-sm">
                <MessageCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> Chat
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="scan">
              <ScanTab 
                barcode={barcode} 
                setBarcode={setBarcode} 
                handleBarcodeScan={handleBarcodeScan}
                clockedIn={clockedIn}
                scannedBarcodes={scannedBarcodes}
              />
            </TabsContent>
            
            <TabsContent value="inspect">
              <InspectTab 
                barcode={barcode} 
                defectPhotos={defectPhotos} 
                setDefectPhotos={setDefectPhotos} 
                handleSubmitInspection={handleSubmitInspection}
                setCurrentTab={setCurrentTab}
              />
            </TabsContent>
            
            <TabsContent value="chat">
              <ChatTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Certification Dialog */}
      <CertificationDialog
        isOpen={showCertification}
        onClose={() => setShowCertification(false)}
        onComplete={handleCertificationComplete}
        job={selectedJob}
      />
    </div>
  );
};

export default InspectionScreen;
