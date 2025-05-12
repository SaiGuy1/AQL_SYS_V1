import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getLocationsOrdered, createLocation, formatLocationDisplay, Location } from '@/services/supabaseService';
import { toast } from 'sonner';
import { Loader2, Plus, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface LocationsManagerProps {
  userRole: string;
}

const LocationsManager: React.FC<LocationsManagerProps> = ({ userRole }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    location_number: 0
  });
  const [addingLocation, setAddingLocation] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    location_number: ''
  });
  
  // Only admin users can add locations
  const canAddLocations = userRole === 'admin';
  
  // Load locations on component mount
  useEffect(() => {
    fetchLocations();
  }, []);
  
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const locationsData = await getLocationsOrdered();
      setLocations(locationsData);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };
  
  const validateNewLocation = () => {
    const newErrors = {
      name: '',
      location_number: ''
    };
    
    if (!newLocation.name.trim()) {
      newErrors.name = 'Location name is required';
    }
    
    if (!newLocation.location_number) {
      newErrors.location_number = 'Location number is required';
    } else if (newLocation.location_number < 1) {
      newErrors.location_number = 'Location number must be positive';
    } else if (locations.some(l => l.location_number === newLocation.location_number)) {
      newErrors.location_number = 'This location number is already in use';
    }
    
    setErrors(newErrors);
    return !newErrors.name && !newErrors.location_number;
  };
  
  const handleAddLocation = async () => {
    if (!validateNewLocation()) return;
    
    setAddingLocation(true);
    try {
      await createLocation({
        name: newLocation.name.trim(),
        location_number: newLocation.location_number
      });
      
      toast.success(`Added location: ${formatLocationDisplay({
        location_number: newLocation.location_number,
        name: newLocation.name
      } as Location)}`);
      
      // Reset form and close dialog
      setNewLocation({ name: '', location_number: 0 });
      setShowAddDialog(false);
      
      // Refresh locations list
      fetchLocations();
    } catch (error) {
      console.error("Error adding location:", error);
      toast.error("Failed to add location");
    } finally {
      setAddingLocation(false);
    }
  };
  
  if (!canAddLocations) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Official AQL Locations</CardTitle>
          <CardDescription>
            List of all official AQL facility locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Location #</TableHead>
                  <TableHead>Location Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map(location => (
                  <TableRow key={location.id}>
                    <TableCell className="font-mono">
                      {location.location_number.toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell>{location.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Official AQL Locations</CardTitle>
          <CardDescription>
            Manage the list of official AQL facility locations
          </CardDescription>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add Location
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Location #</TableHead>
                <TableHead>Location Name</TableHead>
                <TableHead>Formatted Display</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map(location => (
                <TableRow key={location.id}>
                  <TableCell className="font-mono">
                    {location.location_number.toString().padStart(2, '0')}
                  </TableCell>
                  <TableCell>{location.name}</TableCell>
                  <TableCell className="font-semibold">{formatLocationDisplay(location)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Caution: Locations are used for job assignments and inspector registration. 
          Adding new locations should be done carefully to match official AQL facilities.
        </div>
      </CardFooter>
      
      {/* Add Location Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Official AQL Location</DialogTitle>
            <DialogDescription>
              Add a new location to the official AQL facilities list.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div>
              <Label htmlFor="location_number">Location Number</Label>
              <Input
                id="location_number"
                type="number"
                value={newLocation.location_number || ''}
                onChange={(e) => setNewLocation({...newLocation, location_number: parseInt(e.target.value) || 0})}
                placeholder="74"
              />
              {errors.location_number && (
                <p className="text-red-500 text-xs mt-1">{errors.location_number}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="name">Location Name</Label>
              <Input
                id="name"
                value={newLocation.name}
                onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                placeholder="Contitech - NH"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            
            <div className="bg-muted p-3 rounded-md text-sm">
              <p className="font-semibold mb-1">Preview:</p>
              <p className="font-mono">
                {newLocation.location_number > 0 ? 
                  formatLocationDisplay({
                    location_number: newLocation.location_number,
                    name: newLocation.name || '[Location Name]'
                  } as Location) :
                  'XX - [Location Name]'
                }
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLocation} disabled={addingLocation}>
              {addingLocation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {addingLocation ? 'Adding...' : 'Add Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default LocationsManager; 