import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Job } from "../types";
import { toast } from "sonner";
import { AlertTriangle, Trash2, FileImage } from "lucide-react";
import { assignInspector } from "@/services/aqlService";

interface JobEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  onJobUpdated?: () => void; // Add callback for refreshing job list
}

const JobEditDialog: React.FC<JobEditDialogProps> = ({ 
  isOpen, 
  onClose, 
  job,
  onJobUpdated
}) => {
  const [editedJob, setEditedJob] = useState<Job>({ ...job });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState("general");
  
  const handleChange = (field: keyof Job, value: any) => {
    setEditedJob(prev => ({ ...prev, [field]: value }));
  };

  const handleEmergencyImageUpload = () => {
    // In a real app, this would open a file picker
    // For now, we'll just set a mock image URL
    handleChange('emergencyFloorPlan', '/placeholder.svg');
    toast.success("Floor plan uploaded successfully");
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Get existing jobs from localStorage - use "jobs" consistently
      const jobsData = localStorage.getItem("jobs");
      let jobs = jobsData ? JSON.parse(jobsData) : [];
      
      if (!Array.isArray(jobs)) {
        jobs = [];
      }
      
      // Update job if it exists, add if not
      const jobIndex = jobs.findIndex(j => j.id === editedJob.id);
      
      if (jobIndex >= 0) {
        jobs[jobIndex] = {
          ...jobs[jobIndex],
          ...editedJob,
          updatedAt: new Date().toISOString()
        };
      } else {
        jobs.push({
          ...editedJob,
          updatedAt: new Date().toISOString()
        });
      }
      
      // Save back to localStorage using the consistent "jobs" key
      localStorage.setItem("jobs", JSON.stringify(jobs));
      
      // If the inspector was changed, use the assignInspector function
      // to ensure consistency with other inspector assignments
      if (job.inspector !== editedJob.inspector && editedJob.inspector) {
        await assignInspector(job.id, editedJob.inspector);
      }
      
      toast.success("Job updated successfully");
      
      // Call the refresh callback if provided
      if (onJobUpdated) {
        onJobUpdated();
      }
    } catch (error) {
      console.error("Error updating job:", error);
      toast.error("Failed to update job. Please try again.");
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
          <DialogDescription>
            Contract #{editedJob.contractNumber}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="emergency">Emergency</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="customer" className="text-right">
                    Customer
                  </Label>
                  <Input
                    id="customer"
                    value={editedJob.customerName}
                    onChange={(e) => handleChange('customerName', e.target.value)}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={editedJob.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={new Date(editedJob.startDate).toISOString().split('T')[0]}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select 
                    value={editedJob.status} 
                    onValueChange={(value: any) => handleChange('status', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="needs-review">Needs Review</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="shift" className="text-right">
                    Shift
                  </Label>
                  <Select 
                    value={editedJob.shift} 
                    onValueChange={(value) => handleChange('shift', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning">Morning</SelectItem>
                      <SelectItem value="Afternoon">Afternoon</SelectItem>
                      <SelectItem value="Night">Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="inspector" className="text-right">
                    Inspector
                  </Label>
                  <Select 
                    value={editedJob.inspector || ""} 
                    onValueChange={(value) => handleChange('inspector', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Assign an inspector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      <SelectItem value="Luis Garcia">Luis Garcia</SelectItem>
                      <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                      <SelectItem value="Miguel Torres">Miguel Torres</SelectItem>
                      <SelectItem value="Jamal Wilson">Jamal Wilson</SelectItem>
                      <SelectItem value="Emily Chen">Emily Chen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="emergency">
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <Label htmlFor="emergencyProcedures" className="font-medium">
                      Emergency Evacuation Procedures
                    </Label>
                  </div>
                  <Textarea
                    id="emergencyProcedures"
                    value={editedJob.emergencyProcedures || ''}
                    onChange={(e) => handleChange('emergencyProcedures', e.target.value)}
                    placeholder="Provide detailed emergency evacuation procedures..."
                    className="min-h-[150px]"
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <Label className="font-medium">
                    Evacuation Floor Plan (Optional)
                  </Label>

                  {editedJob.emergencyFloorPlan ? (
                    <div className="mt-2 border rounded-md p-4 relative">
                      <div className="flex justify-end mb-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleChange('emergencyFloorPlan', null)}
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="flex justify-center">
                        <img 
                          src={editedJob.emergencyFloorPlan} 
                          alt="Emergency Evacuation Floor Plan" 
                          className="max-h-[150px] border rounded"
                        />
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="mt-2 border border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={handleEmergencyImageUpload}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <FileImage className="h-6 w-6 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Click to upload evacuation floor plan
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG or PDF (max. 5MB)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JobEditDialog;
