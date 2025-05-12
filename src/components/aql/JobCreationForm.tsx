import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  PlusCircle, 
  Trash2, 
  MapPin, 
  FileText, 
  Video, 
  FileImage,
  Clock,
  Info,
  Users,
  Paperclip,
  Search,
  AlertTriangle,
  Sparkles,
  UserCircle,
  Loader2,
  Hash,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Loader
} from "lucide-react";
import JobLocationMap from './jobs/JobLocationMap';
import PreviousJobSelector from './jobs/PreviousJobSelector';
import { fetchCustomerJobs } from '@/services/jobService'; 
import { createJob, generateCertificationQuestions } from '@/services/aqlService';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  getInspectorsByLocation, 
  Inspector as ImportedInspector, 
  Location, 
  getLocationsOrdered,
  getNextJobSequence,
  generateJobNumber,
  incrementJobSequence,
  formatLocationDisplay,
  createOrUpdateJobDraft,
  getJobDraft,
  getUserJobDrafts,
  finalizeJobDraft
} from '@/services/supabaseService';
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/lib/supabase';
import { Job, JobStatus } from '@/types/aql';

// Define a type for the part information
interface Part {
  partNumber: string;
  partName: string;
  defectDescription: string;
}

// Define a type for safety requirements
interface SafetyRequirement {
  id: string;
  label: string;
  checked: boolean;
}

// Define a type for attachments
interface Attachment {
  type: 'sop' | 'defect' | 'other';
  name: string;
  size: string;
  url: string;
  content?: string;
}

// Define a comprehensive type for the entire job form data
interface JobFormData {
  // Basic Info tab
  contractNumber: string;
  job_number: string;
  serviceStartDate: string;
  aqlContact: string;
  estimatedHours: number;
  
  // Customer Information
  customerName: string;
  customerContact: string;
  customerAddress: string;
  customerPhone: string;
  customerCity: string;
  customerCellPhone: string;
  customerState: string;
  customerEmail: string;
  
  // Job Details tab
  requiredService: string;
  additionalCharges: string;
  authorizationType: string;
  reportingRequested: string;
  parts: Part[];
  batchProcessing: boolean;
  batchSize: number;
  timeStudy: number;
  cleanPointFrequency: string;
  cleanPointInstructions: string;
  
  // Location tab
  jobLocation: string;
  location_id: string;
  jobLocationContact: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  locationNumber: string;
  geoRadius: number;
  
  // Requirements tab
  safetyRequirements: SafetyRequirement[];
  customSafety: string;
  jobDetails: string;
  defectGuidelines: string;
  
  // Work Instructions tab
  instructions: string;
  isGeneratingInstructions: boolean;
  generationError: string | null;
  
  // Emergency tab
  emergencyEvacuationProcedures: string;
  emergencyEvacuationImage: string | null;
  
  // Inspector Assignment
  inspectorId: string;
  inspector_ids: string[]; // Array of inspector IDs
  supervisor_ids: string[]; // Array of supervisor IDs
  
  // Attachments (across tabs)
  attachments: Attachment[];
  
  // Service Limits
  qtyNumberOfParts: number;
  timeInHours: number;
  cost: number;
  
  // Certification Questions
  certificationQuestions?: any[];
}

// Add the proper Inspector interface at the top of the file, ensure Supervisor type is defined
interface Inspector {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  location_id?: string;
  role?: string;
  is_available?: boolean;
}

// Add Supervisor as an alias of Inspector type 
type Supervisor = Inspector;

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  is_available: boolean;
}

interface InspectorLocation {
  user_id: string;
  profiles: Profile;
}

const JobCreationForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("basic");
  const [usePreviousJob, setUsePreviousJob] = useState(false);
  const [previousJobs, setPreviousJobs] = useState<any[]>([]);
  const [selectedPreviousJob, setSelectedPreviousJob] = useState<string | null>(null);
  
  // Add states for inspectors, supervisors and locations
  const [availableInspectors, setAvailableInspectors] = useState<Inspector[]>([]);
  const [availableSupervisors, setAvailableSupervisors] = useState<Supervisor[]>([]);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [loadingInspectors, setLoadingInspectors] = useState(false);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  
  // State for draft job management
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [userDrafts, setUserDrafts] = useState<any[]>([]);
  const [showDraftSelector, setShowDraftSelector] = useState(false);
  
  // Create a reference to initial form state for reset
  const initialJobFormData: JobFormData = {
    // Basic Info tab
    contractNumber: "16-0013893-1",
    job_number: "",
    serviceStartDate: "",
    aqlContact: "",
    estimatedHours: 8,
    
    // Customer Information
    customerName: "",
    customerContact: "",
    customerAddress: "",
    customerPhone: "",
    customerCity: "",
    customerCellPhone: "",
    customerState: "",
    customerEmail: "",
    
    // Job Details tab
    requiredService: "",
    additionalCharges: "",
    authorizationType: "",
    reportingRequested: "",
    parts: [{ partNumber: '', partName: '', defectDescription: '' }],
    batchProcessing: false,
    batchSize: 100,
    timeStudy: 2.5,
    cleanPointFrequency: "",
    cleanPointInstructions: "",
    
    // Location tab
    jobLocation: "",
    location_id: "",
    jobLocationContact: "",
    location: {
    latitude: 42.331427, 
    longitude: -83.045754,
    address: "Detroit, MI 48226" 
    },
    locationNumber: "",
    geoRadius: 100,
    
    // Requirements tab
    safetyRequirements: [
    { id: "safety-1", label: "Safety Glasses", checked: false },
    { id: "safety-2", label: "Steel Toe Boots", checked: false },
    { id: "safety-3", label: "Hard Hat", checked: false },
    { id: "safety-4", label: "Hi-Vis Vest", checked: false },
    { id: "safety-5", label: "Gloves", checked: false },
    { id: "safety-6", label: "Ear Protection", checked: false }
    ],
    customSafety: "",
    jobDetails: "",
    defectGuidelines: "",
    
    // Work Instructions tab
    instructions: "",
    isGeneratingInstructions: false,
    generationError: null,
    
    // Emergency tab
    emergencyEvacuationProcedures: "",
    emergencyEvacuationImage: null,
    
    // Inspector Assignment
    inspectorId: "",
    inspector_ids: [], // Initialize as empty array
    supervisor_ids: [], // Initialize as empty array
    
    // Attachments (across tabs)
    attachments: [],
    
    // Service Limits
    qtyNumberOfParts: 1000,
    timeInHours: 8,
    cost: 480
  };
  
  // Create a centralized form state
  const [jobFormData, setJobFormData] = useState<JobFormData>(initialJobFormData);
  
  // See if we have a draft ID in the URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const draftId = params.get('draft');
    
    if (draftId) {
      // Load this specific draft
      loadDraftJob(draftId);
    } else {
      // Load user drafts to show them later
      loadUserDrafts();
    }
  }, [location]);
  
  // Load all drafts for the current user
  const loadUserDrafts = async () => {
    try {
      const drafts = await getUserJobDrafts();
      setUserDrafts(drafts);
      
      // If we have drafts and no current draft is loaded, show the draft selector
      if (drafts.length > 0 && !currentDraftId) {
        setShowDraftSelector(true);
      }
    } catch (error) {
      console.error("Error loading user drafts:", error);
    }
  };
  
  // Load a specific draft job
  const loadDraftJob = async (draftId: string) => {
    try {
      setLoading(true);
      const draft = await getJobDraft(draftId);
      
      if (draft) {
        console.log("Loaded draft job:", draft);
        toast.success("Loaded your draft job");
        
        // Update current draft ID
        setCurrentDraftId(draft.id);
        
        // Set the current tab from the saved state
        if (draft.current_tab) {
          setCurrentTab(draft.current_tab);
        }
        
        // Restore form data
        if (draft.form_data) {
          setJobFormData(draft.form_data);
        }
        
        // If the draft has a location_id, fetch inspectors for that location
        if (draft.location_id) {
          fetchInspectorsForLocation(draft.location_id);
        }
      } else {
        toast.error("Could not find the specified draft job");
      }
    } catch (error) {
      console.error("Error loading draft job:", error);
      toast.error("Error loading draft job");
    } finally {
      setLoading(false);
    }
  };
  
  // Autosave whenever the tab changes
  useEffect(() => {
    // Don't save on the initial load
    if (currentTab !== "basic" || currentDraftId) {
      saveDraftJob();
    }
  }, [currentTab]);
  
  // Debounced autosave for form changes
  const debouncedSave = useCallback(
    // Debounce the save operation by 2 seconds
    function() {
      let timeout: NodeJS.Timeout;
      
      return function(func: Function, wait: number) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(), wait);
      };
    }(),
    []
  );
  
  // Set up the debounced save on form data changes
  useEffect(() => {
    if (currentDraftId || jobFormData.customerName || jobFormData.parts.some(p => p.partNumber || p.partName)) {
      const timeoutId = setTimeout(() => {
        saveDraftJob();
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [jobFormData]);
  
  // Function to save the current form state as a draft
  const saveDraftJob = async () => {
    // Don't save if nothing substantial has been entered
    const hasContent = jobFormData.customerName || 
                      jobFormData.parts.some(p => p.partNumber || p.partName) ||
                      jobFormData.location_id;
    
    if (!hasContent) {
      return;
    }
    
    try {
      setIsDraftSaving(true);
      
      const draftData = {
        id: currentDraftId || undefined,
        title: jobFormData.customerName 
               ? `Job for ${jobFormData.customerName}` 
               : 'New Job Draft',
        customer: {
          name: jobFormData.customerName || 'New Customer',
          email: jobFormData.customerEmail || '',
          phone: jobFormData.customerPhone || '',
          address: jobFormData.customerAddress || '',
        },
        status: 'draft' as const,
        location_id: jobFormData.location_id || undefined,
        inspector_id: jobFormData.inspectorId || undefined,
        form_data: jobFormData,
        current_tab: currentTab
      };
      
      const savedJob = await createOrUpdateJobDraft(draftData);
      
      // Update the current draft ID if this is a new draft
      if (!currentDraftId) {
        setCurrentDraftId(savedJob.id);
        
        // Update URL with the draft ID without navigation
        const url = new URL(window.location.href);
        url.searchParams.set('draft', savedJob.id);
        window.history.replaceState({}, '', url.toString());
      }
      
      setLastSavedTime(new Date());
      console.log("Saved draft job:", savedJob);
    } catch (error) {
      console.error("Error saving draft job:", error);
    } finally {
      setIsDraftSaving(false);
    }
  };
  
  // Generic handler for field changes
  const handleFieldChange = (field: keyof JobFormData, value: any) => {
    setJobFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // More complex handlers for nested fields
  const handleNestedFieldChange = (parent: keyof JobFormData, field: string, value: any) => {
    setJobFormData(prev => {
      // Ensure prev[parent] is an object before spreading it
      const parentValue = prev[parent] || {};
      if (typeof parentValue === 'object' && parentValue !== null) {
        return {
          ...prev,
          [parent]: { ...parentValue, [field]: value }
        };
      }
      // If not an object, just return the previous state
      return prev;
    });
  };

  useEffect(() => {
    const fetchPreviousJobs = async () => {
      try {
        const jobs = await fetchCustomerJobs('cust001'); // Mock customer ID
        setPreviousJobs(jobs);
      } catch (error) {
        console.error("Failed to fetch previous jobs:", error);
      }
    };

    fetchPreviousJobs();
  }, []);

  // Updated handlers for parts
  const handleAddPart = () => {
    const newParts = [...jobFormData.parts, { partNumber: '', partName: '', defectDescription: '' }];
    handleFieldChange('parts', newParts);
  };

  const handleRemovePart = (index: number) => {
    const newParts = [...jobFormData.parts];
    newParts.splice(index, 1);
    handleFieldChange('parts', newParts);
  };

  const handlePartChange = (index: number, field: keyof Part, value: string) => {
    const newParts = [...jobFormData.parts];
    newParts[index] = { ...newParts[index], [field]: value };
    handleFieldChange('parts', newParts);
  };

  // Updated handler for safety requirements
  const handleSafetyRequirementChange = (id: string, checked: boolean) => {
    const updatedSafetyRequirements = jobFormData.safetyRequirements.map(req => 
        req.id === id ? { ...req, checked } : req
    );
    handleFieldChange('safetyRequirements', updatedSafetyRequirements);
  };

  // Updated handler for location
  const handleLocationUpdate = (newLocation: { latitude: number; longitude: number; address: string }) => {
    handleNestedFieldChange('location', 'latitude', newLocation.latitude);
    handleNestedFieldChange('location', 'longitude', newLocation.longitude);
    handleNestedFieldChange('location', 'address', newLocation.address);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleNestedFieldChange('location', 'address', e.target.value);
  };

  const handleUpdateMapFromAddress = () => {
    // This would typically call a geocoding service
    // For demo purposes, we'll just set a default location
    toast.info("In a production environment, this would geocode the entered address.");
    
    handleNestedFieldChange('location', 'latitude', 42.331427);
    handleNestedFieldChange('location', 'longitude', -83.045754);
  };

  const handleAttachmentUpload = (type: 'sop' | 'defect' | 'other') => {
    // Use the existing file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      // Update the accept attribute based on type
      if (type === 'sop') {
        fileInput.accept = '.pdf,.doc,.docx';
      } else if (type === 'defect') {
        fileInput.accept = 'image/*';
      } else {
        fileInput.accept = '.pdf,.doc,.docx,image/*';
      }
      
      // Store the current type for the onChange handler
      fileInput.dataset.uploadType = type;
      
      // Trigger file selection
      fileInput.click();
    } else {
      // Fallback to creating a new file input if the main one is not found
      const tempFileInput = document.createElement('input');
      tempFileInput.type = 'file';
      tempFileInput.accept = '.pdf,.doc,.docx,image/*';
      tempFileInput.multiple = true;
      
      // Handle file selection
      tempFileInput.onchange = (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        
        // Process each file
        Promise.all(
          files.map((file) => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
      type,
                  name: file.name,
                  size: `${(file.size / 1024).toFixed(1)} KB`,
                  url: URL.createObjectURL(file),
                  content: reader.result as string, // base64 encoded content
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          })
        ).then((fileDataArray) => {
          // Update attachments in the centralized state
          const newAttachments = [...jobFormData.attachments, ...fileDataArray as any];
          handleFieldChange('attachments', newAttachments);
          
          toast.success(`${fileDataArray.length} file(s) have been uploaded successfully.`);
        }).catch(error => {
          console.error("Error uploading files:", error);
          toast.error("There was an error uploading your files.");
        });
      };
      
      // Trigger file selection
      tempFileInput.click();
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = [...jobFormData.attachments];
    newAttachments.splice(index, 1);
    handleFieldChange('attachments', newAttachments);
    
    toast.success("The file has been removed from your upload list.");
  };

  const handleEmergencyImageUpload = () => {
    handleFieldChange('emergencyEvacuationImage', '/placeholder.svg');
    toast.success("Emergency evacuation floor plan has been uploaded.");
  };

  const handlePreviousJobSelect = (jobId: string) => {
    setSelectedPreviousJob(jobId);
    toast.success(`Job #${jobId} data has been loaded as a template.`);
    
    // Update parts in the centralized state
    handleFieldChange('parts', [
      { partNumber: '7500287G88', partName: 'Front Seat Component', defectDescription: 'Surface scratches' },
      { partNumber: '7500287G89', partName: 'Rear Seat Component', defectDescription: 'Missing hardware' }
    ]);
  };

  // Add a new function to generate work instructions using OpenAI
  const generateWorkInstructions = async () => {
    // Get the necessary information from the centralized state
    const { customerName, parts, jobDetails } = jobFormData;
    const partDetails = parts.map(part => part.partName).filter(Boolean).join(', ');
    
    if (!customerName || !jobDetails) {
      toast.error("Please provide customer name and job details before generating instructions.");
      return;
    }
    
    // Check if API key is configured
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file and restart the dev server.");
      toast.error("OpenAI API key is not configured. Please check console for details.");
      handleFieldChange('generationError', "API key not configured. Please set VITE_OPENAI_API_KEY in .env and restart the server.");
      return;
    }
    
    handleFieldChange('isGeneratingInstructions', true);
    handleFieldChange('generationError', null);
    
    try {
      // Prepare the prompt for OpenAI
      const prompt = `Generate detailed work instructions for a quality inspection job with the following details:
Customer: ${customerName}
Parts: ${partDetails || 'Not specified'}
Job Description: ${jobDetails}`;
      
      // Create the request payload
      const payload = {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a manufacturing work instruction generator. Write step-by-step, clear, concise instructions for a quality inspection team based on the provided job details.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      };
      
      // Log the data being sent to OpenAI for debugging
      console.log('Sending data to OpenAI:', {
        customerName,
        partDetails,
        jobDetails,
        prompt,
        apiKeyExists: !!apiKey,
        payload
      });
      
      // Call the OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API call failed with status: ${response.status}`, errorText);
        throw new Error(`API call failed with status: ${response.status}. ${errorText}`);
      }
      
      // Try to parse the response as JSON, with error handling
      let data;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("Failed to parse response as JSON:", responseText);
        throw new Error(`Failed to parse response as JSON: ${jsonError.message}`);
      }
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Unexpected response format from OpenAI API");
      }
      
      const generatedInstructions = data.choices[0].message.content;
      
      // Set the generated instructions in the state
      handleFieldChange('instructions', generatedInstructions);
      
      // Move to the work instructions tab
      setCurrentTab('workInstructions');
      
      toast.success("Work instructions have been generated successfully. Please review and edit if needed.");
    } catch (error) {
      console.error("Error generating work instructions:", error);
      handleFieldChange('generationError', error.message || "Could not generate instructions. Please try again or enter them manually.");
      toast.error(error.message || "Could not generate instructions. Please try again or enter them manually.");
    } finally {
      handleFieldChange('isGeneratingInstructions', false);
    }
  };

  // Fetch available locations
  const fetchAvailableLocations = async () => {
    console.log('Starting to fetch available locations...');
    setLoadingLocations(true);
    try {
      console.log('Calling getLocationsOrdered from supabaseService...');
      const locations = await getLocationsOrdered();
      console.log('Received locations from getLocationsOrdered:', locations);
      
      if (locations && locations.length > 0) {
        console.log(`Setting ${locations.length} locations in JobCreationForm state.`);
        setAvailableLocations(locations);
      } else {
        console.warn('No locations received from getLocationsOrdered');
        toast.error("No locations available in the database. Please contact an administrator.");
        // Fallback to empty array, don't use mock data in production
        setAvailableLocations([]);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Could not fetch locations from the database. Please try again later.");
      // Don't use fallback mock data in production
      setAvailableLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };
  
  // Fetch inspectors for a specific location
  const fetchInspectorsForLocation = async (locationId: string) => {
    if (!locationId) {
      console.warn('No location ID provided for fetching inspectors');
      setAvailableInspectors([]);
      return;
    }

    setLoadingInspectors(true);
    try {
      // First verify the location exists
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('id, name')
        .eq('id', locationId)
        .single();

      if (locationError || !location) {
        console.error('Error verifying location:', locationError);
        toast.error('Invalid location selected');
        setAvailableInspectors([]);
        return;
      }

      // Fetch inspectors assigned to this location using the correct schema
      const { data: inspectorLocations, error: inspectorLocationsError } = await supabase
        .from('inspector_locations')
        .select(`
          inspector_id,
          profiles:inspector_id (
            id,
            name,
            email,
            role,
            is_available
          )
        `)
        .eq('location_id', locationId);

      if (inspectorLocationsError) {
        console.error('Error fetching inspector locations:', inspectorLocationsError);
        throw inspectorLocationsError;
      }

      // Transform the data to match our Inspector interface
      const inspectors = (inspectorLocations || [])
        .map(il => {
          const profile = il.profiles as unknown as Profile;
          if (!profile) return null;
          return {
            id: profile.id,
            user_id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            location_id: locationId,
            is_available: profile.is_available
          };
        })
        .filter(Boolean) as Inspector[];

      console.log(`Found ${inspectors.length} inspectors for location ${locationId}:`, inspectors);
      setAvailableInspectors(inspectors);
    } catch (error) {
      console.error('Error fetching inspectors:', error);
      toast.error('Failed to load inspectors for this location');
      setAvailableInspectors([]);
    } finally {
      setLoadingInspectors(false);
    }
  };
  
  // Load locations on component mount
  useEffect(() => {
    fetchAvailableLocations();
  }, []);

  // Handle location selection to load inspectors
  const handleLocationSelectionChange = async (locationId: string) => {
    // Get the selected location object
    const selectedLocation = availableLocations.find(loc => loc.id === locationId);
    
    // Update the form with the selected location and location_id
    handleFieldChange('jobLocation', selectedLocation?.name || '');
    handleFieldChange('location_id', locationId);
    
    // Debug information
    console.log(`Selected location: ${locationId}`);
    console.log('Available locations:', availableLocations);
    console.log('Selected location data:', selectedLocation);
    
    // Fetch inspectors and supervisors for this location
    fetchInspectorsForLocation(locationId);
    fetchSupervisorsForLocation(locationId);
    
    // Reset inspector and supervisor selections
    handleFieldChange('inspector_ids', []);
    handleFieldChange('inspectorId', '');
    handleFieldChange('supervisor_ids', []);
    
    // If we have a location number, generate a job number
    if (selectedLocation?.location_number) {
      try {
        // Get next sequence number for this location
        const locationNumber = selectedLocation.location_number;
        const nextSequence = await getNextJobSequence(locationNumber);
        
        // Generate job number (format: {location_number}-{sequence}-{revision})
        const revision = 1; // New jobs start at revision 1
        const jobNumber = generateJobNumber(locationNumber, nextSequence, revision);
        
        // Set the job number in the form
        handleFieldChange('job_number', jobNumber);
        console.log(`Generated job number: ${jobNumber}`);
        
        toast.success(`Generated job number: ${jobNumber}`);
      } catch (error) {
        console.error("Error generating job number:", error);
        toast.error("Could not generate job number. Using temporary value.");
        
        // Use a fallback job number
        const fallbackNumber = `${selectedLocation.location_number}-TEMP-1`;
        handleFieldChange('job_number', fallbackNumber);
      }
    }
  };

  // Reset the form to initial state
  const resetForm = () => {
    setJobFormData(initialJobFormData);
    setSelectedPreviousJob(null);
    setUsePreviousJob(false);
  };

  // Handle tab change with autosave
  const handleTabChange = (value: string) => {
    // Save the current state before changing tabs
    saveDraftJob();
    
    // Change to the new tab
    setCurrentTab(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        throw new Error('Authentication error: ' + authError.message);
      }
      if (!user) {
        throw new Error('Please sign in to create a job');
      }

      // Validate required fields
      if (!jobFormData.job_number || !jobFormData.customerName || !jobFormData.location_id) {
        toast.error("Please fill in all required fields");
        setLoading(false);
        return;
      }

      // Get location name
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('name')
        .eq('id', jobFormData.location_id)
        .single();

      if (locationError) {
        throw new Error('Error fetching location: ' + locationError.message);
      }
      if (!location) {
        throw new Error('Selected location not found');
      }

      // Prepare job data
      const jobData: Omit<Job, 'created_at' | 'updated_at'> = {
        title: `Job for ${jobFormData.customerName}`,
        job_number: jobFormData.job_number,
        location_id: jobFormData.location_id,
        inspector_ids: jobFormData.inspector_ids || [],
        supervisor_ids: jobFormData.supervisor_ids || [],
        status: 'draft', // Start as draft
        form_data: jobFormData,
        customer: {
          name: jobFormData.customerName,
          email: jobFormData.customerEmail,
          phone: jobFormData.customerPhone,
          address: jobFormData.customerAddress
        },
        location: {
          id: jobFormData.location_id,
          name: location.name
        }
      };

      // Create job using the standardized function
      const newJob = await createJob(jobData);

      // If we have a draft ID, delete it
      if (currentDraftId) {
        const { error: deleteError } = await supabase
          .from('jobs')
          .delete()
          .eq('id', currentDraftId);

        if (deleteError) {
          console.error('Error deleting draft:', deleteError);
          // Don't throw here, as the job was created successfully
        }
      }

      toast.success("Job created successfully");
      navigate('/aql');
    } catch (error) {
      console.error("Error creating job:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  // Fetch supervisors for a specific location
  const fetchSupervisorsForLocation = async (locationId: string) => {
    setLoadingSupervisors(true);
    try {
      // Call the RPC function we created
      const { data: supervisors, error } = await supabase.rpc('get_supervisors_by_location', {
        location_id_param: locationId
      });
      
      if (error) {
        console.error("Error fetching supervisors:", error);
        throw error;
      }
      
      if (supervisors && Array.isArray(supervisors)) {
        setAvailableSupervisors(supervisors);
      } else {
        // Fallback to mock data if no supervisors found
        setAvailableSupervisors([
          { id: "201", name: "Michael Brown", email: "michael@example.com", role: "supervisor", is_available: true },
          { id: "202", name: "Sarah Johnson", email: "sarah@example.com", role: "supervisor", is_available: true }
        ]);
      }
    } catch (error) {
      console.error("Error fetching supervisors:", error);
      toast.error("Could not fetch supervisors for this location. Using mock data instead.");
      // Fallback to mock data
      setAvailableSupervisors([
        { id: "201", name: "Michael Brown", email: "michael@example.com", role: "supervisor", is_available: true },
        { id: "202", name: "Sarah Johnson", email: "sarah@example.com", role: "supervisor", is_available: true }
      ]);
    } finally {
      setLoadingSupervisors(false);
    }
  };

  // Handle multi-inspector selection
  const handleInspectorSelection = (inspectorIds: string[]) => {
    // Set the array of inspector ids
    handleFieldChange('inspector_ids', inspectorIds);
    
    // If there's only one, use it as the primary inspector
    if (inspectorIds.length === 1) {
      handleFieldChange('inspectorId', inspectorIds[0]);
    } else if (inspectorIds.length > 1) {
      // Use the first one as primary if multiple selected
      handleFieldChange('inspectorId', inspectorIds[0]);
    } else {
      // Clear the primary inspector if none selected
      handleFieldChange('inspectorId', '');
    }
  };

  // Handle multi-supervisor selection
  const handleSupervisorSelection = (supervisorIds: string[]) => {
    handleFieldChange('supervisor_ids', supervisorIds);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">New Job Info Sheet</CardTitle>
        {currentDraftId && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              <Badge variant="outline" className="mr-2">DRAFT</Badge>
              {lastSavedTime && `Last saved: ${lastSavedTime.toLocaleTimeString()}`}
            </span>
            <div className="flex items-center">
              {isDraftSaving ? (
                <span className="flex items-center text-blue-500">
                  <Loader className="w-4 h-4 mr-1 animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center text-green-500">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Saved
                </span>
              )}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {showDraftSelector && userDrafts.length > 0 && !currentDraftId && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Resume your draft job
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              You have {userDrafts.length} draft job{userDrafts.length > 1 ? 's' : ''} in progress. 
              Would you like to continue working on one of them?
            </p>
            <div className="space-y-2">
              {userDrafts.slice(0, 3).map(draft => (
                <Button 
                  key={draft.id}
                  variant="outline"
                  className="w-full justify-between text-left"
                  onClick={() => loadDraftJob(draft.id)}
                >
                  <div>
                    <span className="font-medium">{draft.title || "Untitled Job"}</span>
                    <p className="text-xs text-muted-foreground">
                      Last updated: {new Date(draft.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              ))}
              {userDrafts.length > 3 && (
                <Button
                  variant="link"
                  className="text-xs w-full"
                  onClick={() => navigate('/drafts')}
                >
                  View all {userDrafts.length} drafts
                </Button>
              )}
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDraftSelector(false)}
              >
                Start new job instead
              </Button>
            </div>
          </div>
        )}

        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Job Details</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="workInstructions">Work Instructions</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox 
                id="use-previous" 
                checked={usePreviousJob} 
                onCheckedChange={(checked) => setUsePreviousJob(checked === true)}
              />
              <Label htmlFor="use-previous" className="font-medium">
                Auto-populate from previous job
              </Label>
            </div>
            
            {usePreviousJob && (
              <PreviousJobSelector
                jobs={previousJobs}
                selectedJobId={selectedPreviousJob}
                onSelectJob={handlePreviousJobSelect}
              />
            )}
          </div>

          <TabsContent value="basic">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="contractNumber">Contract #</Label>
                <Input 
                  id="contractNumber" 
                  value={jobFormData.contractNumber} 
                  onChange={(e) => handleFieldChange('contractNumber', e.target.value)} 
                  readOnly 
                  className="bg-gray-100" 
                />
              </div>
              <div>
                <Label htmlFor="job_number" className="flex items-center">
                  <Hash className="h-4 w-4 mr-1" />
                  Job Number
                </Label>
                <Input 
                  id="job_number" 
                  value={jobFormData.job_number} 
                  onChange={(e) => handleFieldChange('job_number', e.target.value)} 
                  readOnly 
                  className="bg-gray-100" 
                  placeholder="Select a location to generate"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: location-sequence-revision
                </p>
              </div>
              <div>
                <Label htmlFor="serviceStartDate">Service Start Date</Label>
                <Input 
                  id="serviceStartDate" 
                  type="date" 
                  value={jobFormData.serviceStartDate}
                  onChange={(e) => handleFieldChange('serviceStartDate', e.target.value)}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="aqlContact">AQL Contact</Label>
                <Input 
                  id="aqlContact" 
                  value={jobFormData.aqlContact}
                  onChange={(e) => handleFieldChange('aqlContact', e.target.value)}
                  placeholder="Harry J Rubenstein" 
                />
              </div>
              <div>
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input 
                  id="estimatedHours" 
                  type="number" 
                  value={jobFormData.estimatedHours || ''}
                  onChange={(e) => handleFieldChange('estimatedHours', parseInt(e.target.value) || 0)}
                  placeholder="8" 
                  min="1" 
                />
              </div>
            </div>

            <div className="border border-gray-200 rounded-md p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input 
                    id="customerName" 
                    value={jobFormData.customerName}
                    onChange={(e) => handleFieldChange('customerName', e.target.value)}
                    placeholder="Burgula OES" 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="customerContact">Customer Contact</Label>
                  <Input 
                    id="customerContact" 
                    value={jobFormData.customerContact}
                    onChange={(e) => handleFieldChange('customerContact', e.target.value)}
                    placeholder="Thomas Reynolds" 
                  />
                </div>
                <div>
                  <Label htmlFor="customerAddress">Address</Label>
                  <Input 
                    id="customerAddress" 
                    value={jobFormData.customerAddress}
                    onChange={(e) => handleFieldChange('customerAddress', e.target.value)}
                    placeholder="26555 Ivie Street" 
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Office Phone</Label>
                  <Input 
                    id="customerPhone" 
                    value={jobFormData.customerPhone}
                    onChange={(e) => handleFieldChange('customerPhone', e.target.value)}
                    placeholder="(248) 555-9182" 
                  />
                </div>
                <div>
                  <Label htmlFor="customerCity">City</Label>
                  <Input 
                    id="customerCity" 
                    value={jobFormData.customerCity}
                    onChange={(e) => handleFieldChange('customerCity', e.target.value)}
                    placeholder="Plymouth" 
                  />
                </div>
                <div>
                  <Label htmlFor="customerCellPhone">Cell Phone</Label>
                  <Input 
                    id="customerCellPhone" 
                    value={jobFormData.customerCellPhone}
                    onChange={(e) => handleFieldChange('customerCellPhone', e.target.value)}
                    placeholder="(313) 481-1441" 
                  />
                </div>
                <div>
                  <Label htmlFor="customerState">State/Province</Label>
                  <Input 
                    id="customerState" 
                    value={jobFormData.customerState}
                    onChange={(e) => handleFieldChange('customerState', e.target.value)}
                    placeholder="MI" 
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input 
                    id="customerEmail" 
                    type="email" 
                    value={jobFormData.customerEmail}
                    onChange={(e) => handleFieldChange('customerEmail', e.target.value)}
                    placeholder="treynolds@burgula.com" 
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details">
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  Job Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="requiredService">Required Service(s)</Label>
                    <Select 
                      value={jobFormData.requiredService}
                      onValueChange={(value) => handleFieldChange('requiredService', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="rework">Rework</SelectItem>
                        <SelectItem value="sorting">Sorting</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="additionalCharges">Additional Charges</Label>
                    <Select
                      value={jobFormData.additionalCharges}
                      onValueChange={(value) => handleFieldChange('additionalCharges', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="overtime">Overtime</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="authorizationType">Authorization Type</Label>
                    <Select
                      value={jobFormData.authorizationType}
                      onValueChange={(value) => handleFieldChange('authorizationType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="verbal">Verbal</SelectItem>
                        <SelectItem value="written">Written</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="reportingRequested">Reporting Requested</Label>
                    <Select
                      value={jobFormData.reportingRequested}
                      onValueChange={(value) => handleFieldChange('reportingRequested', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comprehensive">Comprehensive - All Data</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="summary">Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Paperclip className="w-5 h-5 mr-2" />
                    Part Number(s)
                  </h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAddPart}
                    className="flex items-center gap-1"
                  >
                    <PlusCircle className="h-4 w-4" /> Add Part
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border p-2 text-left w-12">#</th>
                        <th className="border p-2 text-left">Part Number</th>
                        <th className="border p-2 text-left">Part Name</th>
                        <th className="border p-2 text-left">Defect Description</th>
                        <th className="border p-2 text-left w-16">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobFormData.parts.map((part, index) => (
                        <tr key={index}>
                          <td className="border p-2">{index + 1}</td>
                          <td className="border p-2">
                            <Input 
                              value={part.partNumber}
                              onChange={(e) => handlePartChange(index, 'partNumber', e.target.value)}
                              placeholder="7500287G88"
                              className="text-sm"
                            />
                          </td>
                          <td className="border p-2">
                            <Input 
                              value={part.partName}
                              onChange={(e) => handlePartChange(index, 'partName', e.target.value)}
                              placeholder="Front seat component"
                              className="text-sm"
                            />
                          </td>
                          <td className="border p-2">
                            <Input 
                              value={part.defectDescription}
                              onChange={(e) => handlePartChange(index, 'defectDescription', e.target.value)}
                              placeholder="Improper fitment"
                              className="text-sm"
                            />
                          </td>
                          <td className="border p-2 text-center">
                            {jobFormData.parts.length > 1 && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemovePart(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-semibold mb-4">Processing Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="batchProcessing" 
                      checked={jobFormData.batchProcessing}
                      onCheckedChange={(checked) => handleFieldChange('batchProcessing', checked === true)}
                    />
                    <Label htmlFor="batchProcessing">Enable Batch Processing</Label>
                  </div>
                  <div>
                    <Label htmlFor="batchSize">Batch Size (if applicable)</Label>
                    <Input 
                      id="batchSize" 
                      type="number" 
                      value={jobFormData.batchSize || ''}
                      onChange={(e) => handleFieldChange('batchSize', parseInt(e.target.value) || 0)}
                      placeholder="100" 
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Enable batch processing for mass certification jobs. Leave unchecked for individual part inspection.
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Time Study & Clean Point Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timeStudy">Time Per Unit (minutes)</Label>
                    <Input 
                      id="timeStudy" 
                      type="number" 
                      step="0.1" 
                      value={jobFormData.timeStudy || ''}
                      onChange={(e) => handleFieldChange('timeStudy', parseFloat(e.target.value) || 0)}
                      placeholder="2.5" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="cleanPointFrequency">Clean Point Frequency</Label>
                    <Input 
                      id="cleanPointFrequency" 
                      value={jobFormData.cleanPointFrequency}
                      onChange={(e) => handleFieldChange('cleanPointFrequency', e.target.value)}
                      placeholder="Every 100 units" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="cleanPointInstructions">Clean Point Instructions</Label>
                    <Textarea 
                      id="cleanPointInstructions" 
                      value={jobFormData.cleanPointInstructions}
                      onChange={(e) => handleFieldChange('cleanPointInstructions', e.target.value)}
                      placeholder="Describe clean point verification process..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="location">
            <div className="border border-gray-200 rounded-md p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Job Location Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="jobLocation">Job Location</Label>
                  <Select 
                    value={jobFormData.location_id} 
                    onValueChange={handleLocationSelectionChange}
                  >
                    <SelectTrigger 
                      id="jobLocation" 
                      className={!jobFormData.location_id ? "text-muted-foreground" : ""}
                    >
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingLocations ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading...</span>
                        </div>
                      ) : availableLocations.length > 0 ? (
                        availableLocations.map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {formatLocationDisplay(location)}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-locations" disabled>
                          No locations available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {!jobFormData.location_id && (
                    <p className="text-sm text-amber-600 mt-1">Please select a location for proper inspector assignment</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="jobLocationContact">Job Location Contact</Label>
                  <Input 
                    id="jobLocationContact" 
                    value={jobFormData.jobLocationContact}
                    onChange={(e) => handleFieldChange('jobLocationContact', e.target.value)}
                    placeholder="Luis Garcia" 
                  />
                </div>
                <div className="relative">
                  <Label htmlFor="jobAddress">Address</Label>
                  <div className="flex">
                    <Input 
                      id="jobAddress" 
                      value={jobFormData.location.address}
                      onChange={handleAddressChange}
                      placeholder="26555 Ivie Street"
                      className="flex-grow"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleUpdateMapFromAddress}
                      className="ml-2 flex-shrink-0"
                      title="Update map from address"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="locationNumber">Location Number</Label>
                  <Input 
                    id="locationNumber" 
                    value={jobFormData.locationNumber}
                    onChange={(e) => handleFieldChange('locationNumber', e.target.value)}
                    placeholder="LOC-12345" 
                  />
                </div>
              </div>
              
              <div className="mt-4 mb-4 h-[300px] rounded-md overflow-hidden border border-gray-300" id="job-location-map">
                <JobLocationMap 
                  location={jobFormData.location}
                  onLocationUpdate={handleLocationUpdate}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input 
                    id="latitude" 
                    value={jobFormData.location.latitude} 
                    onChange={(e) => handleNestedFieldChange('location', 'latitude', parseFloat(e.target.value))}
                    type="number" 
                    step="0.000001"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input 
                    id="longitude" 
                    value={jobFormData.location.longitude} 
                    onChange={(e) => handleNestedFieldChange('location', 'longitude', parseFloat(e.target.value))}
                    type="number" 
                    step="0.000001"
                  />
                </div>
                <div>
                  <Label htmlFor="geoRadius">Geo-fence Radius (m)</Label>
                  <Input 
                    id="geoRadius" 
                    value={jobFormData.geoRadius || ''}
                    onChange={(e) => handleFieldChange('geoRadius', parseInt(e.target.value) || 0)}
                    placeholder="100" 
                    type="number" 
                  />
                </div>
              </div>
            </div>

            {/* Debug information for location data */}
            {jobFormData.location_id && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <p className="font-semibold">Debug: Location Selected</p>
                <p>Location ID: {jobFormData.location_id}</p>
                <p>Location Name: {jobFormData.jobLocation}</p>
                <p>This data will be used to filter available inspectors.</p>
              </div>
            )}

            {/* Add inspector/supervisor selection UI */}
            {jobFormData.location_id && (
              <div className="mt-6 border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <UserCircle className="w-5 h-5 mr-2" />
                  Assign Inspectors & Supervisors
                </h3>
                
                <div className="space-y-4">
                  {/* Supervisor Selection */}
                  <div>
                    <Label htmlFor="supervisor-selection" className="font-medium">
                      Supervisors for this Location
                    </Label>
                    <div className="mt-2">
                      {loadingSupervisors ? (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading supervisors...
                        </div>
                      ) : availableSupervisors.length > 0 ? (
                        <div className="space-y-2">
                          {availableSupervisors.map(supervisor => (
                            <div key={supervisor.id} className="flex items-start gap-2">
                              <Checkbox 
                                id={`supervisor-${supervisor.id}`}
                                checked={jobFormData.supervisor_ids.includes(supervisor.id)}
                                onCheckedChange={(checked) => {
                                  const newSupIds = checked
                                    ? [...jobFormData.supervisor_ids, supervisor.id]
                                    : jobFormData.supervisor_ids.filter(id => id !== supervisor.id);
                                  handleSupervisorSelection(newSupIds);
                                }}
                              />
                              <div>
                                <Label 
                                  htmlFor={`supervisor-${supervisor.id}`}
                                  className="font-medium cursor-pointer"
                                >
                                  {supervisor.name}
                                </Label>
                                <p className="text-sm text-gray-500">{supervisor.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-amber-600 text-sm p-2 bg-amber-50 rounded-md">
                          <AlertTriangle className="h-4 w-4 inline mr-1" />
                          No supervisors available for this location. Please assign supervisors to this location first.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Inspector Selection */}
                  <div className="pt-3 border-t border-gray-200">
                    <Label htmlFor="inspector-selection" className="font-medium">
                      Inspectors for this Location
                    </Label>
                    <div className="mt-2">
                      {loadingInspectors ? (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading inspectors...
                        </div>
                      ) : availableInspectors.length > 0 ? (
                        <div className="space-y-2">
                          {availableInspectors.map(inspector => (
                            <div key={inspector.id} className="flex items-start gap-2">
                              <Checkbox 
                                id={`inspector-${inspector.id}`}
                                checked={jobFormData.inspector_ids.includes(inspector.id)}
                                onCheckedChange={(checked) => {
                                  const newInspIds = checked
                                    ? [...jobFormData.inspector_ids, inspector.id]
                                    : jobFormData.inspector_ids.filter(id => id !== inspector.id);
                                  handleInspectorSelection(newInspIds);
                                }}
                              />
                              <div>
                                <Label 
                                  htmlFor={`inspector-${inspector.id}`}
                                  className="font-medium cursor-pointer"
                                >
                                  {inspector.name}
                                </Label>
                                <p className="text-sm text-gray-500">{inspector.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-amber-600 text-sm p-2 bg-amber-50 rounded-md">
                          <AlertTriangle className="h-4 w-4 inline mr-1" />
                          No inspectors available for this location. Please assign inspectors to this location first.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Summary of selected personnel */}
                  <div className="pt-3 border-t border-gray-200">
                    <h4 className="font-medium text-sm text-gray-600 mb-2">Assigned Personnel Summary:</h4>
                    <div className="flex flex-wrap gap-2">
                      {jobFormData.supervisor_ids.length > 0 ? (
                        jobFormData.supervisor_ids.map(supId => {
                          const sup = availableSupervisors.find(s => s.id === supId);
                          return sup ? (
                            <Badge key={supId} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              👨‍💼 {sup.name} (Supervisor)
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <span className="text-gray-500 text-sm">No supervisors assigned</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {jobFormData.inspector_ids.length > 0 ? (
                        jobFormData.inspector_ids.map(inspId => {
                          const insp = availableInspectors.find(i => i.id === inspId);
                          return insp ? (
                            <Badge key={inspId} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              👷 {insp.name} (Inspector)
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <span className="text-gray-500 text-sm">No inspectors assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="requirements">
            <div className="border border-gray-200 rounded-md p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4">Safety Requirements</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {jobFormData.safetyRequirements.map((req) => (
                  <div key={req.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={req.id} 
                      checked={req.checked}
                      onCheckedChange={(checked) => handleSafetyRequirementChange(req.id, checked === true)}
                    />
                    <Label htmlFor={req.id}>{req.label}</Label>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Label htmlFor="customSafety">Other Safety Requirements</Label>
                <Textarea 
                  id="customSafety" 
                  value={jobFormData.customSafety}
                  onChange={(e) => handleFieldChange('customSafety', e.target.value)}
                  placeholder="List any additional safety requirements..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-md p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Work Instructions
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="jobDetails">Instructions Summary</Label>
                  <Textarea 
                    id="jobDetails" 
                    value={jobFormData.jobDetails}
                    onChange={(e) => handleFieldChange('jobDetails', e.target.value)}
                    placeholder="Provide a summary of the work instructions..."
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => handleAttachmentUpload('sop')}
                    className="flex items-center gap-2"
                    >
                    <FileText className="h-4 w-4" /> Upload SOP Document
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => handleAttachmentUpload('sop')}
                    className="flex items-center gap-2"
                  >
                    <Video className="h-4 w-4" /> Upload Instruction Video
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-md p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileImage className="w-5 h-5 mr-2" />
                Defect Guidelines
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="defectGuidelines">Defect Guidelines Summary</Label>
                  <Textarea 
                    id="defectGuidelines" 
                    value={jobFormData.defectGuidelines}
                    onChange={(e) => handleFieldChange('defectGuidelines', e.target.value)}
                    placeholder="Describe what constitutes a defect and how to classify severity..."
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => handleAttachmentUpload('defect')}
                    className="flex items-center gap-2"
                  >
                    <FileImage className="h-4 w-4" /> Upload Defect Images
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => handleAttachmentUpload('defect')}
                    className="flex items-center gap-2"
                  >
                    <Video className="h-4 w-4" /> Upload Defect Videos
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-md p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Paperclip className="w-5 h-5 mr-2" />
                Attachments
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 border border-dashed rounded-md p-4">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Paperclip className="h-8 w-8 text-gray-400" />
                    <div className="text-sm text-center">
                      <p className="font-medium text-gray-700">
                        Upload Job Documentation
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        PDF, DOC, DOCX, JPG, PNG (max. 5MB per file)
                      </p>
                      </div>
                    
                    <div className="mt-2 flex flex-col items-center">
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        accept=".pdf,.doc,.docx,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            // Get the file input and its type (from data attribute or default to 'other')
                            const fileInput = e.target as HTMLInputElement;
                            const type = (fileInput.dataset.uploadType as 'sop' | 'defect' | 'other') || 'other';
                            
                            // Process each file
                            Promise.all(
                              files.map((file) => {
                                return new Promise((resolve, reject) => {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    resolve({
                                      type,
                                      name: file.name,
                                      size: `${(file.size / 1024).toFixed(1)} KB`,
                                      url: URL.createObjectURL(file),
                                      content: reader.result as string, // base64 encoded content
                                    });
                                  };
                                  reader.onerror = reject;
                                  reader.readAsDataURL(file);
                                });
                              })
                            ).then((fileDataArray) => {
                              // Update attachments in the centralized state
                              const newAttachments = [...jobFormData.attachments, ...fileDataArray as any];
                              handleFieldChange('attachments', newAttachments);
                              
                              toast.success(`${fileDataArray.length} file(s) have been uploaded successfully.`);
                            }).catch(error => {
                              console.error("Error uploading files:", error);
                              toast.error("There was an error uploading your files.");
                            });
                          }
                        }}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Button 
                          type="button"
                          variant="outline"
                          className="mt-2"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          Select Files
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>
                
                {jobFormData.attachments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Uploaded Files ({jobFormData.attachments.length})</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto p-2">
                      {jobFormData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                          <div className="flex items-center overflow-hidden">
                            {file.content && file.content.startsWith('data:image/') ? (
                              <div className="h-12 w-12 mr-3 flex-shrink-0 bg-gray-100 border rounded overflow-hidden">
                                <img 
                                  src={file.content} 
                                  alt={file.name} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <FileText className="h-10 w-10 mr-3 text-blue-500" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{file.size}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveAttachment(index)}
                          >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                        </div>
                  ))}
                    </div>
              </div>
            )}
              </div>
            </div>
            
            <div className="border border-red-100 rounded-md p-4 bg-red-50 mt-6">
              <h3 className="text-lg font-semibold mb-4 text-red-600">Service Limits</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="qtyNumberOfParts">Qty (Number of parts)</Label>
                  <Input 
                    id="qtyNumberOfParts" 
                    type="number" 
                    value={jobFormData.qtyNumberOfParts || ''}
                    onChange={(e) => handleFieldChange('qtyNumberOfParts', parseInt(e.target.value) || 0)}
                    placeholder="1000" 
                  />
                </div>
                <div>
                  <Label htmlFor="timeInHours">Time (in hours)</Label>
                  <Input 
                    id="timeInHours" 
                    type="number" 
                    value={jobFormData.timeInHours || ''}
                    onChange={(e) => handleFieldChange('timeInHours', parseInt(e.target.value) || 0)}
                    placeholder="8" 
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Cost (dollars)</Label>
                  <Input 
                    id="cost" 
                    type="number" 
                    value={jobFormData.cost || ''}
                    onChange={(e) => handleFieldChange('cost', parseInt(e.target.value) || 0)}
                    placeholder="480" 
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="workInstructions">
            <div className="border border-gray-200 rounded-md p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                AI-Generated Work Instructions
              </h3>
              
              {!jobFormData.instructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    Generate detailed work instructions for the quality inspection team using AI. 
                    These instructions will be based on the job details you've provided.
                  </p>
                  
                  <div className="mt-4">
                    <Button 
                      onClick={generateWorkInstructions}
                      disabled={jobFormData.isGeneratingInstructions}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <Sparkles className="h-4 w-4" />
                      {jobFormData.isGeneratingInstructions ? "Generating..." : "Generate Instructions"}
                    </Button>
                  </div>
                </div>
              )}
              
              {jobFormData.generationError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-sm text-red-700 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {jobFormData.generationError}
                  </p>
                </div>
              )}
              
              <div>
                <Label htmlFor="workInstructions">Work Instructions</Label>
                <Textarea 
                  id="workInstructions" 
                  value={jobFormData.instructions}
                  onChange={(e) => handleFieldChange('instructions', e.target.value)}
                  placeholder="Detailed work instructions will appear here after generation, or you can enter them manually..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
              
              {jobFormData.instructions && (
                <div className="mt-4 flex justify-end">
                  <Button 
                    onClick={generateWorkInstructions}
                    disabled={jobFormData.isGeneratingInstructions}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {jobFormData.isGeneratingInstructions ? "Regenerating..." : "Regenerate Instructions"}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="emergency">
            <div className="border border-amber-200 bg-amber-50 rounded-md p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-amber-700">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Emergency Evacuation Procedures
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="evacuationProcedures" className="font-medium">
                    Written Procedures
                  </Label>
                  <Textarea 
                    id="evacuationProcedures" 
                    value={jobFormData.emergencyEvacuationProcedures}
                    onChange={(e) => handleFieldChange('emergencyEvacuationProcedures', e.target.value)}
                    placeholder="Provide detailed emergency evacuation procedures for this job location..." 
                    className="min-h-[150px]"
                  />
                </div>

                <div>
                  <Label className="font-medium">
                    Evacuation Floor Plan (Optional)
                  </Label>

                  {jobFormData.emergencyEvacuationImage ? (
                    <div className="mt-2 border rounded-md p-4 relative">
                      <div className="flex justify-end mb-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleFieldChange('emergencyEvacuationImage', null)}
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="flex justify-center">
                        <img 
                          src={jobFormData.emergencyEvacuationImage} 
                          alt="Emergency Evacuation Floor Plan" 
                          className="max-h-[300px] border rounded"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 border border-dashed rounded-md p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleEmergencyImageUpload}>
                      <div className="flex flex-col items-center gap-2">
                        <FileImage className="h-8 w-8 text-gray-400" />
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

                <div className="bg-amber-100 p-3 rounded-md mt-4">
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong> Emergency evacuation procedures must be reviewed with all staff before beginning work at this location.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <div className="flex justify-between mt-6">
            {currentTab !== "basic" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabValues = ["basic", "details", "location", "requirements", "workInstructions", "emergency"];
                  const currentIndex = tabValues.indexOf(currentTab);
                  if (currentIndex > 0) {
                    setCurrentTab(tabValues[currentIndex - 1]);
                  }
                }}
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
            </Button>
            )}
            
            {currentTab !== "emergency" ? (
              <Button
                type="button"
                className="ml-auto"
                onClick={() => {
                  const tabValues = ["basic", "details", "location", "requirements", "workInstructions", "emergency"];
                  const currentIndex = tabValues.indexOf(currentTab);
                  if (currentIndex < tabValues.length - 1) {
                    // Validate current tab before proceeding
                    if (currentTab === "basic" && !jobFormData.customerName) {
                      toast.error("Please enter a customer name before proceeding");
                      return;
                    }
                    
                    if (currentTab === "location" && !jobFormData.location_id) {
                      toast.error("Please select a location before proceeding");
                      return;
                    }
                    
                    setCurrentTab(tabValues[currentIndex + 1]);
                  }
                }}
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="ml-auto"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Job
                  </>
                )}
              </Button>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default JobCreationForm;
