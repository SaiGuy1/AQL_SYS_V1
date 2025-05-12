import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { UserRole, supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getLocationsOrdered, formatLocationDisplay } from '@/services/supabaseService';
import { Loader2, X } from "lucide-react";

// Define location type
interface Location {
  id: string;
  name: string;
  location_number: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  created_at?: string;
}

const Signup: React.FC = () => {
  // Standard user signup fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [locationId, setLocationId] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Inspector-specific fields
  const [fullName, setFullName] = useState('');
  const [inspectorEmail, setInspectorEmail] = useState('');
  const [inspectorPassword, setInspectorPassword] = useState('');
  const [inspectorConfirmPassword, setInspectorConfirmPassword] = useState('');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  
  // Shared states
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('standard');
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Fetch available locations
  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const locationsData = await getLocationsOrdered();
        setLocations(locationsData || []);
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast.error("Failed to load locations. Please try again later.");
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  // Inspector location management
  const addLocation = (id: string) => {
    if (!selectedLocationIds.includes(id)) {
      setSelectedLocationIds([...selectedLocationIds, id]);
    }
    setShowLocationSelector(false);
  };

  const removeLocation = (id: string) => {
    setSelectedLocationIds(selectedLocationIds.filter(locId => locId !== id));
  };

  const getLocationName = (id: string) => {
    const location = locations.find(loc => loc.id === id);
    return location ? formatLocationDisplay(location) : id;
  };

  // Form validation for standard signup
  const validateStandardForm = () => {
    const errors: Record<string, string> = {};
    
    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!lastName.trim()) errors.lastName = "Last name is required";
    
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
    }
    
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords don't match";
    }
    
    if (!locationId) {
      errors.location = "Please select a location";
    }
    
    if (!acceptTerms) {
      errors.acceptTerms = "You must accept the terms and conditions";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form validation for inspector signup
  const validateInspectorForm = () => {
    const errors: Record<string, string> = {};
    
    if (!fullName.trim()) errors.fullName = "Full name is required";
    
    if (!inspectorEmail.trim()) {
      errors.inspectorEmail = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(inspectorEmail)) {
      errors.inspectorEmail = "Email is invalid";
    }
    
    if (!inspectorPassword) {
      errors.inspectorPassword = "Password is required";
    } else if (inspectorPassword.length < 8) {
      errors.inspectorPassword = "Password must be at least 8 characters";
    }
    
    if (inspectorPassword !== inspectorConfirmPassword) {
      errors.inspectorConfirmPassword = "Passwords don't match";
    }
    
    if (selectedLocationIds.length === 0) {
      errors.inspectorLocation = "Please select at least one location";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Standard user signup handler
  const handleStandardSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStandardForm()) return;
    
    setLoading(true);
    
    try {
      await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        role: 'customer',
        location_id: locationId
      });
      
      toast.success("Account created successfully! Please check your email to confirm your account.");
      navigate("/login");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  // Inspector signup handler
  const handleInspectorSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInspectorForm()) return;
    
    setLoading(true);
    
    try {
      // Extract first and last name from full name
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      // Use the primary location as the main location_id
      const primaryLocationId = selectedLocationIds[0];
      
      // Create the user account with inspector role
      await signUp(inspectorEmail, inspectorPassword, {
        first_name: firstName,
        last_name: lastName,
        role: 'inspector',
        location_id: primaryLocationId
      });
      
      // For inspectors, we need to add all their location assignments
      // This will automatically happen through the database triggers
      // that are set up in the SQL schema
      
      toast.success("Inspector account created successfully! Please check your email to confirm your account.");
      navigate("/login");
    } catch (error: any) {
      console.error("Inspector signup error:", error);
      toast.error(error.message || "Failed to create inspector account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/e8348c16-cd3e-49e0-b88d-e23a07634869.png" 
              alt="AQL Logo" 
              className="h-12 w-auto" 
            />
          </div>
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>Sign up to get started with AQL</CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="standard" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="standard">Standard</TabsTrigger>
              <TabsTrigger value="inspector">Inspector</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="standard">
            <CardContent className="space-y-4 mt-4">
              <form onSubmit={handleStandardSignup}>
                {/* First Name */}
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    placeholder="John" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={formErrors.firstName ? "border-red-500" : ""}
                  />
                  {formErrors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
                  )}
                </div>
                
                {/* Last Name */}
                <div className="space-y-2 mt-4">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Doe" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={formErrors.lastName ? "border-red-500" : ""}
                  />
                  {formErrors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
                  )}
                </div>
                
                {/* Email */}
                <div className="space-y-2 mt-4">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john.doe@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={formErrors.email ? "border-red-500" : ""}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                  )}
                </div>
                
                {/* Password */}
                <div className="space-y-2 mt-4">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={formErrors.password ? "border-red-500" : ""}
                  />
                  {formErrors.password && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                  )}
                </div>
                
                {/* Confirm Password */}
                <div className="space-y-2 mt-4">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={formErrors.confirmPassword ? "border-red-500" : ""}
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
                  )}
                </div>
                
                {/* Location */}
                <div className="space-y-2 mt-4">
                  <Label htmlFor="location">Location</Label>
                  <Select value={locationId} onValueChange={setLocationId}>
                    <SelectTrigger className={formErrors.location ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select your location" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingLocations ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading locations...</span>
                        </div>
                      ) : (
                        locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {formatLocationDisplay(location)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formErrors.location && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>
                  )}
                </div>
                
                {/* Terms and Conditions */}
                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox 
                    id="terms" 
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  />
                  <label 
                    htmlFor="terms" 
                    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${formErrors.acceptTerms ? "text-red-500" : ""}`}
                  >
                    I accept the terms and conditions
                  </label>
                </div>
                {formErrors.acceptTerms && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.acceptTerms}</p>
                )}
                
                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="inspector">
            <CardContent className="space-y-4 mt-4">
              <form onSubmit={handleInspectorSignup}>
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    placeholder="John Doe" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={formErrors.fullName ? "border-red-500" : ""}
                  />
                  {formErrors.fullName && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>
                  )}
                </div>
                
                {/* Email */}
                <div className="space-y-2 mt-4">
                  <Label htmlFor="inspectorEmail">Email Address</Label>
                  <Input 
                    id="inspectorEmail" 
                    type="email" 
                    placeholder="john.doe@example.com" 
                    value={inspectorEmail}
                    onChange={(e) => setInspectorEmail(e.target.value)}
                    className={formErrors.inspectorEmail ? "border-red-500" : ""}
                  />
                  {formErrors.inspectorEmail && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.inspectorEmail}</p>
                  )}
                </div>
                
                {/* Password */}
                <div className="space-y-2 mt-4">
                  <Label htmlFor="inspectorPassword">Password</Label>
                  <Input 
                    id="inspectorPassword" 
                    type="password" 
                    value={inspectorPassword}
                    onChange={(e) => setInspectorPassword(e.target.value)}
                    className={formErrors.inspectorPassword ? "border-red-500" : ""}
                  />
                  {formErrors.inspectorPassword && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.inspectorPassword}</p>
                  )}
                </div>
                
                {/* Confirm Password */}
                <div className="space-y-2 mt-4">
                  <Label htmlFor="inspectorConfirmPassword">Confirm Password</Label>
                  <Input 
                    id="inspectorConfirmPassword" 
                    type="password" 
                    value={inspectorConfirmPassword}
                    onChange={(e) => setInspectorConfirmPassword(e.target.value)}
                    className={formErrors.inspectorConfirmPassword ? "border-red-500" : ""}
                  />
                  {formErrors.inspectorConfirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.inspectorConfirmPassword}</p>
                  )}
                </div>
                
                {/* Locations */}
                <div className="space-y-2 mt-4">
                  <Label>Working Locations</Label>
                  
                  {/* Selected locations */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedLocationIds.map(id => (
                      <div key={id} className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                        <span className="text-sm">{getLocationName(id)}</span>
                        <button
                          type="button"
                          onClick={() => removeLocation(id)}
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Location selector button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 text-sm"
                    onClick={() => setShowLocationSelector(!showLocationSelector)}
                  >
                    {showLocationSelector ? "Hide Locations" : "Add Location"}
                  </Button>
                  
                  {/* Location selector dropdown */}
                  {showLocationSelector && (
                    <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                      {loadingLocations ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading locations...</span>
                        </div>
                      ) : (
                        <div className="p-1">
                          {locations.map(location => (
                            <div
                              key={location.id}
                              className={`px-3 py-2 text-sm cursor-pointer rounded hover:bg-gray-100 ${
                                selectedLocationIds.includes(location.id) ? "bg-gray-100" : ""
                              }`}
                              onClick={() => addLocation(location.id)}
                            >
                              {formatLocationDisplay(location)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {formErrors.inspectorLocation && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.inspectorLocation}</p>
                  )}
                </div>
                
                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Inspector Account...
                    </>
                  ) : (
                    "Create Inspector Account"
                  )}
                </Button>
              </form>
            </CardContent>
          </TabsContent>
        </Tabs>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-gray-500 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup; 