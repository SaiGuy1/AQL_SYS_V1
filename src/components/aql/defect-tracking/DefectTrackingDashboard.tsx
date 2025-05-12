
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import JobSelector from './JobSelector';
import DefectMetrics from './DefectMetrics';
import DefectTable from './DefectTable';
import DefectCharts from './DefectCharts';
import DefectLogForm from './DefectLogForm';
import { 
  mockJobs, 
  mockDefects, 
  mockDefectTypes, 
  mockDefectSummaries, 
  mockDailyReviewData 
} from '../jobs/mockData';
import { UserRole } from "@/pages/AQLSystem";
import { Job, Defect, DefectType, DefectSummary, DailyReviewData } from '../jobs/types';

interface DefectTrackingDashboardProps {
  userRole: UserRole;
}

const DefectTrackingDashboard: React.FC<DefectTrackingDashboardProps> = ({ userRole }) => {
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '2023-09-01',
    end: '2023-09-14'
  });
  const [defects, setDefects] = useState<Defect[]>([]);
  const [defectTypes, setDefectTypes] = useState<DefectType[]>([]);
  const [defectSummaries, setDefectSummaries] = useState<DefectSummary[]>([]);
  const [dailyReviewData, setDailyReviewData] = useState<DailyReviewData[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setDefectTypes(mockDefectTypes);
      
      // Set default selected job (first job)
      if (mockJobs.length > 0) {
        setSelectedJob(mockJobs[0]);
        setSelectedShift(mockJobs[0].shift);
      }
      
      setLoading(false);
    }, 500);
  }, []);

  // Load job-specific data when job selection changes
  useEffect(() => {
    if (selectedJob) {
      setLoading(true);
      
      // Simulate API call to get job-specific data
      setTimeout(() => {
        // Filter defects for selected job
        const jobDefects = mockDefects.filter(defect => defect.jobId === selectedJob.id);
        setDefects(jobDefects);
        
        // Get defect summaries
        setDefectSummaries(mockDefectSummaries);
        
        // Get daily review data
        setDailyReviewData(mockDailyReviewData);
        
        setLoading(false);
      }, 300);
    }
  }, [selectedJob]);

  // Add a new defect
  const handleAddDefect = (newDefect: Omit<Defect, 'id'>) => {
    const defectWithId = {
      ...newDefect,
      id: `${defects.length + 1}`,
    };
    
    setDefects([...defects, defectWithId]);
    
    toast({
      title: "Defect logged",
      description: "The defect has been recorded successfully."
    });
  };

  // Update defect status
  const handleUpdateDefectStatus = (defectId: string, newStatus: Defect['status']) => {
    const updatedDefects = defects.map(defect => 
      defect.id === defectId ? { ...defect, status: newStatus } : defect
    );
    
    setDefects(updatedDefects);
    
    toast({
      title: "Defect updated",
      description: `Defect status changed to ${newStatus}.`
    });
  };

  // Check if user can log defects
  const canLogDefects = ['inspector', 'supervisor', 'manager', 'admin'].includes(userRole);
  
  // Check if user can approve/reject defects
  const canManageDefects = ['supervisor', 'manager', 'admin'].includes(userRole);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">Defect Tracking Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <JobSelector 
            jobs={mockJobs}
            selectedJob={selectedJob}
            selectedShift={selectedShift}
            dateRange={dateRange}
            onJobChange={setSelectedJob}
            onShiftChange={setSelectedShift}
            onDateRangeChange={setDateRange}
            loading={loading}
          />
        </CardContent>
      </Card>

      {selectedJob && (
        <>
          <DefectMetrics 
            selectedJob={selectedJob}
            defectSummaries={defectSummaries}
            dailyReviewData={dailyReviewData}
            loading={loading}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 md:w-[400px] mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="defects">Defect Details</TabsTrigger>
              {canLogDefects && <TabsTrigger value="log">Log Defects</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <DefectCharts 
                defectSummaries={defectSummaries} 
                dailyReviewData={dailyReviewData}
                loading={loading}
              />
            </TabsContent>
            
            <TabsContent value="defects" className="space-y-6">
              <DefectTable 
                defects={defects}
                canManageDefects={canManageDefects}
                onUpdateStatus={handleUpdateDefectStatus}
                loading={loading}
              />
            </TabsContent>
            
            {canLogDefects && (
              <TabsContent value="log" className="space-y-6">
                <DefectLogForm 
                  jobId={selectedJob.id}
                  shift={selectedShift || ''}
                  defectTypes={defectTypes}
                  onAddDefect={handleAddDefect}
                />
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
};

export default DefectTrackingDashboard;
