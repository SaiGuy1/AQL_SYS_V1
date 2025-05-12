
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  SlidersHorizontal,
  Eye,
  Download,
  Filter
} from 'lucide-react';
import { Defect } from '../jobs/types';
import { useToast } from "@/hooks/use-toast";

interface DefectTableProps {
  defects: Defect[];
  canManageDefects: boolean;
  onUpdateStatus: (defectId: string, newStatus: Defect['status']) => void;
  loading: boolean;
}

const DefectTable: React.FC<DefectTableProps> = ({
  defects,
  canManageDefects,
  onUpdateStatus,
  loading
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Defect['status'] | 'all'>('all');
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  
  // Handler to approve a defect
  const handleApprove = (defectId: string) => {
    onUpdateStatus(defectId, 'approved');
  };
  
  // Handler to reject a defect
  const handleReject = (defectId: string) => {
    onUpdateStatus(defectId, 'rejected');
  };
  
  // Handler to view defect details
  const handleViewDetails = (defect: Defect) => {
    setSelectedDefect(defect);
  };
  
  // Filter defects based on search term and status filter
  const filteredDefects = defects.filter(defect => {
    const matchesSearch = defect.defectTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          defect.reportedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || defect.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Status badge component
  const StatusBadge = ({ status }: { status: Defect['status'] }) => {
    switch (status) {
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'reworked':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Reworked</Badge>;
      default:
        return null;
    }
  };

  const downloadDefectReport = () => {
    toast({
      title: "Download Started",
      description: "Your defect report is being prepared for download."
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">Defect Records</CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search defects..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            
            <Select 
              value={statusFilter} 
              onValueChange={(value) => setStatusFilter(value as Defect['status'] | 'all')}
            >
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reworked">Reworked</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-2.5"
              onClick={downloadDefectReport}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredDefects.length > 0 ? (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Defect Type</TableHead>
                  <TableHead className="font-semibold">Count</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Inspector</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDefects.map((defect) => (
                  <TableRow key={defect.id}>
                    <TableCell className="font-medium">{defect.defectTypeName}</TableCell>
                    <TableCell>{defect.count}</TableCell>
                    <TableCell>{defect.date}</TableCell>
                    <TableCell>{defect.reportedBy}</TableCell>
                    <TableCell>
                      <StatusBadge status={defect.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8"
                              onClick={() => handleViewDetails(defect)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Defect Details</DialogTitle>
                              <DialogDescription>
                                Detailed information about the reported defect
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedDefect && (
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="text-sm font-medium text-right">Defect Type:</span>
                                  <span className="col-span-3">{selectedDefect.defectTypeName}</span>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="text-sm font-medium text-right">Count:</span>
                                  <span className="col-span-3">{selectedDefect.count}</span>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="text-sm font-medium text-right">Date:</span>
                                  <span className="col-span-3">{selectedDefect.date}</span>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="text-sm font-medium text-right">Shift:</span>
                                  <span className="col-span-3">{selectedDefect.shift}</span>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="text-sm font-medium text-right">Reported By:</span>
                                  <span className="col-span-3">{selectedDefect.reportedBy}</span>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <span className="text-sm font-medium text-right">Status:</span>
                                  <span className="col-span-3">
                                    <StatusBadge status={selectedDefect.status} />
                                  </span>
                                </div>
                                {selectedDefect.notes && (
                                  <div className="grid grid-cols-4 gap-4">
                                    <span className="text-sm font-medium text-right">Notes:</span>
                                    <div className="col-span-3 bg-gray-50 p-3 rounded-md text-sm">
                                      {selectedDefect.notes}
                                    </div>
                                  </div>
                                )}
                                {selectedDefect.images && selectedDefect.images.length > 0 && (
                                  <div className="grid grid-cols-4 gap-4">
                                    <span className="text-sm font-medium text-right">Images:</span>
                                    <div className="col-span-3 flex flex-wrap gap-2">
                                      {selectedDefect.images.map((image, index) => (
                                        <img 
                                          key={index} 
                                          src={image} 
                                          alt={`Defect ${index + 1}`} 
                                          className="h-32 w-auto rounded-md border object-cover"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <DialogFooter>
                              {canManageDefects && selectedDefect?.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => {
                                      handleReject(selectedDefect.id);
                                      document.body.click(); // Close dialog
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                  <Button 
                                    onClick={() => {
                                      handleApprove(selectedDefect.id);
                                      document.body.click(); // Close dialog
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                </div>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        {canManageDefects && defect.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8"
                              onClick={() => handleReject(defect.id)}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Reject
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-8"
                              onClick={() => handleApprove(defect.id)}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">No defects found</p>
            <p className="text-gray-400 text-sm">
              {searchTerm || statusFilter !== 'all' 
                ? "Try adjusting your search or filter criteria" 
                : "No defect records available for this job"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DefectTable;
