
import React from 'react';
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Job } from '../jobs/types';
import { CalendarIcon, FileDown } from 'lucide-react';
import { format } from "date-fns";

interface JobSelectorProps {
  jobs: Job[];
  selectedJob: Job | null;
  selectedShift: string | null;
  dateRange: { start: string; end: string };
  onJobChange: (job: Job) => void;
  onShiftChange: (shift: string) => void;
  onDateRangeChange: (dateRange: { start: string; end: string }) => void;
  loading: boolean;
}

const JobSelector: React.FC<JobSelectorProps> = ({
  jobs,
  selectedJob,
  selectedShift,
  dateRange,
  onJobChange,
  onShiftChange,
  onDateRangeChange,
  loading
}) => {
  const [date, setDate] = React.useState<Date | undefined>(
    dateRange.start ? new Date(dateRange.start) : undefined
  );

  // Get unique shifts
  const shifts = Array.from(new Set(jobs.map(job => job.shift)));

  const handleJobChange = (value: string) => {
    const job = jobs.find(j => j.id === value);
    if (job) {
      onJobChange(job);
      // Set default shift if available
      if (job.shift) {
        onShiftChange(job.shift);
      }
    }
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      const formattedDate = format(newDate, 'yyyy-MM-dd');
      onDateRangeChange({
        start: formattedDate,
        end: formattedDate
      });
    }
  };

  const handleExportData = () => {
    // In a real implementation, this would trigger a data export
    // For now, just log to console
    console.log("Exporting data for:", selectedJob?.contractNumber, selectedShift);
    alert("Data export started. Your file will be ready for download shortly.");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="job-select" className="text-sm font-medium">Job</Label>
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select 
              value={selectedJob?.id || ''} 
              onValueChange={handleJobChange}
            >
              <SelectTrigger id="job-select" className="w-full">
                <SelectValue placeholder="Select job..." />
              </SelectTrigger>
              <SelectContent>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.contractNumber} - {job.customerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="shift-select" className="text-sm font-medium">Shift</Label>
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select 
              value={selectedShift || ''} 
              onValueChange={onShiftChange}
              disabled={!selectedJob}
            >
              <SelectTrigger id="shift-select">
                <SelectValue placeholder="Select shift..." />
              </SelectTrigger>
              <SelectContent>
                {shifts.map(shift => (
                  <SelectItem key={shift} value={shift}>
                    {shift}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-picker" className="text-sm font-medium">Review Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date-picker"
                variant={"outline"}
                className="w-full justify-start text-left font-normal"
                disabled={!selectedJob}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button 
          variant="outline" 
          className="ml-auto flex gap-2"
          onClick={handleExportData}
          disabled={!selectedJob}
        >
          <FileDown className="h-4 w-4" />
          Export Data
        </Button>
      </div>
    </div>
  );
};

export default JobSelector;
