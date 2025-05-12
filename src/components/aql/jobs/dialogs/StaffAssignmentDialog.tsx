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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Search, AlertCircle, Loader2, Info, Wifi, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { assignInspector, fetchJobs } from "@/services/aqlService";
import { getInspectorProfilesByLocation, Inspector, getLocationById, formatLocationDisplay } from "@/services/supabaseService";

interface StaffAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  onJobUpdated?: () => void; // Callback to refresh job list after assignment
}

// Inspector type with additional UI properties
interface ExtendedInspector extends Inspector {
  jobMatch?: number;
  certified?: boolean;
  available?: boolean;
  experience?: string;
  previousJobs?: number;
  isAvailable?: boolean;
}

const StaffAssignmentDialog: React.FC<StaffAssignmentDialogProps> = ({ 
  isOpen, 
  onClose, 
  job,
  onJobUpdated 
}) => {
  const [selectedInspector, setSelectedInspector] = useState<string | null>(job.inspector_id || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAvailable, setFilterAvailable] = useState(true);
  const [filterCertified, setFilterCertified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("recommended");
  const [inspectors, setInspectors] = useState<ExtendedInspector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationMismatch, setLocationMismatch] = useState(false);
  const [jobLocation, setJobLocation] = useState<any>(null);
  
  // Log job and location information for debugging
  useEffect(() => {
    if (isOpen) {
      console.log('Job details:', job);
      console.log('Job location_id:', job.location_id);
      
      // Fetch location details if we have a location_id
      if (job.location_id) {
        fetchLocationDetails(job.location_id);
      }
    }
  }, [isOpen, job]);
  
  // Fetch location details
  const fetchLocationDetails = async (locationId: string) => {
    try {
      const locationData = await getLocationById(locationId);
      setJobLocation(locationData);
      console.log('Location details loaded:', locationData);
    } catch (error) {
      console.error('Error fetching location details:', error);
    }
  };
  
  // Fetch inspectors from the database when the dialog opens
  useEffect(() => {
    const fetchInspectors = async () => {
      if (!isOpen) return; // Don't fetch if the dialog is not open
      
      setIsLoading(true);
      try {
        // Extract location ID from the job
        const locationId = job.location_id;
        
        if (!locationId) {
          console.warn('No location_id found for this job. Cannot filter inspectors by location.');
          setInspectors([]);
          setIsLoading(false);
          return;
        }
        
        console.log(`Fetching inspectors for location: ${locationId}`);
        
        // Fetch inspectors from the database
        const fetchedInspectors = await getInspectorProfilesByLocation(locationId);
        
        // Transform the inspectors to include UI properties
        const extendedInspectors: ExtendedInspector[] = fetchedInspectors.map(inspector => {
          // Calculate a fake job match score (this would be more sophisticated in a real app)
          const jobMatch = Math.floor(Math.random() * 30) + 70; // Random score between 70-99
          
          return {
            ...inspector,
            jobMatch,
            certified: Math.random() > 0.2, // 80% chance of being certified
            available: Math.random() > 0.1, // 90% chance of being available
            experience: Math.random() > 0.7 ? "Senior" : Math.random() > 0.4 ? "Mid-level" : "Junior",
            previousJobs: Math.floor(Math.random() * 20) + 1, // Random number between 1-20
            isAvailable: Math.random() > 0.5 // Randomly set isAvailable
          };
        });
        
        setInspectors(extendedInspectors);
        console.log(`Loaded ${extendedInspectors.length} inspectors for location ${locationId}`);
      } catch (error) {
        console.error("Error fetching inspectors:", error);
        toast.error("Failed to load inspectors. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInspectors();
  }, [isOpen, job.location_id]);
  
  // Check for location mismatch when an inspector is selected
  useEffect(() => {
    if (!selectedInspector) {
      setLocationMismatch(false);
      return;
    }
    
    const selectedInspectorData = inspectors.find(i => i.user_id === selectedInspector);
    if (!selectedInspectorData) {
      setLocationMismatch(false);
      return;
    }
    
    // Check if inspector's location matches job's location
    const jobLocationId = job.location_id || job.location?.split('|')[0] || job.location;
    const inspectorLocationId = selectedInspectorData.location_id;
    
    console.log('Comparing locations:', { 
      jobLocationId, 
      inspectorLocationId, 
      match: jobLocationId === inspectorLocationId 
    });
    
    const mismatch = jobLocationId && inspectorLocationId && jobLocationId !== inspectorLocationId;
    setLocationMismatch(mismatch);
    
    if (mismatch) {
      console.warn(`Location mismatch: Inspector (${inspectorLocationId}) and job (${jobLocationId}) are at different locations.`);
    }
  }, [selectedInspector, inspectors, job.location_id, job.location]);
  
  // Filter inspectors based on search and filters
  const filteredInspectors = inspectors.filter(inspector => {
    const matchesSearch = inspector.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAvailable = filterAvailable ? inspector.isAvailable !== false : true;
    const matchesCertified = filterCertified ? inspector.certified : true;
    return matchesSearch && matchesAvailable && matchesCertified;
  });

  // Sort inspectors based on active tab and prioritize inspectors from the same location
  const sortedInspectors = [...filteredInspectors].sort((a, b) => {
    // First priority: Always prioritize inspectors from the same location as the job
    const aLocationMatch = a.location_id === job.location_id;
    const bLocationMatch = b.location_id === job.location_id;
    
    if (aLocationMatch && !bLocationMatch) return -1; // a comes first
    if (!aLocationMatch && bLocationMatch) return 1;  // b comes first
    
    // Second priority: Sort based on tab selection (only if location match is the same)
    if (activeTab === "recommended") {
      return (b.jobMatch || 0) - (a.jobMatch || 0);
    } else if (activeTab === "experience") {
      const expLevel = { "Senior": 3, "Mid-level": 2, "Junior": 1 };
      const aLevel = a.experience ? expLevel[a.experience as keyof typeof expLevel] : 0;
      const bLevel = b.experience ? expLevel[b.experience as keyof typeof expLevel] : 0;
      return bLevel - aLevel;
    } else {
      return (b.previousJobs || 0) - (a.previousJobs || 0);
    }
  });
  
  // Format for availability status
  const formatAvailabilityStatus = (inspector: ExtendedInspector) => {
    if (inspector.isAvailable === false) {
      return 'Unavailable';
    } else if (inspector.available) {
      return 'Available';
    }
    return 'Status Unknown';
  };

  // Get icon for availability
  const getAvailabilityIcon = (inspector: ExtendedInspector) => {
    if (inspector.isAvailable === false) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 flex items-center gap-1">
        <WifiOff className="h-3 w-3 mr-1" />
        Unavailable
      </Badge>;
    } else if (inspector.available) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 flex items-center gap-1">
        <Wifi className="h-3 w-3 mr-1" />
        Available
      </Badge>;
    }
    return null;
  };
  
  // Get badge for location match
  const getLocationMatchBadge = (inspector: ExtendedInspector) => {
    if (inspector.location_id && job.location_id) {
      const isMatch = inspector.location_id === job.location_id;
      
      if (isMatch) {
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 flex items-center gap-1">
          <CheckCircle className="h-3 w-3 mr-1" />
          Same Location
        </Badge>;
      } else {
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 mr-1" />
          Different Location
        </Badge>;
      }
    }
    return null;
  };

  // Submit the inspector assignment
  const handleSubmit = async () => {
    if (!selectedInspector) {
      toast.error("Please select an inspector.");
      return;
    }
    
    // Get the selected inspector data
    const selectedInspectorData = inspectors.find(i => i.user_id === selectedInspector);
    
    // Check if inspector is available
    if (selectedInspectorData && selectedInspectorData.isAvailable === false) {
      toast.error("This inspector is marked as unavailable. Please select a different inspector.");
      return;
    }
    
    // Show warning if there's a location mismatch
    if (locationMismatch) {
      const confirmAssign = window.confirm(
        "Warning: This inspector is assigned to a different location than the job. Do you still want to proceed?"
      );
      if (!confirmAssign) {
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await assignInspector(job.id, selectedInspector);
      
      if (success) {
        toast.success("Inspector assigned successfully!");
        // Trigger job refresh callback if provided
        if (onJobUpdated) {
          onJobUpdated();
        }
        onClose();
      } else {
        toast.error("Failed to assign inspector. Please try again.");
      }
    } catch (error) {
      console.error("Error assigning inspector:", error);
      toast.error("An error occurred while assigning the inspector.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Staff</DialogTitle>
          <DialogDescription>
            Assign an inspector to Job #{job.contractNumber}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Display job location information */}
          <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
            <p className="text-sm text-blue-700 flex items-center mb-1">
              <Info className="h-4 w-4 mr-1" />
              Job Location: {
                jobLocation ? (
                  <span className="font-medium">{formatLocationDisplay(jobLocation)}</span>
                ) : job.location ? (
                  <span>{job.location}</span>
                ) : (
                  <span className="italic text-blue-500">Unknown Location</span>
                )
              }
            </p>
            {job.location_id && (
              <p className="text-xs text-blue-600">Location ID: {job.location_id}</p>
            )}
            {job.location_number && (
              <p className="text-xs text-blue-600">Location Number: {job.location_number}</p>
            )}
          </div>
          
          {/* Show warning if inspector location doesn't match job location */}
          {locationMismatch && (
            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
              <p className="text-sm text-amber-700 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Warning: This inspector is assigned to a different location than the job.
              </p>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inspectors..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select 
              defaultValue={filterAvailable ? "available" : "all"}
              onValueChange={(value) => setFilterAvailable(value === "available")}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              defaultValue={filterCertified ? "certified" : "all"}
              onValueChange={(value) => setFilterCertified(value === "certified")}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Certification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="certified">Certified</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-2">
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="history">Job History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recommended" className="mt-0">
              <div className="text-xs text-muted-foreground mb-1">Sorted by job match score</div>
            </TabsContent>
            <TabsContent value="experience" className="mt-0">
              <div className="text-xs text-muted-foreground mb-1">Sorted by experience level</div>
            </TabsContent>
            <TabsContent value="history" className="mt-0">
              <div className="text-xs text-muted-foreground mb-1">Sorted by number of previous jobs</div>
            </TabsContent>
          </Tabs>
          
          <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Loading inspectors...</p>
              </div>
            ) : sortedInspectors.length > 0 ? (
              sortedInspectors.map((inspector) => (
                <div 
                  key={inspector.user_id} 
                  className={`p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer ${selectedInspector === inspector.user_id ? 'bg-muted' : ''}`}
                  onClick={() => setSelectedInspector(inspector.user_id)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>{inspector.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{inspector.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{inspector.experience}</span>
                        <span>•</span>
                        <span>{inspector.previousJobs} previous jobs</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getAvailabilityIcon(inspector)}
                    {!inspector.certified && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                        Not Certified
                      </Badge>
                    )}
                    {inspector.jobMatch && inspector.jobMatch >= 90 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        {inspector.jobMatch}% Match
                      </Badge>
                    )}
                    {getLocationMatchBadge(inspector)}
                    {selectedInspector === inspector.user_id && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center">
                <AlertCircle className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No inspectors match your criteria</p>
              </div>
            )}
          </div>
          
          {/* Show currently assigned inspector */}
          {job.inspector && (
            <div className="text-sm text-muted-foreground mt-2">
              <p>Currently assigned: <span className="font-medium">{job.inspector}</span></p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedInspector || isSubmitting}
              className={locationMismatch ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              {isSubmitting ? "Assigning..." : locationMismatch ? "Assign Anyway" : "Assign Inspector"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StaffAssignmentDialog;
