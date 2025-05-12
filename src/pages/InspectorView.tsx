import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, 
  Barcode, 
  ClipboardList, 
  MessageCircle, 
  ShieldCheck, 
  Clock,
  TimerReset,
  CheckCircle,
  Menu,
  UserCircle,
  LogOut,
  ChevronDown,
  Clock10,
  Wifi,
  WifiOff
} from "lucide-react";
import ScanTab from '@/components/aql/inspection/ScanTab';
import InspectTab from '@/components/aql/inspection/InspectTab';
import ChatTab from '@/components/aql/inspection/ChatTab';
import { useInspection } from '@/components/aql/inspection/hooks/useInspection';
import CertificationDialog from '@/components/aql/inspection/CertificationDialog';
import { toast } from "sonner";
import { fetchJobs } from '@/services/aqlService';
import { Job, JobStatus } from '@/types/aql';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CertificationQuestion } from '@/services/aqlService';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/lib/supabase';

// Extended job interface with clock-in details
interface ExtendedJob extends Job {
  clockInTime?: string;
}

interface DailyClockInState {
  date: string;
  time: number;
}

const InspectorView: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<ExtendedJob | null>(null);
  const [availableJobs, setAvailableJobs] = useState<ExtendedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const currentUser = localStorage.getItem("currentUser") || "Inspector";
  const navigate = useNavigate();
  
  // Daily clock-in state
  const [dailyClockedIn, setDailyClockedIn] = useState<DailyClockInState | null>(null);
  
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

  // Setup daily clock-in tracking
  useEffect(() => {
    const checkDailyClockIn = () => {
      const storedClockIn = localStorage.getItem("inspectorDailyClockIn");
      if (storedClockIn) {
        const clockInData: DailyClockInState = JSON.parse(storedClockIn);
        const today = new Date().toISOString().split('T')[0];
        
        if (clockInData.date === today) {
          setDailyClockedIn(clockInData);
        } else {
          localStorage.removeItem("inspectorDailyClockIn");
          setDailyClockedIn(null);
        }
      } else {
        setDailyClockedIn(null);
      }
    };
    
    checkDailyClockIn();
    const intervalId = setInterval(checkDailyClockIn, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Load available jobs for the current inspector
  useEffect(() => {
    const loadJobs = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.warn("No authenticated user found, cannot load assigned jobs");
          setIsLoading(false);
          return;
        }
        
        const userId = user.id;
        console.log(`Loading jobs for inspector with ID: ${userId}`);
        
        // Fetch jobs where the current user's ID is in the inspector_ids array
        const { data: assignedJobs, error } = await supabase
          .from('jobs')
          .select('*')
          .contains('inspector_ids', [userId])
          .in('status', ['assigned', 'in-progress', 'scheduled', 'pending']);
            
        if (error) {
          console.error("Error fetching jobs from database:", error);
          throw error;
        }
        
        if (assignedJobs && assignedJobs.length > 0) {
          console.log(`Found ${assignedJobs.length} jobs assigned to inspector in database`);
          setAvailableJobs(assignedJobs as ExtendedJob[]);
        } else {
          setAvailableJobs([]);
        }
      } catch (error) {
        console.error("Error loading jobs:", error);
        toast.error("Failed to load assigned jobs");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadJobs();
  }, [refreshTrigger]);

  // Handle daily clock-in
  const handleDailyClockIn = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const clockInState: DailyClockInState = {
      date: today,
      time: now.getTime()
    };
    
    localStorage.setItem("inspectorDailyClockIn", JSON.stringify(clockInState));
    setDailyClockedIn(clockInState);
    toast.success("You've clocked in for today!");
  };

  // Handle daily clock-out
  const handleDailyClockOut = () => {
    if (clockedIn && selectedJob) {
      toast.error("Please clock out of your current job before clocking out for the day");
      return;
    }
    
    localStorage.removeItem("inspectorDailyClockIn");
    setDailyClockedIn(null);
    toast.success("You've clocked out for today!");
  };

  // Handle role switch to manager
  const handleSwitchToManager = () => {
    localStorage.setItem("aql_user_role", "manager");
    toast.success("Switching to Manager view...");
    navigate('/aql');
  };

  // Custom job completion handler
  const handleMarkJobAsCompleted = async () => {
    if (!selectedJob) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'completed' as JobStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedJob.id);

      if (error) throw error;

      markJobAsCompleted();
      setSelectedJob(null);
      setRefreshTrigger(prev => prev + 1);
      toast.success("Job marked as completed");
    } catch (error) {
      console.error("Error marking job as completed:", error);
      toast.error("Failed to mark job as completed");
    }
  };

  // Handle job selection
  const handleSelectJob = (job: ExtendedJob) => {
    setSelectedJob(job);
    setCurrentTab('scan');
  };

  // Handle back to job selection
  const handleBackToJobSelection = () => {
    setSelectedJob(null);
    resetInspectionState();
  };

  // Format time for display
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Check for certification status
  useEffect(() => {
    const lastCertification = localStorage.getItem('lastCertification');
    const certificationExpiry = localStorage.getItem('certificationExpiry');
    
    if (lastCertification && certificationExpiry) {
      const now = new Date().getTime();
      
      if (now < parseInt(certificationExpiry)) {
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
    
    // Check if daily clock-in is done first
    if (!dailyClockedIn) {
      toast.error("You must clock in for the day before clocking in to a job");
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
    
    localStorage.setItem('lastCertification', now.toString());
    localStorage.setItem('certificationExpiry', expiryTime.toString());
    
    setIsCertified(true);
    setShowCertification(false);
    
    handleClockIn();
    toast.success("You're now certified for this job!");
  };

  // Check for new job notifications
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const currentUserId = localStorage.getItem("userId") || "";
        if (!currentUserId) return;
        
        const { data: notifications, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUserId)
          .eq('read', false)
          .eq('type', 'assignment')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching notifications:", error);
          return;
        }
        
        if (notifications && notifications.length > 0) {
          // Show a toast notification for new assignments
          toast.info(`You have ${notifications.length} new job assignments`, {
            action: {
              label: "View",
              onClick: () => setRefreshTrigger(prev => prev + 1)
            }
          });
          
          // Mark notifications as read
          const notifIds = notifications.map(n => n.id);
          if (notifIds.length > 0) {
            const { error: updateError } = await supabase
              .from('notifications')
              .update({ read: true })
              .in('id', notifIds);
              
            if (updateError) {
              console.error("Error marking notifications as read:", updateError);
            }
          }
        }
      } catch (error) {
        console.error("Error checking notifications:", error);
      }
    };
    
    // Check notifications on load
    checkNotifications();
    
    // Set up interval to periodically check for new notifications
    const intervalId = setInterval(checkNotifications, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  // When no job is selected, show the job selection screen
  if (!selectedJob) {
    return (
      <div className="p-4 max-w-md mx-auto">
        {/* Daily Clock-In Status Bar */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 z-50">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">AQL Inspector</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              {dailyClockedIn ? (
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="flex items-center px-3 py-2 bg-green-100 text-green-800 text-base">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Clocked in at {formatTime(dailyClockedIn.time)}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{currentUser}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDailyClockOut} className="text-red-600">
                        <LogOut className="h-4 w-4 mr-2" />
                        Clock Out for Day
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSwitchToManager}>
                        <UserCircle className="h-4 w-4 mr-2" />
                        Switch to Manager View
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={handleDailyClockIn} 
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    <Clock className="h-5 w-5 mr-2" />
                    Clock In for the Day
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{currentUser}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSwitchToManager}>
                        <UserCircle className="h-4 w-4 mr-2" />
                        Switch to Manager View
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content with top margin to avoid the fixed header */}
        <div className="mt-20">
          <Card className="shadow-lg">
            <CardHeader className="p-5">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">
                  Assigned Jobs
                </CardTitle>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  Demo Mode
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-base">Loading assigned jobs...</p>
                </div>
              ) : availableJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
                  <h3 className="text-lg font-medium">No Jobs Assigned</h3>
                  <p className="text-base text-gray-500 mt-1">
                    You don't have any jobs assigned at the moment.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {availableJobs.map((job) => (
                    <li key={job.id}>
                      <div
                        onClick={() => dailyClockedIn && handleSelectJob(job)}
                        className={`border rounded-lg p-5 hover:bg-gray-50 transition-colors ${!dailyClockedIn ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex flex-col space-y-3">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-lg">
                              Contract #{job.id}
                            </h3>
                            <Badge
                              variant={
                                job.status === 'In Progress'
                                  ? 'default'
                                  : job.status === 'Assigned' || (job.status as string) === 'Scheduled'
                                  ? 'outline'
                                  : 'secondary'
                              }
                              className="text-base"
                            >
                              {job.status}
                            </Badge>
                          </div>
                          <p className="text-base text-gray-800">
                            {job.title}
                          </p>
                          <p className="text-base text-gray-600">
                            Customer: {job.customer.name}
                          </p>
                          {job.parts && job.parts.length > 0 && (
                            <p className="text-base text-gray-600">
                              Parts: {job.parts.map(p => p.partName).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              
              {!dailyClockedIn && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-yellow-800 text-base flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    You must clock in for the day before selecting a job.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // When a job is selected, show the inspection execution screen
  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Daily Clock-In Status Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">AQL Inspector</h1>
          </div>
          <div className="flex items-center space-x-2">
            {dailyClockedIn && (
              <Badge variant="default" className="flex items-center px-3 py-2 bg-green-100 text-green-800 text-base">
                <CheckCircle className="h-4 w-4 mr-2" />
                Clocked in at {formatTime(dailyClockedIn.time)}
              </Badge>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{currentUser}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!clockedIn && (
                  <DropdownMenuItem onClick={handleDailyClockOut} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Clock Out for Day
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSwitchToManager}>
                  <UserCircle className="h-4 w-4 mr-2" />
                  Switch to Manager View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content with top margin to avoid the fixed header */}
      <div className="mt-20 mb-20">
        <Card className="shadow-lg">
          <CardHeader className="p-5">
            <Button 
              variant="ghost" 
              size="lg" 
              onClick={handleBackToJobSelection}
              className="mb-3 -ml-3 text-base"
            >
              ← Back to job list
            </Button>
            <CardTitle className="text-xl">
              {selectedJob.title}
            </CardTitle>
            <p className="text-base mt-1">
              Contract #{selectedJob.id} • {selectedJob.customer.name}
            </p>
          </CardHeader>
          <CardContent className="p-4">
            <div className="mb-6">
              {clockedIn ? (
                <div className="flex flex-col space-y-3">
                  <div className="bg-green-100 text-green-800 px-4 py-3 rounded-md flex items-center justify-center text-base">
                    <CheckCircle className="h-5 w-5 mr-2" /> 
                    You are clocked in to this job (since {startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </div>
                  <Button 
                    variant="destructive" 
                    className="flex items-center justify-center py-6 text-base"
                    onClick={handleClockOut}
                  >
                    <TimerReset className="h-5 w-5 mr-2" /> Clock Out
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="default" 
                  className="w-full flex items-center justify-center py-6 text-base bg-blue-600 hover:bg-blue-700" 
                  onClick={handleCertifiedClockIn}
                >
                  <Clock className="h-5 w-5 mr-2" /> Clock In to This Job
                </Button>
              )}
            </div>

            <div className="flex space-x-2 mb-4">
              {!clockedIn && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => {
                    if (window.confirm("Are you sure you want to mark this job as completed? This action cannot be undone.")) {
                      handleMarkJobAsCompleted();
                    }
                  }}
                  className="flex-1 text-base py-6"
                >
                  Complete Job
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowCertification(true)}
                className={`${clockedIn ? 'flex-1' : ''} flex items-center justify-center text-base py-6`}
              >
                <ShieldCheck className="h-5 w-5 mr-2" />
                {isCertified ? "View Certification" : "Take Certification"}
              </Button>
            </div>

            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="scan" disabled={!clockedIn} className="text-base py-3">
                  <Barcode className="h-5 w-5 md:h-5 md:w-5 mr-2" /> Scan
                </TabsTrigger>
                <TabsTrigger value="inspect" disabled={!clockedIn} className="text-base py-3">
                  <ClipboardList className="h-5 w-5 md:h-5 md:w-5 mr-2" /> Inspect
                </TabsTrigger>
                <TabsTrigger value="chat" disabled={!clockedIn} className="text-base py-3">
                  <MessageCircle className="h-5 w-5 md:h-5 md:w-5 mr-2" /> Chat
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
      </div>

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

export default InspectorView; 