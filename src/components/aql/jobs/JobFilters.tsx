import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, BarChart3, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserRole } from "@/pages/AQLSystem";
import { getLocationsOrdered, formatLocationDisplay, Location } from '@/services/supabaseService';

interface JobFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  locationFilter: string;
  setLocationFilter: (value: string) => void;
  customerFilter: string;
  setCustomerFilter: (value: string) => void;
  shiftFilter: string;
  setShiftFilter: (value: string) => void;
  locations: string[];
  customers: string[];
  shifts: string[];
  userRole: UserRole;
}

const JobFilters: React.FC<JobFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  locationFilter,
  setLocationFilter,
  customerFilter,
  setCustomerFilter,
  shiftFilter,
  setShiftFilter,
  locations,
  customers,
  shifts,
  userRole
}) => {
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Fetch available locations from the database
  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const locationsData = await getLocationsOrdered();
        setAvailableLocations(locationsData);
      } catch (error) {
        console.error("Error fetching locations for filter:", error);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  return (
    <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
      <div className="relative w-full md:w-64">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search jobs..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-1">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filter Jobs</h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setStatusFilter('all');
                  setLocationFilter('all');
                  setCustomerFilter('all');
                  setShiftFilter('all');
                }}
              >
                Reset
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-3 items-center gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status" className="col-span-2">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="needs-review">Needs Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                
              <div className="grid grid-cols-3 items-center gap-2">
                <Label htmlFor="location">Location</Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger id="location" className="col-span-2">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
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
              </div>
                
              <div className="grid grid-cols-3 items-center gap-2">
                <Label htmlFor="customer">Customer</Label>
                <Select value={customerFilter} onValueChange={setCustomerFilter}>
                  <SelectTrigger id="customer" className="col-span-2">
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer} value={customer}>
                        {customer === 'all' ? 'All Customers' : customer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
                
              <div className="grid grid-cols-3 items-center gap-2">
                <Label htmlFor="shift">Shift</Label>
                <Select value={shiftFilter} onValueChange={setShiftFilter}>
                  <SelectTrigger id="shift" className="col-span-2">
                    <SelectValue placeholder="All Shifts" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map(shift => (
                      <SelectItem key={shift} value={shift}>
                        {shift === 'all' ? 'All Shifts' : shift}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" /> View
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-4">
          <div className="grid gap-4">
            <Label>Column Options</Label>
            <div className="space-y-2">
              {/* Would include checkboxes to control column visibility */}
              <div className="text-xs text-gray-500">
                Column visibility settings coming soon.
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default JobFilters;
