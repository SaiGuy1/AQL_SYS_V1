import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Job } from "../types";
import { Badge } from "@/components/ui/badge";
import StatusBadge from '../StatusBadge';
import { CalendarDays, MapPin, User, Briefcase, FileBox, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface JobDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

const JobDetailsDialog: React.FC<JobDetailsDialogProps> = ({ isOpen, onClose, job }) => {
  const [isEmergencyExpanded, setIsEmergencyExpanded] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Job Details</DialogTitle>
          <DialogDescription>
            Contract #{job.contractNumber}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{job.customerName}</h3>
                <StatusBadge status={job.status} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(job.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Inspector: {job.inspector || <span className="text-gray-400 italic">Unassigned</span>}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>Shift: {job.shift}</span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileBox className="h-4 w-4 text-muted-foreground" />
                    <span>Defects Found</span>
                  </div>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                    {job.defects}
                  </Badge>
                </div>
              </div>
              
              {job.pphv !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Parts Per Hour Verified (PPHV)</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                    {job.pphv}
                  </Badge>
                </div>
              )}
              
              {job.billingStatus && (
                <div className="flex items-center justify-between">
                  <span>Billing Status</span>
                  <Badge 
                    variant="outline" 
                    className={`
                      ${job.billingStatus === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-300' : 
                       job.billingStatus === 'billed' ? 'bg-green-50 text-green-700 border-green-300' : 
                       'bg-red-50 text-red-700 border-red-300'}
                    `}
                  >
                    {job.billingStatus.charAt(0).toUpperCase() + job.billingStatus.slice(1)}
                  </Badge>
                </div>
              )}
              
              {job.instructions && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileBox className="h-4 w-4 text-muted-foreground" />
                    Work Instructions
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-md border text-sm whitespace-pre-line">
                    {job.instructions}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="emergency">
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-800">Emergency Evacuation Procedures</h3>
                </div>
                
                {job.emergencyProcedures ? (
                  <div className="text-sm mt-2 text-gray-700 whitespace-pre-wrap">
                    {job.emergencyProcedures}
                  </div>
                ) : (
                  <div className="text-sm italic text-gray-500 mt-2">
                    No emergency procedures have been specified for this job.
                  </div>
                )}

                {job.emergencyFloorPlan && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-2 text-amber-800">Evacuation Floor Plan</h4>
                    <div className="border rounded-md overflow-hidden">
                      <img
                        src={job.emergencyFloorPlan}
                        alt="Emergency Evacuation Floor Plan"
                        className="w-full h-auto max-h-[200px] object-contain cursor-pointer"
                        onClick={() => window.open(job.emergencyFloorPlan, '_blank')}
                      />
                    </div>
                    <div className="text-xs text-center mt-1 text-gray-500">
                      Click on image to view full size
                    </div>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                <p className="font-medium">Important Safety Reminder:</p>
                <p className="mt-1">Review these procedures before starting work and ensure all team members are aware of emergency exits and assembly points.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsDialog;
