import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Loader2, Search, Plus, UserPlus, MailIcon, Users, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocationsOrdered, formatLocationDisplay, Location } from '@/services/supabaseService';
import EditUserModal from './EditUserModal';
import { UserRole } from '@/lib/supabase';

// Define the props for UserManagement component
interface UserManagementProps {
  userRole: UserRole;
}

// Define the form data structure for creating a user
interface CreateUserFormData {
  email: string;
  password: string;
  fullName: string;
  role: 'inspector' | 'supervisor';
  primaryLocationId: string | null;
  locationIds: string[];
}

// Define user interface
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  locations: { id: string; name: string }[];
}

const UserManagement: React.FC<UserManagementProps> = ({ userRole }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Form state
  const [form, setForm] = useState<CreateUserFormData>({
    email: '',
    password: '',
    fullName: '',
    role: 'inspector',
    primaryLocationId: null,
    locationIds: []
  });
  
  // Form errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Only admin and manager users can manage users
  const canManageUsers = userRole === 'admin' || userRole === 'manager';
  
  // Load users and locations on component mount
  useEffect(() => {
    fetchUsers();
    fetchLocations();
  }, []);
  
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch users with their locations
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          role,
          inspector_locations (
            location_id,
            locations (
              id,
              name
            )
          )
        `)
        .order('name');

      if (usersError) throw usersError;

      // Transform the data to match our User interface
      const transformedUsers = usersData.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        locations: user.inspector_locations.map((ul: any) => ({
          id: ul.locations.id,
          name: ul.locations.name
        }))
      }));

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };
  
  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const locationsData = await getLocationsOrdered();
      setLocations(locationsData);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to load locations");
    } finally {
      setLoadingLocations(false);
    }
  };
  
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = "Email is invalid";
    }
    
    if (!form.password) {
      errors.password = "Password is required";
    } else if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    
    if (!form.fullName.trim()) {
      errors.fullName = "Full name is required";
    }
    
    if (!form.role) {
      errors.role = "Role is required";
    }
    
    if (form.locationIds.length === 0) {
      errors.locations = "At least one location must be selected";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setCreatingUser(true);
    
    try {
      // Ensure we have a primary location ID (use first selected if not explicitly set)
      const primaryLocationId = form.primaryLocationId || form.locationIds[0];
      
      // First check if the user already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', form.email);
        
      if (checkError) {
        console.error("Error checking for existing user:", checkError);
      } else if (existingUsers && existingUsers.length > 0) {
        throw new Error("A user with this email already exists");
      }
      
      // Try to sign up the user
      console.log("Creating user:", form.email);
      console.log("With metadata:", {
        full_name: form.fullName,
        role: form.role.toLowerCase()
      });
      
      // Simplified signup with less metadata to avoid potential errors
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName
          }
        }
      });
      
      if (error) {
        console.error("Signup error details:", JSON.stringify(error, null, 2));
        throw error;
      }
      
      if (!data.user) {
        throw new Error("User creation succeeded but no user data was returned");
      }
      
      console.log("User created successfully, ID:", data.user.id);
      
      // Give the database a moment to create the profile record via trigger
      console.log("Waiting for profile trigger to execute...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if the profile was created by the trigger
      const { data: profileData, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      console.log("Profile check result:", profileData ? "Profile exists" : "No profile found");
      
      if (profileCheckError) {
        console.error("Error checking profile:", profileCheckError);
      }
      
      // Now update the profile record to set the role and location
      console.log("Updating profile with role and location...");
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: form.fullName,
          role: form.role.toLowerCase(),
          location_id: primaryLocationId
        })
        .eq('id', data.user.id);
        
      if (profileError) {
        console.error("Error updating profile:", profileError);
        
        // If the profile update failed, it might be because the profile doesn't exist yet
        // Try to create the profile directly
        console.log("Attempting to create profile record directly...");
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: form.email,
            name: form.fullName,
            role: form.role.toLowerCase(),
            location_id: primaryLocationId
          });
          
        if (insertError) {
          console.error("Error creating profile:", insertError);
          
          // Last resort - try to manually set user_metadata with role
          console.log("Attempting to update user metadata...");
          const { error: metadataError } = await supabase.auth.updateUser({
            data: { 
              role: form.role.toLowerCase(),
              location_id: primaryLocationId
            }
          });
          
          if (metadataError) {
            console.error("Error updating user metadata:", metadataError);
            toast.warning("User created but profile setup failed. Role and location might need to be set manually.");
          } else {
            console.log("User metadata updated successfully");
          }
        } else {
          console.log("Profile created successfully");
        }
      } else {
        console.log("Profile updated successfully");
      }
      
      // If there are multiple locations selected, insert the rest into user_locations
      if (form.locationIds.length > 1) {
        console.log("Adding additional locations...");
        
        // Create array of location IDs excluding the primary one (to avoid duplicates)
        const additionalLocations = form.locationIds
          .filter(locId => locId !== primaryLocationId)
          .map(locId => ({
            user_id: data.user.id,
            location_id: locId
          }));
        
        if (additionalLocations.length > 0) {
          const { error: locationsError } = await supabase
            .from('user_locations')
            .insert(additionalLocations);
          
          if (locationsError) {
            console.error("Error adding additional locations:", locationsError);
            toast.error("User was created but some locations could not be assigned");
          } else {
            console.log("Additional locations added successfully");
          }
        }
      }
      
      // Show success message
      toast.success("User created and assigned to locations. User must confirm email to activate account.");
      
      // Reset form and close modal
      setForm({
        email: '',
        password: '',
        fullName: '',
        role: 'inspector',
        primaryLocationId: null,
        locationIds: []
      });
      setShowCreateModal(false);
      
      // Refresh user list
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      
      // Provide more user-friendly error messages for common issues
      let errorMessage = error.message || "Failed to create user. Please try again.";
      
      if (error.message?.includes("already registered")) {
        errorMessage = "This email is already registered. Please use a different email address.";
      } else if (error.message?.includes("Database error")) {
        errorMessage = "There was a database error. The profile table may not be set up correctly.";
      } else if (error.message?.includes("password")) {
        errorMessage = "Password does not meet requirements. Please use a stronger password.";
      }
      
      toast.error(errorMessage);
    } finally {
      setCreatingUser(false);
    }
  };
  
  const handleLocationChange = (locationId: string) => {
    setForm(prev => {
      // Check if the location is already selected
      const isSelected = prev.locationIds.includes(locationId);
      
      // If it's already selected, remove it
      if (isSelected) {
        const updatedLocationIds = prev.locationIds.filter(id => id !== locationId);
        
        // If the primary location was removed, update it to the first available location or null
        const updatedPrimaryLocationId = 
          prev.primaryLocationId === locationId 
            ? updatedLocationIds.length > 0 ? updatedLocationIds[0] : null
            : prev.primaryLocationId;
        
        return {
          ...prev,
          locationIds: updatedLocationIds,
          primaryLocationId: updatedPrimaryLocationId
        };
      } 
      // If it's not selected, add it
      else {
        const updatedLocationIds = [...prev.locationIds, locationId];
        
        // If this is the first location, also set it as the primary
        const updatedPrimaryLocationId = 
          prev.primaryLocationId === null ? locationId : prev.primaryLocationId;
        
        return {
          ...prev,
          locationIds: updatedLocationIds,
          primaryLocationId: updatedPrimaryLocationId
        };
      }
    });
  };
  
  const handleSetPrimaryLocation = (locationId: string) => {
    // Ensure the locationId is in the selected locations
    if (!form.locationIds.includes(locationId)) {
      // Add it to the selected locations if it's not there
      handleLocationChange(locationId);
    }
    
    // Set as primary location
    setForm(prev => ({
      ...prev,
      primaryLocationId: locationId
    }));
  };
  
  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.role && user.role.toLowerCase().includes(query))
    );
  });
  
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };
  
  const handleUserUpdated = () => {
    fetchUsers(); // Refresh the user list
  };
  
  if (!canManageUsers) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to manage users
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
            <Users className="h-5 w-5 mr-2" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage inspectors and supervisors
          </CardDescription>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-1">
            <UserPlus className="h-4 w-4" /> Create User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loadingUsers ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {filteredUsers.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                {searchQuery ? 
                  "No users found matching your search criteria." : 
                  "No inspectors or supervisors have been created yet."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Locations</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{user.role || 'N/A'}</TableCell>
                      <TableCell>
                        {user.locations.map(loc => loc.name).join(', ')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </CardContent>
      
      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new inspector or supervisor user and assign them to one or more locations.
              The user will receive an email and must confirm their account before they can log in.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateUser} className="space-y-4 my-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                placeholder="John Doe" 
                value={form.fullName}
                onChange={(e) => setForm({...form, fullName: e.target.value})}
                className={formErrors.fullName ? "border-red-500" : ""}
              />
              {formErrors.fullName && (
                <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>
              )}
            </div>
            
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <MailIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john.doe@example.com" 
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className={`pl-8 ${formErrors.email ? "border-red-500" : ""}`}
                />
              </div>
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>
            
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                className={formErrors.password ? "border-red-500" : ""}
              />
              {formErrors.password && (
                <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters long.
              </p>
            </div>
            
            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={form.role} 
                onValueChange={(value: 'inspector' | 'supervisor') => setForm({...form, role: value})}
              >
                <SelectTrigger id="role" className={formErrors.role ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inspector">Inspector</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && (
                <p className="text-red-500 text-xs mt-1">{formErrors.role}</p>
              )}
            </div>
            
            {/* Locations Selection */}
            <div className="space-y-2">
              <Label>Assigned Locations</Label>
              {loadingLocations ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : locations.length === 0 ? (
                <div className="text-sm text-muted-foreground p-2 border rounded-md">
                  No locations available. Please create locations first.
                </div>
              ) : (
                <div className={`space-y-2 p-3 border rounded-md max-h-60 overflow-y-auto ${formErrors.locations ? "border-red-500" : ""}`}>
                  {locations.map(location => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`location-${location.id}`} 
                        checked={form.locationIds.includes(location.id)}
                        onCheckedChange={() => handleLocationChange(location.id)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label 
                          htmlFor={`location-${location.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {formatLocationDisplay(location)}
                          {form.primaryLocationId === location.id && (
                            <span className="ml-2 text-xs text-blue-600 font-semibold">
                              (Primary)
                            </span>
                          )}
                        </Label>
                      </div>
                      {form.locationIds.includes(location.id) && 
                       form.primaryLocationId !== location.id && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetPrimaryLocation(location.id)}
                          className="ml-auto text-xs h-6"
                        >
                          Set as Primary
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {formErrors.locations && (
                <p className="text-red-500 text-xs mt-1">{formErrors.locations}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Select at least one location. The primary location will be stored in the user metadata.
              </p>
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
                disabled={creatingUser}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creatingUser || loadingLocations}>
                {creatingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {creatingUser ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {selectedUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          allLocations={locations}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </Card>
  );
};

export default UserManagement;