import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Download, 
  FilePlus, 
  Search, 
  Filter, 
  Printer,
  CheckSquare,
  Clock,
  BarChart,
  PieChart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import ServiceReportCharts from "./ServiceReportCharts";
import { useTranslation } from "@/contexts/TranslationContext";

interface Report {
  id: string;
  contractNumber: string;
  customerName: string;
  reportDate: string;
  type: 'service' | 'certification' | 'audit';
  status: 'draft' | 'final';
  partsInspected: number;
  defectsFound: number;
}

const mockReports: Report[] = [
  {
    id: '1',
    contractNumber: '16-0013893-1',
    customerName: 'Burgula OES',
    reportDate: '2023-09-15',
    type: 'service',
    status: 'final',
    partsInspected: 1430,
    defectsFound: 84
  },
  {
    id: '2',
    contractNumber: '16-0013894-2',
    customerName: 'Autotech Systems',
    reportDate: '2023-09-12',
    type: 'certification',
    status: 'final',
    partsInspected: 875,
    defectsFound: 17
  },
  {
    id: '3',
    contractNumber: '16-0013895-3',
    customerName: 'Global Motors',
    reportDate: '2023-09-20',
    type: 'service',
    status: 'draft',
    partsInspected: 0,
    defectsFound: 0
  },
  {
    id: '4',
    contractNumber: '69-0010039',
    customerName: 'Premier Auto Parts',
    reportDate: '2023-09-05',
    type: 'audit',
    status: 'final',
    partsInspected: 2458,
    defectsFound: 156
  }
];

