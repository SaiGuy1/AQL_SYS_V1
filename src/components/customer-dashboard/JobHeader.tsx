
import React from 'react';
import { cn } from '@/lib/utils';
import { Job } from '@/services/jobService';
import { FileClock, MapPin, Calendar, AlertCircle } from 'lucide-react';

interface JobHeaderProps {
  selectedJob: Job | null;
  loading: {
    jobs: boolean;
    metrics: boolean;
    defectTrends: boolean;
    paretoData: boolean;
    tasks: boolean;
    performance: boolean;
  };
}

const JobHeader: React.FC<JobHeaderProps> = ({ selectedJob, loading }) => {
  if (!selectedJob) {
    return !loading.jobs ? (
      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-center">
        <AlertCircle className="h-5 w-5 text-yellow-500 mx-auto mb-2" />
        <p className="text-yellow-700">No active jobs available for this customer</p>
      </div>
    ) : null;
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 md:p-4 flex flex-col md:flex-row gap-4 md:items-center">
      <div className="flex items-center">
        <div className="bg-blue-100 p-2 rounded-full mr-3">
          <FileClock className="h-5 w-5 text-blue-700" />
        </div>
        <div>
          <div className="text-sm text-gray-500">Job ID</div>
          <div className="font-medium">{selectedJob.job_id}</div>
        </div>
      </div>
      
      <div className="w-px h-10 bg-blue-200 hidden md:block" />
      
      <div className="flex items-center">
        <div className="bg-blue-100 p-2 rounded-full mr-3">
          <MapPin className="h-5 w-5 text-blue-700" />
        </div>
        <div>
          <div className="text-sm text-gray-500">Location</div>
          <div className="font-medium">{selectedJob.location_name}</div>
        </div>
      </div>
      
      <div className="w-px h-10 bg-blue-200 hidden md:block" />
      
      <div className="flex items-center">
        <div className="bg-blue-100 p-2 rounded-full mr-3">
          <Calendar className="h-5 w-5 text-blue-700" />
        </div>
        <div>
          <div className="text-sm text-gray-500">Start Date</div>
          <div className="font-medium">{new Date(selectedJob.start_date).toLocaleDateString()}</div>
        </div>
      </div>
      
      <div className="w-px h-10 bg-blue-200 hidden md:block" />
      
      <div className="flex items-center">
        <div className={cn(
          "p-2 rounded-full mr-3",
          selectedJob.status === 'Active' ? "bg-green-100" : 
          selectedJob.status === 'Pending' ? "bg-yellow-100" : "bg-gray-100"
        )}>
          <AlertCircle className={cn(
            "h-5 w-5",
            selectedJob.status === 'Active' ? "text-green-700" : 
            selectedJob.status === 'Pending' ? "text-yellow-700" : "text-gray-700"
          )} />
        </div>
        <div>
          <div className="text-sm text-gray-500">Status</div>
          <div className="font-medium">{selectedJob.status}</div>
        </div>
      </div>
    </div>
  );
};

export default JobHeader;
