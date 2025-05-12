import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { toast } from "sonner";
import { useTranslation } from "@/contexts/TranslationContext";
import { createInspectorProfile, getLocationsOrdered, formatLocationDisplay, Location } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import { Loader2 } from "lucide-react";

const signUpInspector = async (
  email: string,
  password: string,
  fullName: string,
  role: string,
  locationId: string
) => {
  console.log("Sending metadata to Supabase:", {
    full_name: fullName,
    role: role?.toLowerCase() || "inspector",
    location_id: locationId || null,
  });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role?.toLowerCase() || "inspector",
        location_id: locationId || null,
      }
    }
  });

  if (error) {
    throw error;
  }

  return data;
};

const SignupInspector: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [locationId, setLocationId] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const locationsData = await getLocationsOrdered();
        if (locationsData && locationsData.length > 0) {
          setLocations(locationsData);
        } else {
          toast.error("No locations found. Please contact an administrator.");
          setLocations([]);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast.error("Failed to load locations. Please try again.");
        setLocations([]);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!fullName.trim()) errors.fullName = "Full name is required";
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
    }
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords don't match";
    }
    if (!locationId) errors.location = "Please select a location";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      console.log("Creating user with email:", email);

      const { user } = await signUpInspector(
        email,
        password,
        fullName,
        "inspector",
        locationId
      );

      if (!user?.id) throw new Error("Failed to create user account");

      const inspectorData = {
        user_id: user.id,
        name: fullName,
        email: email,
        role: "inspector",
        location_id: locationId,
      };

      await createInspectorProfile(inspectorData);

      localStorage.setItem('userId', user.id);
      localStorage.setItem('currentUser', fullName);

      toast.success("Signup successful! Please check your email to confirm your account.");

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/e8348c16-cd3e-49e0-b88d-e23a07634869.png" 
              alt="AQL Logo" 
              className="h-12 w-auto" 
            />
          </div>
          <CardTitle className="text-2xl font-bold">Inspector Signup</CardTitle>
          <CardDescription>Create an account to join the AQL inspection team</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <form onSubmit={handleSignup}>
            <div className="space-y-4">
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

              <div className="space-y-2">
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

              <div className="space-y-2">
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

              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="location">Assigned Location</Label>
                {loadingLocations ? (
                  <div className="flex items-center space-x-2 h-10 border rounded-md px-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-500">Loading locations...</span>
                  </div>
                ) : (
                  <Select 
                    value={locationId} 
                    onValueChange={setLocationId}
                  >
                    <SelectTrigger id="location" className={formErrors.location ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.length > 0 ? (
                        locations.map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {formatLocationDisplay(location)}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-locations" disabled>No locations available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
                {formErrors.location && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading || loadingLocations}>
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Account...
                  </span>
                ) : "Sign Up"}
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal"
              onClick={() => navigate('/login')}
            >
              Log in
            </Button>
          </div>
          <div className="text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} AQL Bull Ring Technologies
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignupInspector;
