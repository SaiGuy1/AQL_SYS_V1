import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    locations: { id: string; name: string }[];
  };
  allLocations: { id: string; name: string }[];
  onUserUpdated: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  allLocations,
  onUserUpdated
}) => {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<UserRole>(user.role);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if this is the current user
    const currentUserId = localStorage.getItem('userId');
    setIsCurrentUser(currentUserId === user.id);

    // Initialize selected locations
    if (user.locations && Array.isArray(user.locations)) {
      setSelectedLocations(user.locations.map(loc => loc.id));
    }
    setLoading(false);
  }, [user.id, user.locations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // First update the user's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: name,
          email: user.email,
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw new Error(profileError.message);
      }

      // If user is an inspector, update their location assignments
      if (role === 'inspector' && selectedLocations.length > 0) {
        // First, remove all existing location assignments
        const { error: deleteError } = await supabase
          .from('inspector_locations')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) {
          console.error('Error removing existing location assignments:', deleteError);
          throw new Error(deleteError.message);
        }

        // Then add new location assignments
        const locationAssignments = selectedLocations.map(locationId => ({
          user_id: user.id,
          location_id: locationId
        }));

        const { error: insertError } = await supabase
          .from('inspector_locations')
          .insert(locationAssignments);

        if (insertError) {
          console.error('Error adding new location assignments:', insertError);
          throw new Error(insertError.message);
        }
      }

      toast.success('User updated successfully');
      onClose();
      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and role assignments.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      className="bg-gray-50"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Email cannot be changed after account creation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as UserRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="inspector">Inspector</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === 'inspector' && (
            <div className="space-y-2">
              <Label>Assigned Locations</Label>
              {allLocations.length > 0 ? (
                <MultiSelect
                  options={allLocations.map(loc => ({
                    label: loc.name || 'Unnamed Location',
                    value: loc.id || ''
                  })).filter(opt => opt.value !== '')}
                  selected={selectedLocations.filter(id => 
                    id && allLocations.some(loc => loc.id === id)
                  )}
                  onChange={(values) => setSelectedLocations(values.filter(Boolean))}
                  placeholder="Select locations..."
                />
              ) : (
                <p className="text-sm text-muted-foreground">No locations available</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal; 