const ServiceReports: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [activeTab, setActiveTab] = useState('reports');

  const filteredReports = reports.filter(report => 
    report.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setActiveTab('view');
  };

  const handleDownloadReport = (reportId: string) => {
    toast({
      title: "Download Started",
      description: "The report is being prepared for download.",
    });
  };

  const handlePrintReport = () => {
    toast({
      title: "Print Job Sent",
      description: "The report has been sent to the printer.",
    });
  };

  const handleCreateNewReport = () => {
    setActiveTab('create');
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-1" /> {t('service_reports')}
          </TabsTrigger>
          <TabsTrigger value="charts">
            <BarChart className="h-4 w-4 mr-1" /> {t('analytics_and_charts') || 'Analytics & Charts'}
          </TabsTrigger>
          <TabsTrigger value="create">
            <FilePlus className="h-4 w-4 mr-1" /> {t('create_report') || 'Create Report'}
          </TabsTrigger>
          {selectedReport && (
            <TabsTrigger value="view">
              <FileText className="h-4 w-4 mr-1" /> {t('view_report') || 'View Report'}
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Service Reports & Documentation</CardTitle>
                <CardDescription>Manage service reports, certifications, and audit logs</CardDescription>
              </div>
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mt-4 md:mt-0">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search reports..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" /> Filter
                </Button>
                <Button variant="default" className="flex items-center gap-1" onClick={handleCreateNewReport}>
                  <FilePlus className="h-4 w-4" /> New Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                        <th className="px-4 py-3">Contract #</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Parts Inspected</th>
                        <th className="px-4 py-3">Defects Found</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loading ? (
                        Array(4).fill(0).map((_, i) => (
                          <tr key={i}>
                            <td className="px-4 py-4"><Skeleton className="h-5 w-24" /></td>
                            <td className="px-4 py-4"><Skeleton className="h-5 w-32" /></td>
                            <td className="px-4 py-4"><Skeleton className="h-5 w-24" /></td>
                            <td className="px-4 py-4"><Skeleton className="h-5 w-20" /></td>
                            <td className="px-4 py-4"><Skeleton className="h-5 w-16" /></td>
                            <td className="px-4 py-4"><Skeleton className="h-5 w-16" /></td>
                            <td className="px-4 py-4"><Skeleton className="h-5 w-16" /></td>
                            <td className="px-4 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto" /></td>
                          </tr>
                        ))
                      ) : filteredReports.length > 0 ? (
                        filteredReports.map(report => (
                          <tr key={report.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 font-medium">{report.contractNumber}</td>
                            <td className="px-4 py-4">{report.customerName}</td>
                            <td className="px-4 py-4">{new Date(report.reportDate).toLocaleDateString()}</td>
                            <td className="px-4 py-4">
                              {report.type === 'service' && 'Service Report'}
                              {report.type === 'certification' && 'Certification'}
                              {report.type === 'audit' && 'Audit Log'}
                            </td>
                            <td className="px-4 py-4">
                              {report.status === 'draft' ? (
                                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">Draft</span>
                              ) : (
                                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">Final</span>
                              )}
                            </td>
                            <td className="px-4 py-4">{report.partsInspected.toLocaleString()}</td>
                            <td className="px-4 py-4">{report.defectsFound.toLocaleString()}</td>
                            <td className="px-4 py-4 text-right space-x-1">
                              <Button variant="ghost" size="sm" onClick={() => handleViewReport(report)}>
                                <FileText className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDownloadReport(report.id)}>
                                <Download className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={handlePrintReport}>
                                <Printer className="h-4 w-4 text-gray-500" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                            No reports found matching your search criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Reports</p>
                      <p className="text-2xl font-bold">{reports.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Finalized Reports</p>
                      <p className="text-2xl font-bold">{reports.filter(r => r.status === 'final').length}</p>
                    </div>
                    <CheckSquare className="h-8 w-8 text-green-500" />
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600 font-medium">Draft Reports</p>
                      <p className="text-2xl font-bold">{reports.filter(r => r.status === 'draft').length}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="charts" className="space-y-4">
          <ServiceReportCharts />
        </TabsContent>
        
        <TabsContent value="view" className="space-y-4">
          {selectedReport && (
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">
                    {selectedReport.type === 'service' && 'Service Report'}
                    {selectedReport.type === 'certification' && 'Certification Report'}
                    {selectedReport.type === 'audit' && 'Audit Log'}
                  </CardTitle>
                  <CardDescription>{selectedReport.contractNumber} - {selectedReport.customerName}</CardDescription>
                </div>
                <div className="flex space-x-2 mt-4 md:mt-0">
                  <Button variant="outline" className="flex items-center gap-1" onClick={() => handleDownloadReport(selectedReport.id)}>
                    <Download className="h-4 w-4" /> Download
                  </Button>
                  <Button variant="outline" className="flex items-center gap-1" onClick={handlePrintReport}>
                    <Printer className="h-4 w-4" /> Print
                  </Button>
                  <Button variant="default" className="flex items-center gap-1" onClick={() => setActiveTab('reports')}>
                    Back to List
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Contract #</p>
                      <p className="font-semibold">{selectedReport.contractNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Customer</p>
                      <p className="font-semibold">{selectedReport.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Report Date</p>
                      <p className="font-semibold">{new Date(selectedReport.reportDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <p className="font-semibold">{selectedReport.status === 'draft' ? 'Draft' : 'Final'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Parts Inspected</p>
                      <p className="font-semibold">{selectedReport.partsInspected.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Defects Found</p>
                      <p className="font-semibold">{selectedReport.defectsFound.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="border rounded-md">
                    <div className="p-4 bg-gray-50 border-b">
                      <h3 className="font-semibold">Service Report Details</h3>
                    </div>
                    <div className="p-4">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium">Part Number</th>
                            <th className="text-left py-2 font-medium">Description</th>
                            <th className="text-left py-2 font-medium">Inspected</th>
                            <th className="text-left py-2 font-medium">Defective</th>
                            <th className="text-left py-2 font-medium">Defect Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2">7500287G88</td>
                            <td className="py-2">Washer</td>
                            <td className="py-2">1,000</td>
                            <td className="py-2">45</td>
                            <td className="py-2">4.5%</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">7500288H99</td>
                            <td className="py-2">Fastener</td>
                            <td className="py-2">430</td>
                            <td className="py-2">39</td>
                            <td className="py-2">9.1%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border rounded-md">
                    <div className="p-4 bg-gray-50 border-b">
                      <h3 className="font-semibold">Defect Details</h3>
                    </div>
                    <div className="p-4">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium">Defect Type</th>
                            <th className="text-left py-2 font-medium">Quantity</th>
                            <th className="text-left py-2 font-medium">Severity</th>
                            <th className="text-left py-2 font-medium">Action Taken</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2">Improper Fitment</td>
                            <td className="py-2">28</td>
                            <td className="py-2">Major</td>
                            <td className="py-2">Rejected</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">Thread Damage</td>
                            <td className="py-2">17</td>
                            <td className="py-2">Critical</td>
                            <td className="py-2">Rejected</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">Surface Scratches</td>
                            <td className="py-2">39</td>
                            <td className="py-2">Minor</td>
                            <td className="py-2">Used As Is (Deviation Approved)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border rounded-md">
                    <div className="p-4 bg-gray-50 border-b">
                      <h3 className="font-semibold">Inspector Summary & Approval</h3>
                    </div>
                    <div className="p-4">
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500">Summary Notes</p>
                        <p className="mt-1">
                          Inspection completed per customer requirements. Major fitment issues identified in batch #45A. 
                          Thread damage appears to be a systematic issue related to supplier manufacturing process. 
                          All rejected parts have been segregated and labeled.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Inspector</p>
                          <p className="font-semibold">Luis Garcia</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Inspection Date</p>
                          <p className="font-semibold">Sept 5, 2023</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Supervisor Approval</p>
                          <p className="font-semibold">David Wilkins</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Approval Date</p>
                          <p className="font-semibold">Sept 6, 2023</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Create New Report</CardTitle>
              <CardDescription>Generate a new service report, certification, or audit log</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reportType">Report Type</Label>
                    <select 
                      id="reportType" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    >
                      <option value="service">Service Report</option>
                      <option value="certification">Certification Report</option>
                      <option value="audit">Audit Log</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="jobNumber">Job/Contract Number</Label>
                    <Input id="jobNumber" placeholder="e.g. 16-0013893-1" required />
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-semibold mb-4">Report Sections</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="includeCustomerInfo" defaultChecked />
                      <Label htmlFor="includeCustomerInfo">Customer Information</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="includeJobDetails" defaultChecked />
                      <Label htmlFor="includeJobDetails">Job Details</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="includePartsInspected" defaultChecked />
                      <Label htmlFor="includePartsInspected">Parts Inspected</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="includeDefects" defaultChecked />
                      <Label htmlFor="includeDefects">Defect Information</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="includePhotos" />
                      <Label htmlFor="includePhotos">Defect Photos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="includeTimeLogs" />
                      <Label htmlFor="includeTimeLogs">Time & Attendance Logs</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="includeApprovals" defaultChecked />
                      <Label htmlFor="includeApprovals">Approvals & Signatures</Label>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-semibold mb-4">Report Format</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-md p-4 flex flex-col items-center cursor-pointer hover:bg-gray-50">
                      <FileText className="h-10 w-10 text-blue-500 mb-2" />
                      <p className="font-medium">PDF Report</p>
                      <p className="text-xs text-gray-500">Standard format</p>
                    </div>
                    <div className="border rounded-md p-4 flex flex-col items-center cursor-pointer hover:bg-gray-50">
                      <BarChart className="h-10 w-10 text-green-500 mb-2" />
                      <p className="font-medium">Excel Export</p>
                      <p className="text-xs text-gray-500">With data tables</p>
                    </div>
                    <div className="border rounded-md p-4 flex flex-col items-center cursor-pointer hover:bg-gray-50">
                      <Printer className="h-10 w-10 text-purple-500 mb-2" />
                      <p className="font-medium">Print-Ready</p>
                      <p className="text-xs text-gray-500">Formatted for printing</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setActiveTab('reports')}>Cancel</Button>
                  <Button variant="default" onClick={() => {
                    toast({
                      title: "Report Created",
                      description: "The draft report has been created successfully",
                    });
                    setActiveTab('reports');
                  }}>
                    Create Report
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceReports;
