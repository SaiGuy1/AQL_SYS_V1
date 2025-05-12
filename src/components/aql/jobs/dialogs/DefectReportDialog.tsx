
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
import { Job } from "../types";
import { toast } from "sonner";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, ImagePlus, ScanLine, AlertTriangle, Save } from 'lucide-react';
import { DefectType } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DefectReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

// Sample defect types
const mockDefectTypes: DefectType[] = [
  {
    id: "1",
    name: "Surface Scratch",
    description: "Visible scratch on component surface",
    category: "Surface",
    severity: "medium"
  },
  {
    id: "2",
    name: "Missing Component",
    description: "Required component not present",
    category: "Assembly",
    severity: "critical"
  },
  {
    id: "3",
    name: "Misalignment",
    description: "Component not properly aligned",
    category: "Assembly",
    severity: "medium"
  },
  {
    id: "4",
    name: "Discoloration",
    description: "Abnormal color or finish",
    category: "Surface",
    severity: "low"
  },
  {
    id: "5",
    name: "Dimensional Error",
    description: "Component dimensions outside of specification",
    category: "Measurement",
    severity: "high"
  }
];

const DefectReportDialog: React.FC<DefectReportDialogProps> = ({ isOpen, onClose, job }) => {
  const [activeTab, setActiveTab] = useState("manual");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDefectType, setSelectedDefectType] = useState<DefectType | null>(null);
  const [defectCount, setDefectCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter defect types based on search
  const filteredDefectTypes = mockDefectTypes.filter(type => 
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleSelectDefectType = (defectType: DefectType) => {
    setSelectedDefectType(defectType);
  };
  
  const handleStartScan = () => {
    setIsScanning(true);
    
    // Simulate barcode scanning
    setTimeout(() => {
      const mockBarcode = "DEF-" + Math.floor(1000 + Math.random() * 9000);
      setBarcodeValue(mockBarcode);
      setIsScanning(false);
      
      // Simulate finding a defect based on barcode
      const randomDefect = mockDefectTypes[Math.floor(Math.random() * mockDefectTypes.length)];
      setSelectedDefectType(randomDefect);
      
      toast.success(`Scanned defect: ${randomDefect.name}`);
    }, 1500);
  };
  
  const handleImageUpload = () => {
    // Simulate image upload
    const newImage = "https://placehold.co/300x200/png";
    setUploadedImages([...uploadedImages, newImage]);
    toast.success("Image uploaded successfully");
  };
  
  const handleSubmitDefect = () => {
    if (!selectedDefectType) {
      toast.error("Please select a defect type");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success(`Defect reported: ${selectedDefectType.name} (${defectCount})`);
      setIsSubmitting(false);
      setSelectedDefectType(null);
      setDefectCount(1);
      setNotes("");
      setBarcodeValue("");
      setUploadedImages([]);
      onClose();
    }, 1000);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Report Defect</DialogTitle>
          <DialogDescription>
            Job #{job.contractNumber} - {job.customerName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="barcode">Barcode Scan</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="defectSearch">Search Defect Type</Label>
                <Input
                  id="defectSearch"
                  placeholder="Type to search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="border rounded-md max-h-[200px] overflow-y-auto">
                {filteredDefectTypes.length > 0 ? (
                  filteredDefectTypes.map((defectType) => (
                    <div
                      key={defectType.id}
                      className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${
                        selectedDefectType?.id === defectType.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => handleSelectDefectType(defectType)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{defectType.name}</div>
                          <div className="text-sm text-muted-foreground">{defectType.description}</div>
                        </div>
                        <div className="flex items-center">
                          {defectType.severity === 'critical' && (
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                            {defectType.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No defect types match your search
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="barcode" className="space-y-4 py-2">
              <div className="border rounded-md p-4 flex flex-col items-center justify-center min-h-[150px]">
                {isScanning ? (
                  <div className="text-center">
                    <div className="mb-2">
                      <ScanLine className="h-10 w-10 text-muted-foreground animate-pulse mx-auto" />
                    </div>
                    <p className="text-muted-foreground">Scanning...</p>
                  </div>
                ) : barcodeValue ? (
                  <div className="text-center">
                    <div className="mb-2">
                      <ScanLine className="h-8 w-8 text-primary mx-auto" />
                    </div>
                    <p className="font-mono font-bold text-lg">{barcodeValue}</p>
                    {selectedDefectType && (
                      <div className="mt-2 bg-muted/50 p-2 rounded">
                        <p className="font-medium">{selectedDefectType.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedDefectType.description}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <Button onClick={handleStartScan} className="gap-1">
                      <ScanLine className="h-4 w-4" />
                      Start Scanning
                    </Button>
                    <p className="text-xs mt-2 text-muted-foreground">
                      Position barcode in the scanner view
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          {selectedDefectType && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="defectType">Defect Type</Label>
                  <div id="defectType" className="p-2 bg-muted/50 rounded text-sm">
                    {selectedDefectType.name}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="defectCount">Count</Label>
                  <Input
                    type="number"
                    id="defectCount"
                    min={1}
                    value={defectCount}
                    onChange={(e) => setDefectCount(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add details about the defect..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Images</Label>
                <div className="flex flex-wrap gap-2">
                  {uploadedImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Defect image ${idx + 1}`}
                      className="h-20 w-auto rounded border"
                    />
                  ))}
                  
                  <Button
                    variant="outline"
                    className="h-20 w-24 flex flex-col gap-1"
                    onClick={handleImageUpload}
                  >
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-xs">Add Image</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 w-24 flex flex-col gap-1"
                    onClick={handleImageUpload}
                  >
                    <Camera className="h-6 w-6" />
                    <span className="text-xs">Take Photo</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDefect}
              disabled={!selectedDefectType || isSubmitting}
              className="gap-1"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Submitting..." : "Report Defect"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DefectReportDialog;
