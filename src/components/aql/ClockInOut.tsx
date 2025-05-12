import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, PlayCircle, StopCircle, Info, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ClockInOutProps {
  jobId: string;
  jobTitle: string;
}

interface ActiveTimesheet {
  id: string;
  job_id: string;
  inspector_id: string;
  clock_in: string;
  clock_out: string | null;
  is_billable: boolean;
  comments?: string;
}

export const ClockInOut: React.FC<ClockInOutProps> = ({ jobId, jobTitle }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [clockingInOut, setClockingInOut] = useState(false);
  const [activeTimesheet, setActiveTimesheet] = useState<ActiveTimesheet | null>(null);
  const [otherActiveTimesheets, setOtherActiveTimesheets] = useState<ActiveTimesheet[]>([]);
  const [assignmentVerified, setAssignmentVerified] = useState(false);
  const [comments, setComments] = useState('');
  const [elapsedTime, setElapsedTime] = useState('0:00:00');
  
  // Check if the inspector is assigned to this job
  useEffect(() => {
    const checkAssignment = async () => {
      if (!user || !jobId) return;
      
      try {
        setLoading(true);
        
        // Fetch job assignments to check if inspector is assigned to this job
        const { data: assignments, error: assignmentError } = await supabase
          .from('job_assignments')
          .select('*')
          .eq('job_id', jobId)
          .eq('inspector_id', user.id);
        
        if (assignmentError) {
          throw assignmentError;
        }
        
        // Verify assignment
        const isAssigned = assignments && assignments.length > 0;
        setAssignmentVerified(isAssigned);
        
        if (!isAssigned) {
          toast({
            title: "Not assigned to job",
            description: "You cannot clock in because you are not assigned to this job.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error checking assignment:", error);
        toast({
          title: "Error",
          description: "Failed to verify job assignment.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkAssignment();
  }, [user, jobId, toast]);
  
  // Check for active timesheet entries
  useEffect(() => {
    const checkActiveTimesheets = async () => {
      if (!user || !jobId) return;
      
      try {
        setLoading(true);
        
        // Check if user has an active timesheet for this job
        const { data: thisJobTimesheet, error: thisJobError } = await supabase
          .from('timesheets')
          .select('*')
          .eq('inspector_id', user.id)
          .eq('job_id', jobId)
          .is('clock_out', null)
          .single();
        
        if (thisJobError && thisJobError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw thisJobError;
        }
        
        // Check if user has active timesheets for other jobs
        const { data: otherTimesheets, error: otherJobsError } = await supabase
          .from('timesheets')
          .select('*')
          .eq('inspector_id', user.id)
          .neq('job_id', jobId)
          .is('clock_out', null);
        
        if (otherJobsError) {
          throw otherJobsError;
        }
        
        setActiveTimesheet(thisJobTimesheet || null);
        setOtherActiveTimesheets(otherTimesheets || []);
        
      } catch (error) {
        console.error("Error checking active timesheets:", error);
        toast({
          title: "Error",
          description: "Failed to check timesheet status.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkActiveTimesheets();
    
    // Set up a refresh interval (e.g., every 5 minutes)
    const intervalId = setInterval(checkActiveTimesheets, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [user, jobId, toast]);
  
  // Update elapsed time display
  useEffect(() => {
    if (!activeTimesheet) {
      setElapsedTime('0:00:00');
      return;
    }
    
    const updateElapsedTime = () => {
      const clockInTime = new Date(activeTimesheet.clock_in).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - clockInTime) / 1000); // elapsed seconds
      
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      
      setElapsedTime(
        `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };
    
    // Update immediately
    updateElapsedTime();
    
    // Update every second
    const intervalId = setInterval(updateElapsedTime, 1000);
    
    return () => clearInterval(intervalId);
  }, [activeTimesheet]);
  
  const handleClockIn = async () => {
    if (!user || !jobId || !assignmentVerified) return;
    
    if (otherActiveTimesheets.length > 0) {
      toast({
        title: "Already clocked in",
        description: "You have active timesheets for other jobs. Please clock out first.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setClockingInOut(true);
      
      // Create a new timesheet entry
      const { data, error } = await supabase
        .from('timesheets')
        .insert({
          inspector_id: user.id,
          job_id: jobId,
          clock_in: new Date().toISOString(),
          is_billable: true, // Default to billable, can be changed by managers
          comments: comments
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      setActiveTimesheet(data);
      setComments('');
      
      toast({
        title: "Clocked in",
        description: "You have successfully clocked in to this job.",
      });
      
    } catch (error) {
      console.error("Error clocking in:", error);
      toast({
        title: "Error",
        description: "Failed to clock in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setClockingInOut(false);
    }
  };
  
  const handleClockOut = async () => {
    if (!activeTimesheet) return;
    
    try {
      setClockingInOut(true);
      
      const clockOutTime = new Date();
      
      // Calculate total hours
      const clockInTime = new Date(activeTimesheet.clock_in);
      const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
      
      // Update the timesheet
      const { error } = await supabase
        .from('timesheets')
        .update({
          clock_out: clockOutTime.toISOString(),
          total_hours: parseFloat(totalHours.toFixed(2)),
          comments: comments || activeTimesheet.comments
        })
        .eq('id', activeTimesheet.id);
      
      if (error) {
        throw error;
      }
      
      setActiveTimesheet(null);
      setComments('');
      
      toast({
        title: "Clocked out",
        description: `You have successfully clocked out. Total time: ${totalHours.toFixed(2)} hours.`,
      });
      
    } catch (error) {
      console.error("Error clocking out:", error);
      toast({
        title: "Error",
        description: "Failed to clock out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setClockingInOut(false);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Timesheet
          </CardTitle>
          <CardDescription>Track your time on this job</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  if (!assignmentVerified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-amber-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            Not Assigned
          </CardTitle>
          <CardDescription>You are not assigned to this job</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Cannot clock in</AlertTitle>
            <AlertDescription>
              You must be assigned to this job before you can clock in.
              Please contact your supervisor if you believe this is an error.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Timesheet
        </CardTitle>
        <CardDescription>
          Job #{jobId} - {jobTitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {otherActiveTimesheets.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Already clocked in elsewhere</AlertTitle>
            <AlertDescription>
              You have active timesheets for other jobs. Please clock out from those jobs first.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm font-medium">Status</div>
            <div className="flex items-center mt-1">
              {activeTimesheet ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Clocked In
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                  Not Clocked In
                </Badge>
              )}
            </div>
          </div>
          
          {activeTimesheet && (
            <div>
              <div className="text-sm font-medium">Elapsed Time</div>
              <div className="text-xl font-mono mt-1">{elapsedTime}</div>
            </div>
          )}
        </div>
        
        <div className="pt-2">
          <Textarea
            placeholder="Add comments about your work (optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="resize-none h-20"
          />
        </div>
      </CardContent>
      <CardFooter>
        {!activeTimesheet ? (
          <Button 
            onClick={handleClockIn} 
            disabled={clockingInOut || otherActiveTimesheets.length > 0}
            className="w-full"
          >
            {clockingInOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Clock In
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={handleClockOut}
            disabled={clockingInOut}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
          >
            {clockingInOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <StopCircle className="mr-2 h-4 w-4" />
                Clock Out
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ClockInOut; 