
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Camera, Barcode, Plus, Upload, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Defect, DefectType } from '../jobs/types';

interface DefectLogFormProps {
  jobId: string;
  shift: string;
  defectTypes: DefectType[];
  onAddDefect: (defect: Omit<Defect, 'id'>) => void;
}

const DefectLogForm: React.FC<DefectLogFormProps> = ({
  jobId,
  shift,
  defectTypes,
  onAddDefect
}) => {
  const { toast } = useToast();
  const [newDefectType, setNewDefectType] = useState<string>('');
  const [count, setCount] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [showNewDefectDialog, setShowNewDefectDialog] = useState(false);
  const [newDefectName, setNewDefectName] = useState('');
  const [newDefectDescription, setNewDefectDescription] = useState('');
  const [newDefectCategory, setNewDefectCategory] = useState('Visual');
  const [newDefectSeverity, setNewDefectSeverity] = useState<DefectType['severity']>('medium');
  const [defectPhotos, setDefectPhotos] = useState<string[]>([]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDefectType) {
      toast({
        title: "Missing information",
        description: "Please select a defect type",
        variant: "destructive"
      });
      return;
    }
    
    const selectedDefectType = defectTypes.find(dt => dt.id === newDefectType);
    
    if (!selectedDefectType) {
      toast({
        title: "Invalid defect type",
        description: "The selected defect type is not valid",
        variant: "destructive"
      });
      return;
    }
    
    const newDefect: Omit<Defect, 'id'> = {
      jobId,
      defectTypeId: selectedDefectType.id,
      defectTypeName: selectedDefectType.name,
      count,
      date: new Date().toISOString().split('T')[0],
      shift,
      reportedBy: 'Luis Garcia', // In a real app, this would be the current user
      status: 'pending',
      notes: notes || undefined,
      images: defectPhotos.length > 0 ? defectPhotos : undefined
    };
    
    onAddDefect(newDefect);
    
    // Reset form
    setNewDefectType('');
    setCount(1);
    setNotes('');
    setDefectPhotos([]);
  };

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setDefectPhotos([...defectPhotos, reader.result]);
          toast({
            title: "Photo Added",
            description: "Defect photo has been added to the report",
          });
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  // Handle adding a new defect type
  const handleAddNewDefectType = () => {
    if (!newDefectName) {
      toast({
        title: "Missing information",
        description: "Please enter a name for the new defect type",
        variant: "destructive"
      });
      return;
    }
    
    // In a real application, this would call an API to add the new defect type
    // For demo purposes, we'll just simulate adding it to our list
    toast({
      title: "Defect Type Added",
      description: "The new defect type has been added to the system",
    });
    
    setShowNewDefectDialog(false);
    
    // Reset form fields
    setNewDefectName('');
    setNewDefectDescription('');
    setNewDefectCategory('Visual');
    setNewDefectSeverity('medium');
  };

  // Remove a photo from the list
  const removePhoto = (index: number) => {
    const newPhotos = [...defectPhotos];
    newPhotos.splice(index, 1);
    setDefectPhotos(newPhotos);
  };

  // Prepare category options for select
  const categories = Array.from(new Set(defectTypes.map(dt => dt.category || 'Other')));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Log New Defect</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="defect-type">Defect Type</Label>
                <Dialog open={showNewDefectDialog} onOpenChange={setShowNewDefectDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add New
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Defect Type</DialogTitle>
                      <DialogDescription>
                        Create a new defect type that will be available for all inspectors.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-defect-name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="new-defect-name"
                          value={newDefectName}
                          onChange={(e) => setNewDefectName(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-defect-category" className="text-right">
                          Category
                        </Label>
                        <Select value={newDefectCategory} onValueChange={setNewDefectCategory}>
                          <SelectTrigger id="new-defect-category" className="col-span-3">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Visual">Visual</SelectItem>
                            <SelectItem value="Functional">Functional</SelectItem>
                            <SelectItem value="Assembly">Assembly</SelectItem>
                            <SelectItem value="Material">Material</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-defect-severity" className="text-right">
                          Severity
                        </Label>
                        <Select 
                          value={newDefectSeverity} 
                          onValueChange={(value) => setNewDefectSeverity(value as DefectType['severity'])}
                        >
                          <SelectTrigger id="new-defect-severity" className="col-span-3">
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-defect-description" className="text-right">
                          Description
                        </Label>
                        <Textarea
                          id="new-defect-description"
                          value={newDefectDescription}
                          onChange={(e) => setNewDefectDescription(e.target.value)}
                          className="col-span-3"
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowNewDefectDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="button" onClick={handleAddNewDefectType}>
                        Add Defect Type
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Select value={newDefectType} onValueChange={setNewDefectType}>
                <SelectTrigger id="defect-type">
                  <SelectValue placeholder="Select defect type" />
                </SelectTrigger>
                <SelectContent>
                  {defectTypes.map((defectType) => (
                    <SelectItem key={defectType.id} value={defectType.id}>
                      {defectType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="count">Count</Label>
                <span className="text-xs text-gray-500">Number of this defect found</span>
              </div>
              <Input
                id="count"
                type="number"
                min={1}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional details about the defect..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Photos</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
              <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 mb-2">Take a photo or upload an image of the defect</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button type="button" variant="outline" className="relative">
                  <Upload className="h-4 w-4 mr-1" />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handlePhotoUpload}
                  />
                </Button>
                <Button type="button" variant="outline">
                  <Camera className="h-4 w-4 mr-1" />
                  Take Photo
                </Button>
                <Button type="button" variant="outline">
                  <Barcode className="h-4 w-4 mr-1" />
                  Scan Barcode
                </Button>
              </div>
            </div>
            
            {defectPhotos.length > 0 && (
              <div className="mt-4">
                <Label className="mb-2 block">Uploaded Photos</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {defectPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={photo} 
                        alt={`Defect ${index + 1}`} 
                        className="w-full h-24 object-cover rounded-md border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6 p-1 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline">Cancel</Button>
            <Button type="submit">Submit Defect</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DefectLogForm;
