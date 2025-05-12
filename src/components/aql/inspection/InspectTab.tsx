
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Camera, 
  CheckCircle, 
  XCircle, 
  Upload 
} from "lucide-react";
import { InspectTabProps } from './types';

const InspectTab: React.FC<InspectTabProps> = ({ 
  barcode, 
  defectPhotos, 
  setDefectPhotos, 
  handleSubmitInspection,
  setCurrentTab
}) => {
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setDefectPhotos([...defectPhotos, reader.result]);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-3 rounded-md mb-4">
        <h3 className="font-semibold mb-2 text-sm md:text-base">Part Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm">
          <div className="truncate"><span className="font-medium">Part #:</span> {barcode || '7500287G88-001'}</div>
          <div className="truncate"><span className="font-medium">Part Name:</span> Washer</div>
          <div className="truncate"><span className="font-medium">Customer:</span> Burgula OES</div>
          <div className="truncate"><span className="font-medium">Contract #:</span> 16-0013893-1</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3 md:space-y-4">
          <div>
            <Label htmlFor="defectType" className="text-sm">Defect Type</Label>
            <Select>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select defect type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="functional">Functional Issue</SelectItem>
                <SelectItem value="cosmetic">Cosmetic Defect</SelectItem>
                <SelectItem value="dimensional">Dimensional Error</SelectItem>
                <SelectItem value="material">Material Flaw</SelectItem>
                <SelectItem value="contamination">Contamination</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="defectSeverity" className="text-sm">Defect Severity</Label>
            <Select>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select severity..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical - Safety Issue</SelectItem>
                <SelectItem value="major">Major - Functional Impact</SelectItem>
                <SelectItem value="minor">Minor - Cosmetic Issue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="actionRequired" className="text-sm">Action Required</Label>
            <Select>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select action..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reject">Reject Part</SelectItem>
                <SelectItem value="rework">Rework Needed</SelectItem>
                <SelectItem value="useasis">Use As Is (Deviation)</SelectItem>
                <SelectItem value="further">Further Analysis Required</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="notes" className="text-sm">Inspector Notes</Label>
            <Textarea 
              className="w-full h-20 md:h-24 text-sm"
              placeholder="Enter detailed inspection notes here..."
            />
          </div>
        </div>
        
        <div className="space-y-3 md:space-y-4">
          <div>
            <Label className="mb-1 block text-sm">Defect Photos</Label>
            <div className="border border-dashed border-gray-300 rounded-md p-4 md:p-8 text-center">
              <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-xs md:text-sm text-gray-500">Upload photos of the defect</p>
              <div className="mt-2 relative">
                <Button variant="outline" className="relative text-xs md:text-sm">
                  <Upload className="h-3 w-3 md:h-4 md:w-4 mr-1" /> Upload Photos
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handlePhotoUpload}
                  />
                </Button>
              </div>
            </div>
          </div>
          
          {defectPhotos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {defectPhotos.map((photo, index) => (
                <div key={index} className="relative border rounded-md overflow-hidden">
                  <img src={photo} alt="Defect" className="w-full h-28 object-cover" />
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => {
                      const newPhotos = [...defectPhotos];
                      newPhotos.splice(index, 1);
                      setDefectPhotos(newPhotos);
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-3 md:mt-4 flex flex-col gap-2">
            <Button variant="default" className="w-full flex items-center justify-center text-xs md:text-sm" onClick={handleSubmitInspection}>
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" /> Submit Inspection
            </Button>
            <Button variant="outline" className="w-full flex items-center justify-center text-xs md:text-sm" onClick={() => setCurrentTab('scan')}>
              <XCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectTab;
