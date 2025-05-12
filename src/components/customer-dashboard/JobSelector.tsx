
import React from 'react';
import { Job } from '@/services/jobService';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileClock, Search, ChevronDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JobSelectorProps {
  jobs: Job[];
  selectedJob: Job | null;
  shift: string;
  jobSearchQuery: string;
  loading: {
    jobs: boolean;
  };
  setJobSearchQuery: (query: string) => void;
  handleJobChange: (jobId: string) => void;
  setShift: (shift: string) => void;
}

const JobSelector: React.FC<JobSelectorProps> = ({
  jobs,
  selectedJob,
  shift,
  jobSearchQuery,
  loading,
  setJobSearchQuery,
  handleJobChange,
  setShift,
}) => {
  const filteredJobs = jobs.filter(job => 
    job.job_id.toLowerCase().includes(jobSearchQuery.toLowerCase()) || 
    job.name.toLowerCase().includes(jobSearchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <div className="md:w-1/2">
        <Label htmlFor="job-selection" className="text-sm font-medium mb-1 block">
          Select Job
        </Label>
        {loading.jobs ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between border-blue-100 hover:bg-blue-50"
              >
                <div className="flex items-center">
                  <FileClock className="mr-2 h-4 w-4 text-blue-600" />
                  <span>{selectedJob ? `${selectedJob.job_id} - ${selectedJob.name}` : "Select a job"}</span>
                </div>
                <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    placeholder="Search jobs..."
                    className="pl-8" 
                    value={jobSearchQuery}
                    onChange={(e) => setJobSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="max-h-80 overflow-auto">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map(job => (
                    <div 
                      key={job.job_id}
                      className="p-2 hover:bg-blue-50 cursor-pointer flex flex-col"
                      onClick={() => {
                        handleJobChange(job.job_id);
                        document.body.click(); // Close popover
                      }}
                    >
                      <div className="font-medium">{job.job_id} - {job.name}</div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" /> {job.location_name}
                        <span className="mx-2">|</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs",
                          job.status === 'Active' ? "bg-green-100 text-green-800" :
                          job.status === 'Pending' ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        )}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No jobs found matching "{jobSearchQuery}"
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      <div className="md:w-1/4">
        <Label htmlFor="shift-selection" className="text-sm font-medium mb-1 block">
          Select Shift
        </Label>
        {loading.jobs ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select value={shift} onValueChange={setShift} disabled={!selectedJob}>
            <SelectTrigger className="h-10 border-blue-100 hover:bg-blue-50">
              <SelectValue placeholder="Select shift" />
            </SelectTrigger>
            <SelectContent>
              {selectedJob?.shifts.map(shiftOption => (
                <SelectItem key={shiftOption} value={shiftOption}>
                  {shiftOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

export default JobSelector;
