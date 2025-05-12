import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Clock, DollarSign, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  fetchTimesheetEntries, 
  updateTimesheetBillableStatus, 
  fetchJobBillableHours,
  TimesheetEntry 
} from '@/services/jobService';
import { UserRole } from '@/lib/supabase';

// Extended role type for dashboard compatibility (includes accounting which is not in UserRole)
type DashboardRole = UserRole | 'accounting';

interface TimesheetManagerProps {
  jobId: string;
  userRole: DashboardRole;
}

const TimesheetManager: React.FC<TimesheetManagerProps> = ({ jobId, userRole }) => {
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [billableHours, setBillableHours] = useState({ total: 0, billable: 0, unbillable: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("entries");
  
  // Determine if the user has edit permissions based on role
  const canEditTimesheets = ['inspector', 'supervisor', 'manager', 'admin'].includes(userRole);
  const canViewFinancials = ['accounting', 'manager', 'admin'].includes(userRole);
  
  useEffect(() => {
    const loadTimesheetData = async () => {
      if (!jobId) return;
      
      try {
        setLoading(true);
        
        // Fetch timesheet entries
        const entries = await fetchTimesheetEntries(jobId);
        setTimesheets(entries);
        
        // Fetch billable hours summary if user has financial access
        if (canViewFinancials) {
          const hours = await fetchJobBillableHours(jobId);
          setBillableHours(hours);
        }
      } catch (error) {
        console.error("Error loading timesheet data:", error);
        toast.error("Failed to load timesheet data");
      } finally {
        setLoading(false);
      }
    };
    
    loadTimesheetData();
  }, [jobId, canViewFinancials]);
  
  const handleBillableToggle = async (timesheetId: string, currentValue: boolean) => {
    if (!canEditTimesheets) {
      toast.error("You don't have permission to edit timesheets");
      return;
    }
    
    try {
      // Update the timesheet billable status
      await updateTimesheetBillableStatus(timesheetId, !currentValue);
      
      // Update local state to reflect the change
      setTimesheets(timesheets.map(ts => 
        ts.timesheet_id === timesheetId ? {...ts, is_billable: !currentValue} : ts
      ));
      
      // Update billable hours summary
      if (canViewFinancials) {
        const updatedHours = await fetchJobBillableHours(jobId);
        setBillableHours(updatedHours);
      }
      
      toast.success("Timesheet updated successfully");
    } catch (error) {
      console.error("Error updating timesheet:", error);
      toast.error("Failed to update timesheet");
    }
  };
  
  // The minimum required hours per job (default = 4 hours unless adjusted)
  const minimumBillableHours = 4;
  
  const getBillableStatus = (hours: number, isBillable: boolean) => {
    if (!isBillable) return "Unbillable";
    if (hours < minimumBillableHours) return `Minimum (${minimumBillableHours}h)`;
    return "Billable";
  };
  
  // Handle manual adjustment of billable status
  const handleStatusChange = async (timesheetId: string, status: string) => {
    if (!canEditTimesheets) return;
    
    try {
      const isBillable = status !== "Unbillable";
      await updateTimesheetBillableStatus(timesheetId, isBillable);
      
      setTimesheets(timesheets.map(ts => 
        ts.timesheet_id === timesheetId ? {...ts, is_billable: isBillable} : ts
      ));
      
      if (canViewFinancials) {
        const updatedHours = await fetchJobBillableHours(jobId);
        setBillableHours(updatedHours);
      }
      
      toast.success("Timesheet updated successfully");
    } catch (error) {
      console.error("Error updating timesheet status:", error);
      toast.error("Failed to update timesheet");
    }
  };
  
  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-600" />
          Timesheet Management
        </CardTitle>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mx-6">
          <TabsTrigger value="entries">Timesheet Entries</TabsTrigger>
          {canViewFinancials && (
            <TabsTrigger value="summary">Billing Summary</TabsTrigger>
          )}
        </TabsList>
        
        <CardContent className="p-6 pt-4">
          <TabsContent value="entries" className="mt-0 pt-4">
            {loading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-10 w-2/3" />
                    <Skeleton className="h-10 w-1/4" />
                  </div>
                ))}
              </div>
            ) : timesheets.length > 0 ? (
              <div className="overflow-x-auto -mx-6">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px] text-right">Hours</TableHead>
                      <TableHead className="w-[120px]">Billable</TableHead>
                      {canEditTimesheets && (
                        <TableHead className="w-[150px]">Status</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timesheets.map((entry) => (
                      <TableRow key={entry.timesheet_id}>
                        <TableCell className="font-medium">
                          {new Date(entry.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{entry.notes}</TableCell>
                        <TableCell className="text-right">
                          {entry.hours.toFixed(1)}h
                        </TableCell>
                        <TableCell>
                          {canEditTimesheets ? (
                            <Checkbox 
                              checked={entry.is_billable}
                              onCheckedChange={() => handleBillableToggle(entry.timesheet_id, entry.is_billable)}
                              disabled={!canEditTimesheets}
                            />
                          ) : (
                            <span className={entry.is_billable ? "text-green-600" : "text-gray-500"}>
                              {entry.is_billable ? "Yes" : "No"}
                            </span>
                          )}
                        </TableCell>
                        {canEditTimesheets && (
                          <TableCell>
                            <Select 
                              value={getBillableStatus(entry.hours, entry.is_billable)}
                              onValueChange={(value) => handleStatusChange(entry.timesheet_id, value)}
                            >
                              <SelectTrigger className="h-8 w-full">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Billable">Billable</SelectItem>
                                <SelectItem value="Unbillable">Unbillable</SelectItem>
                                <SelectItem value={`Minimum (${minimumBillableHours}h)`}>
                                  Minimum ({minimumBillableHours}h)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No timesheet entries available for this job</p>
              </div>
            )}
            
            {canEditTimesheets && (
              <div className="mt-6">
                <Button className="w-full">
                  Add Timesheet Entry
                </Button>
              </div>
            )}
          </TabsContent>
          
          {canViewFinancials && (
            <TabsContent value="summary" className="mt-0 pt-4">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Total Hours</p>
                            <p className="text-2xl font-bold">{billableHours.total.toFixed(1)}h</p>
                          </div>
                          <Clock className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Billable Hours</p>
                            <p className="text-2xl font-bold">{billableHours.billable.toFixed(1)}h</p>
                          </div>
                          <DollarSign className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Unbillable Hours</p>
                            <p className="text-2xl font-bold">{billableHours.unbillable.toFixed(1)}h</p>
                          </div>
                          <FileText className="h-8 w-8 text-gray-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Export Options</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <FileText className="h-4 w-4" />
                        Timesheet Report
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1">
                        <DollarSign className="h-4 w-4" />
                        Billing Report
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          )}
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default TimesheetManager;
