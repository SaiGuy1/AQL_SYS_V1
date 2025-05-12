import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { 
  supabase,
  formatLocationDisplay,
  getLocationsOrdered, 
  getInspectorLocations,
  updateInspectorLocations,
  Location,
  Inspector
} from '@/services/supabaseService';
import { Loader2, MapPin, Search, Plus, X, UserCog, Edit, Save, AlertTriangle } from 'lucide-react';

interface InspectorManagementProps {
  userRole: string;
}

const InspectorManagement: React.FC<InspectorManagementProps> = ({ userRole }) => {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingInspectors, setLoadingInspectors] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedInspector, setSelectedInspector] = useState<Inspector | null>(null);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [savingAssignments, setSavingAssignments] = useState(false);
  
  // Only admin and manager users can manage inspectors
  const canManageInspectors = userRole === 'admin' || userRole === 'manager';
  
  // Load inspectors and locations on component mount
  useEffect(() => {
    fetchInspectors();
    fetchLocations();
  }, []);
  
  const fetchInspectors = async () => {
    setLoadingInspectors(true);
    try {
      // Get all inspectors from the profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'inspector')
        .order('name');
        
      if (error) {
        console.error("Error fetching inspectors:", error);
        toast.error("Failed to load inspectors");
      } else {
        setInspectors(data || []);
        console.log(`Loaded ${data?.length || 0} inspectors`);
      }
    } catch (error) {
      console.error("Error in fetchInspectors:", error);
      toast.error("Failed to load inspectors");
    } finally {
      setLoadingInspectors(false);
    }
  };
  
  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const locationsData = await getLocationsOrdered();
      setLocations(locationsData);
      console.log(`Loaded ${locationsData.length} locations`);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to load locations");
    } finally {
      setLoadingLocations(false);
    }
  };
  
  // Filter inspectors based on search query
  const filteredInspectors = inspectors.filter(inspector => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      inspector.name?.toLowerCase().includes(query) || 
      inspector.email?.toLowerCase().includes(query)
    );
  });
  
  // Open inspector edit dialog
  const openEditDialog = async (inspector: Inspector) => {
    setSelectedInspector(inspector);
    setSelectedLocationIds([]);
    
    try {
      // Load inspector's currently assigned locations
      const assignedLocations = await getInspectorLocations(inspector.id || '');
      setSelectedLocationIds(assignedLocations.map(loc => loc.id));
    } catch (error) {
      console.error("Error loading inspector locations:", error);
      toast.error("Could not load assigned locations");
    }
    
    setShowEditDialog(true);
  };
  
  // Toggle location selection
  const toggleLocationSelection = (locationId: string) => {
    setSelectedLocationIds(prev => 
      prev.includes(locationId) 
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };
  
  // Get location name from ID
  const getLocationName = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? formatLocationDisplay(location) : locationId;
  };
  
  // Save inspector's location assignments
  const saveLocationAssignments = async () => {
    if (!selectedInspector || !selectedInspector.id) {
      toast.error("No inspector selected");
      return;
    }
    
    if (selectedLocationIds.length === 0) {
      toast.error("Please select at least one location");
      return;
    }
    
    setSavingAssignments(true);
    try {
      await updateInspectorLocations(selectedInspector.id, selectedLocationIds);
      
      toast.success(`Updated location assignments for ${selectedInspector.name}`);
      setShowEditDialog(false);
      
      // Update the primary location in the inspector's profile if it has changed
      if (selectedLocationIds.length > 0 && selectedInspector.location_id !== selectedLocationIds[0]) {
        try {
          await supabase
            .from('profiles')
            .update({ location_id: selectedLocationIds[0] })
            .eq('id', selectedInspector.id);
            
          console.log(`Updated primary location for ${selectedInspector.name}`);
        } catch (error) {
          console.error("Error updating primary location:", error);
        }
      }
      
      // Refresh the inspectors list
      fetchInspectors();
    } catch (error) {
      console.error("Error saving location assignments:", error);
      toast.error("Failed to save location assignments");
    } finally {
      setSavingAssignments(false);
    }
  };
  
  // Get the count of associated locations for an inspector
  const getLocationCountBadge = (inspectorId: string) => {
    const count = selectedInspector?.id === inspectorId 
      ? selectedLocationIds.length 
      : 0; // We only know the count for the selected inspector
    
    return count > 0 ? (
      <Badge variant="secondary" className="ml-2">
        {count} location{count !== 1 ? 's' : ''}
      </Badge>
    ) : null;
  };
  
  if (!canManageInspectors) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to manage inspectors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This feature is only available to administrators and managers.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <UserCog className="h-5 w-5 mr-2" />
            Inspector Management
          </CardTitle>
          <CardDescription>
            Manage inspectors and their assigned locations
          </CardDescription>
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inspectors..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {loadingInspectors ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : inspectors.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            No inspectors found in the system
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Primary Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInspectors.map(inspector => {
                // Find inspector's primary location from their location_id
                const primaryLocation = locations.find(loc => loc.id === inspector.location_id);
                
                return (
                  <TableRow key={inspector.id}>
                    <TableCell className="font-medium">
                      {inspector.name}
                      {getLocationCountBadge(inspector.id || '')}
                    </TableCell>
                    <TableCell>{inspector.email}</TableCell>
                    <TableCell>
                      {primaryLocation 
                        ? formatLocationDisplay(primaryLocation)
                        : <span className="text-muted-foreground italic">Not assigned</span>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openEditDialog(inspector)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Manage Locations
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      {/* Edit Dialog for Location Assignments */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Location Assignments</DialogTitle>
            <DialogDescription>
              {selectedInspector?.name 
                ? `Assign ${selectedInspector.name} to one or more locations`
                : 'Assign inspector to locations'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Selected Locations</h3>
              <Badge variant="outline">
                {selectedLocationIds.length} selected
              </Badge>
            </div>
            
            {selectedLocationIds.length === 0 ? (
              <div className="text-sm text-muted-foreground italic border border-dashed rounded-md p-4 text-center">
                No locations selected. Please select at least one location below.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedLocationIds.map(id => (
                  <div 
                    key={id} 
                    className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center"
                  >
                    {getLocationName(id)}
                    <button 
                      type="button"
                      onClick={() => toggleLocationSelection(id)}
                      className="ml-2 text-primary/70 hover:text-primary"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="border rounded-md mt-4">
              <div className="p-3 bg-muted/50 border-b flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <h3 className="text-sm font-medium">Available Locations</h3>
              </div>
              
              {loadingLocations ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {locations.map(location => (
                      <div key={location.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`location-${location.id}`}
                          checked={selectedLocationIds.includes(location.id)}
                          onCheckedChange={() => toggleLocationSelection(location.id)}
                        />
                        <Label 
                          htmlFor={`location-${location.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {formatLocationDisplay(location)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-4 text-sm text-amber-800">
              <p className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                The first selected location will be set as the inspector's primary location.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={saveLocationAssignments}
              disabled={selectedLocationIds.length === 0 || savingAssignments}
              className="flex items-center gap-2"
            >
              {savingAssignments && <Loader2 className="h-4 w-4 animate-spin" />}
              {savingAssignments ? 'Saving...' : 'Save Assignments'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default InspectorManagement; 