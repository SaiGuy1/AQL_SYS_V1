
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Job } from "../types";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause, StopCircle, Timer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ClockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

const ClockDialog: React.FC<ClockDialogProps> = ({ isOpen, onClose, job }) => {
  const [status, setStatus] = useState<'not-started' | 'active' | 'paused' | 'completed'>('not-started');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0); // in milliseconds
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0); // in milliseconds
  const [notes, setNotes] = useState("");
  const [activityType, setActivityType] = useState("inspection");
  const [isBillable, setIsBillable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate elapsed time
  useEffect(() => {
    if (status === 'active' && startTime) {
      const elapsed = currentTime.getTime() - startTime.getTime() - totalPausedTime;
      setElapsedTime(elapsed);
    }
    else if (status === 'paused' && startTime && pauseStartTime) {
      const pauseDuration = currentTime.getTime() - pauseStartTime.getTime();
      const elapsed = pauseStartTime.getTime() - startTime.getTime() - totalPausedTime;
      setElapsedTime(elapsed);
    }
  }, [currentTime, startTime, pauseStartTime, totalPausedTime, status]);
  
  const handleClockIn = () => {
    setStartTime(new Date());
    setStatus('active');
    toast.success("Clocked in successfully");
  };
  
  const handlePause = () => {
    setPauseStartTime(new Date());
    setStatus('paused');
    toast.info("Timer paused");
  };
  
  const handleResume = () => {
    if (pauseStartTime) {
      const pauseDuration = new Date().getTime() - pauseStartTime.getTime();
      setTotalPausedTime(totalPausedTime + pauseDuration);
      setPauseStartTime(null);
    }
    setStatus('active');
    toast.info("Timer resumed");
  };
  
  const handleClockOut = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("Clocked out successfully");
      setIsSubmitting(false);
      setStatus('completed');
    }, 1000);
  };
  
  // Format milliseconds to HH:MM:SS
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const pad = (num: number) => num.toString().padStart(2, '0');
    
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Clock In/Out</DialogTitle>
          <DialogDescription>
            Job #{job.contractNumber} - {job.customerName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Time Tracking</CardTitle>
              <CardDescription>
                {status === 'not-started' && 'Ready to start work'}
                {status === 'active' && 'Currently working'}
                {status === 'paused' && 'Work paused'}
                {status === 'completed' && 'Work completed'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center items-center flex-col gap-4">
                <div className="text-4xl font-mono font-bold flex items-center gap-2">
                  <Timer className="h-6 w-6 text-muted-foreground" />
                  <span>{formatTime(elapsedTime)}</span>
                </div>
                
                <div className="flex gap-2 mt-2">
                  {status === 'not-started' && (
                    <Button onClick={handleClockIn} className="gap-1">
                      <Play className="h-4 w-4" />
                      Clock In
                    </Button>
                  )}
                  
                  {status === 'active' && (
                    <>
                      <Button variant="outline" onClick={handlePause} className="gap-1">
                        <Pause className="h-4 w-4" />
                        Pause
                      </Button>
                      <Button onClick={handleClockOut} className="gap-1">
                        <StopCircle className="h-4 w-4" />
                        Clock Out
                      </Button>
                    </>
                  )}
                  
                  {status === 'paused' && (
                    <>
                      <Button variant="outline" onClick={handleResume} className="gap-1">
                        <Play className="h-4 w-4" />
                        Resume
                      </Button>
                      <Button onClick={handleClockOut} className="gap-1">
                        <StopCircle className="h-4 w-4" />
                        Clock Out
                      </Button>
                    </>
                  )}
                  
                  {status === 'completed' && (
                    <Badge className="px-3 py-1 text-base bg-green-100 text-green-800 hover:bg-green-200">
                      <Clock className="h-4 w-4 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {status !== 'not-started' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="activity">Activity Type</Label>
                <Select
                  value={activityType}
                  onValueChange={setActivityType}
                  disabled={status === 'completed'}
                >
                  <SelectTrigger id="activity">
                    <SelectValue placeholder="Select activity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="defect-review">Defect Review</SelectItem>
                    <SelectItem value="rework">Rework</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="admin">Administrative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="billable">Billable Time</Label>
                <Switch
                  id="billable"
                  checked={isBillable}
                  onCheckedChange={setIsBillable}
                  disabled={status === 'completed'}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add details about your work..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-24"
                  disabled={status === 'completed'}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClockDialog;
