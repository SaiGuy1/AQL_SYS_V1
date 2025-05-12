
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Job } from "../types";
import {
  FileSpreadsheet,
  FileText,
  File,
  Download,
  BarChart3,
  LineChart,
  FileWarning,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReportsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  customerView?: boolean;
}

const ReportsDialog: React.FC<ReportsDialogProps> = ({ 
  isOpen, 
  onClose, 
  job,
  customerView = false
}) => {
  const [activeTab, setActiveTab] = useState("job");
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  
  const handleDownload = (reportId: string, reportName: string) => {
    setDownloadingReportId(reportId);
    
    // Simulate download with timeout
    setTimeout(() => {
      toast.success(`${reportName} downloaded successfully`);
      setDownloadingReportId(null);
    }, 1500);
  };
  
  const standardReports = [
    {
      id: "job-summary",
      name: "Job Summary",
      icon: FileText,
      description: "Complete overview of the job",
      formats: ["pdf", "excel"]
    },
    {
      id: "defect-report",
      name: "Defect Report",
      icon: FileWarning,
      description: "Detailed report of all defects found",
      formats: ["pdf", "excel", "csv"]
    },
    {
      id: "inspection-metrics",
      name: "Inspection Metrics",
      icon: LineChart,
      description: "Performance metrics for the inspection",
      formats: ["pdf", "excel"]
    },
    {
      id: "time-tracking",
      name: "Time Tracking",
      icon: FileSpreadsheet,
      description: "Hours worked and billable time",
      formats: ["pdf", "excel", "csv"],
      adminOnly: true
    },
  ];
  
  // Filter reports for customer view
  const availableReports = customerView 
    ? standardReports.filter(r => !r.adminOnly)
    : standardReports;
  
  const analyticsReports = [
    {
      id: "trend-analysis",
      name: "Trend Analysis",
      icon: BarChart3,
      description: "Analysis of defect trends over time",
      formats: ["pdf"]
    },
    {
      id: "comparative-report",
      name: "Comparative Report",
      icon: LineChart,
      description: "Compare with previous jobs",
      formats: ["pdf", "excel"]
    }
  ];
  
  const renderReportList = (reports: typeof standardReports) => (
    <div className="space-y-4">
      {reports.map((report) => (
        <div key={report.id} className="border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <report.icon className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">{report.name}</h4>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {report.formats.includes('pdf') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                  disabled={downloadingReportId === `${report.id}-pdf`}
                  onClick={() => handleDownload(`${report.id}-pdf`, `${report.name} (PDF)`)}
                >
                  {downloadingReportId === `${report.id}-pdf` ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <File className="h-4 w-4 text-red-600" />
                  )}
                  PDF
                </Button>
              )}
              
              {report.formats.includes('excel') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                  disabled={downloadingReportId === `${report.id}-excel`}
                  onClick={() => handleDownload(`${report.id}-excel`, `${report.name} (Excel)`)}
                >
                  {downloadingReportId === `${report.id}-excel` ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  )}
                  Excel
                </Button>
              )}
              
              {report.formats.includes('csv') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                  disabled={downloadingReportId === `${report.id}-csv`}
                  onClick={() => handleDownload(`${report.id}-csv`, `${report.name} (CSV)`)}
                >
                  {downloadingReportId === `${report.id}-csv` ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  CSV
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reports</DialogTitle>
          <DialogDescription>
            Job #{job.contractNumber} - {job.customerName}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="job">Job Reports</TabsTrigger>
            {!customerView && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="job" className="mt-0">
            {renderReportList(availableReports)}
          </TabsContent>
          
          {!customerView && (
            <TabsContent value="analytics" className="mt-0">
              {renderReportList(analyticsReports)}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ReportsDialog;
