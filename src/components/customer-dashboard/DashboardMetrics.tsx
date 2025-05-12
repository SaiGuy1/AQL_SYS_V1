
import React from 'react';
import { JobMetrics } from '@/services/jobService';
import { AlertCircle, FileClock } from 'lucide-react';
import MetricCard from './MetricCard';

interface DashboardMetricsProps {
  loading: {
    metrics: boolean;
  };
  jobMetrics: JobMetrics | null;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  loading,
  jobMetrics,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-6">
      <MetricCard 
        title="Total Defects (Total Reviewed)"
        value={loading.metrics ? null : jobMetrics?.total_inspected.toLocaleString() || "0"}
        icon={<div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
        </div>}
        className="bg-white"
      />
      
      <MetricCard 
        title="Defects Count"
        value={loading.metrics ? null : jobMetrics?.total_defects.toLocaleString() || "0"}
        icon={<div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>}
        className="bg-white"
      />
      
      <MetricCard 
        title="New Tasks"
        value={loading.metrics ? null : jobMetrics?.open_tasks.toLocaleString() || "0"}
        icon={<div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>}
        className="bg-white"
      />
      
      <MetricCard 
        title="Open Issues"
        value={loading.metrics ? null : jobMetrics?.pending_defects.toLocaleString() || "0"}
        icon={<div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
          <AlertCircle className="h-5 w-5" />
        </div>}
        className="bg-white"
      />
      
      <MetricCard 
        title="Completion Rate"
        value={loading.metrics ? null : `${jobMetrics?.completion_rate || 0}%`}
        icon={<div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>}
        className="bg-white"
      />
    </div>
  );
};

export default DashboardMetrics;
