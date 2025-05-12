import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Camera, FileImage, ImagePlus, Loader2, Upload, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DefectReportingFormProps {
  jobId: string;
  jobTitle: string;
}

interface DefectType {
  id: string;
  name: string;
  description: string;
}

// Sample defect types - in production these would come from the database
const DEFECT_TYPES: DefectType[] = [
  { id: '1', name: 'Surface Scratch', description: 'Visible scratch on component surface' },
  { id: '2', name: 'Missing Component', description: 'Required component not present' },
  { id: '3', name: 'Misalignment', description: 'Component not properly aligned' },
  { id: '4', name: 'Discoloration', description: 'Abnormal color or finish' },
  { id: '5', name: 'Dimensional Error', description: 'Component dimensions outside of specification' },
];

const DefectReportingForm: React.FC<DefectReportingFormProps> = ({ jobId, jobTitle }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Form fields
  const [defectType, setDefectType] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'minor' | 'major' | 'critical'>('minor');
  const [batchNumber, setBatchNumber] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState('');
  
  // Form validation
  const [errors, setErrors] = useState({
    defectType: false,
    description: false,
    severity: false,
  });
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const newImages = Array.from(files);
    setImages([...images, ...newImages]);
    
    // Create URLs for previewing the images
    const newImageUrls = newImages.map(file => URL.createObjectURL(file));
    setImageUrls([...imageUrls, ...newImageUrls]);
  };
  
  const handleCameraCapture = async () => {
    setCameraActive(true);
    
    try {
      // This would be replaced with actual camera integration
      // For now, we'll simulate by opening the file picker dialog
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: 'Camera Error',
        description: 'Could not access the device camera.',
        variant: 'destructive',
      });
    } finally {
      setCameraActive(false);
    }
  };
  
  const removeImage = (index: number) => {
    const newImages = [...images];
    const newImageUrls = [...imageUrls];
    
    // Release object URL to avoid memory leaks
    URL.revokeObjectURL(newImageUrls[index]);
    
    newImages.splice(index, 1);
    newImageUrls.splice(index, 1);
    
    setImages(newImages);
    setImageUrls(newImageUrls);
  };
  
  const validateForm = (): boolean => {
    const newErrors = {
      defectType: !defectType,
      description: !description,
      severity: !severity,
    };
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error);
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to report defects.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // 1. Upload images to storage if there are any
      const imageUrls: string[] = [];
      
      if (images.length > 0) {
        for (const image of images) {
          const filename = `${Date.now()}_${image.name.replace(/\s+/g, '_')}`;
          const filepath = `defects/${jobId}/${filename}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('defect-images')
            .upload(filepath, image);
          
          if (uploadError) {
            throw uploadError;
          }
          
          // Get the public URL
          const { data: publicUrlData } = supabase.storage
            .from('defect-images')
            .getPublicUrl(filepath);
          
          imageUrls.push(publicUrlData.publicUrl);
        }
      }
      
      // 2. Create the defect record
      const { data: defectData, error: defectError } = await supabase
        .from('defects')
        .insert({
          job_id: jobId,
          defect_type_id: defectType,
          description: description,
          severity: severity,
          batch_number: batchNumber || null,
          lot_number: lotNumber || null,
          quantity: quantity,
          location: location || null,
          images: imageUrls.length > 0 ? imageUrls : null,
          reported_by: user.id,
          reported_at: new Date().toISOString(),
          status: 'open',
        })
        .select()
        .single();
      
      if (defectError) {
        throw defectError;
      }
      
      setSubmissionStatus('success');
      toast({
        title: 'Defect Reported',
        description: 'The defect has been successfully reported.',
      });
      
      // Reset the form
      setDefectType('');
      setDescription('');
      setSeverity('minor');
      setBatchNumber('');
      setLotNumber('');
      setQuantity(1);
      setLocation('');
      setImages([]);
      
      // Clean up image URLs
      imageUrls.forEach(url => URL.revokeObjectURL(url));
      setImageUrls([]);
      
    } catch (error) {
      console.error('Error reporting defect:', error);
      setSubmissionStatus('error');
      toast({
        title: 'Error',
        description: 'Failed to report defect. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
          Report Defect
        </CardTitle>
        <CardDescription>
          Job #{jobId} - {jobTitle}
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mx-6">
          <TabsTrigger value="details">Defect Details</TabsTrigger>
          <TabsTrigger value="images">Images ({images.length})</TabsTrigger>
        </TabsList>
        
        <CardContent className="p-6">
          <TabsContent value="details" className="mt-0 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="defectType" className="text-sm font-medium">
                Defect Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={defectType}
                onValueChange={setDefectType}
              >
                <SelectTrigger id="defectType" className={errors.defectType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select defect type" />
                </SelectTrigger>
                <SelectContent>
                  {DEFECT_TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.defectType && (
                <p className="text-xs text-red-500">Defect type is required</p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="severity" className="text-sm font-medium">
                Severity <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={severity}
                onValueChange={(value) => setSeverity(value as 'minor' | 'major' | 'critical')}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="minor" id="severity-minor" />
                  <Label htmlFor="severity-minor" className="cursor-pointer">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Minor
                    </Badge>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="major" id="severity-major" />
                  <Label htmlFor="severity-major" className="cursor-pointer">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      Major
                    </Badge>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="critical" id="severity-critical" />
                  <Label htmlFor="severity-critical" className="cursor-pointer">
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Critical
                    </Badge>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the defect in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`min-h-[100px] ${errors.description ? 'border-red-500' : ''}`}
              />
              {errors.description && (
                <p className="text-xs text-red-500">Description is required</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="batchNumber" className="text-sm font-medium">
                  Batch Number
                </Label>
                <Input
                  id="batchNumber"
                  placeholder="Enter batch number"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="lotNumber" className="text-sm font-medium">
                  Lot Number
                </Label>
                <Input
                  id="lotNumber"
                  placeholder="Enter lot number"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="quantity" className="text-sm font-medium">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-sm font-medium">
                  Specific Location
                </Label>
                <Input
                  id="location"
                  placeholder="Where on the part/component?"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="images" className="mt-0">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative border rounded-md overflow-hidden w-24 h-24"
                  >
                    <img
                      src={url}
                      alt={`Defect ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {imageUrls.length === 0 && (
                  <div className="w-full text-center py-8 border rounded-md border-dashed">
                    <FileImage className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No images added yet</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Images
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCameraCapture}
                  disabled={cameraActive}
                >
                  {cameraActive ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="mr-2 h-4 w-4" />
                  )}
                  Take Photo
                </Button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <Button variant="ghost" onClick={() => setActiveTab(activeTab === 'details' ? 'images' : 'details')}>
          {activeTab === 'details' ? 'Next: Add Images' : 'Back to Details'}
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Defect Report'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DefectReportingForm; 