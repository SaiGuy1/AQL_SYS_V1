
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Job } from '@/services/jobService';

interface PreviousJobSelectorProps {
  jobs: Job[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
}

const PreviousJobSelector: React.FC<PreviousJobSelectorProps> = ({ 
  jobs, 
  selectedJobId, 
  onSelectJob 
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="previousJob">Select a previous job to use as template</Label>
      <Select value={selectedJobId || ''} onValueChange={onSelectJob}>
        <SelectTrigger id="previousJob" className="w-full">
          <SelectValue placeholder="Select a previous job..." />
        </SelectTrigger>
        <SelectContent>
          {jobs.map((job) => (
            <SelectItem key={job.job_id} value={job.job_id}>
              {job.job_id} - {job.name} ({job.location_name})
            </SelectItem>
          ))}
          {jobs.length === 0 && (
            <SelectItem value="none" disabled>No previous jobs found</SelectItem>
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-500 mt-1">
        This will pre-populate the form with data from the selected job
      </p>
    </div>
  );
};

export default PreviousJobSelector;
