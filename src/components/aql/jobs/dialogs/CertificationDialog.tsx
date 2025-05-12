
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Job } from "../types";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, FileText, Download, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CertificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  viewOnly?: boolean;
}

// Sample certification data
const mockCertifications = [
  {
    id: "1",
    name: "Basic Quality Inspection",
    status: "valid",
    expiration: "2024-06-15",
    progress: 100,
    required: true
  },
  {
    id: "2",
    name: "Surface Defect Analysis",
    status: "valid",
    expiration: "2024-03-22",
    progress: 100,
    required: true
  },
  {
    id: "3",
    name: "Automotive Standards Compliance",
    status: "expiring",
    expiration: "2023-09-30",
    progress: 100,
    required: true
  },
  {
    id: "4",
    name: "Advanced Quality Control",
    status: "in-progress",
    expiration: null,
    progress: 65,
    required: false
  },
  {
    id: "5",
    name: "Materials Testing",
    status: "not-started",
    expiration: null,
    progress: 0,
    required: false
  }
];

const CertificationDialog: React.FC<CertificationDialogProps> = ({ 
  isOpen, 
  onClose, 
  job,
  viewOnly = false
}) => {
  const [certifications, setCertifications] = useState(mockCertifications);
  const [downloading, setDownloading] = useState<string | null>(null);
  
  const handleDownloadCertificate = (id: string, name: string) => {
    setDownloading(id);
    
    // Simulate download
    setTimeout(() => {
      toast.success(`${name} certificate downloaded`);
      setDownloading(null);
    }, 1200);
  };
  
  const handleStartCertification = (id: string, name: string) => {
    toast.success(`Starting ${name} certification process`);
    
    // Update certification status
    setCertifications(certs =>
      certs.map(cert =>
        cert.id === id ? { ...cert, status: "in-progress", progress: 5 } : cert
      )
    );
  };
  
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" /> Valid
          </Badge>
        );
      case "expiring":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
            <Clock className="h-3 w-3 mr-1" /> Expiring Soon
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <AlertCircle className="h-3 w-3 mr-1" /> Expired
          </Badge>
        );
      case "in-progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
            Not Started
          </Badge>
        );
    }
  };
  
  const getRequiredCertCount = () => {
    return certifications.filter(cert => cert.required).length;
  };
  
  const getValidCertCount = () => {
    return certifications.filter(cert => cert.status === "valid" && cert.required).length;
  };
  
  const calculateCertificationCompliance = () => {
    const required = getRequiredCertCount();
    const valid = getValidCertCount();
    return required > 0 ? (valid / required) * 100 : 100;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{viewOnly ? 'Certification Status' : 'Manage Certifications'}</DialogTitle>
          <DialogDescription>
            {viewOnly ? 'View certification status for this job' : 'Update your certifications for this job'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/40 p-4 rounded-md space-y-2">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">Certification Compliance</div>
              <div className="text-sm">{getValidCertCount()}/{getRequiredCertCount()} Required</div>
            </div>
            <Progress value={calculateCertificationCompliance()} className="h-2" />
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certifications.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell className="font-medium">{cert.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {renderStatusBadge(cert.status)}
                        {cert.status === 'in-progress' && (
                          <Progress value={cert.progress} className="h-1.5 mt-1" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cert.expiration ? (
                        <span>{new Date(cert.expiration).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {cert.required ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground">Optional</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {cert.status === 'valid' || cert.status === 'expiring' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            disabled={downloading === cert.id}
                            onClick={() => handleDownloadCertificate(cert.id, cert.name)}
                          >
                            {downloading === cert.id ? (
                              <div className="flex items-center gap-1">
                                <div className="animate-spin h-3 w-3 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
                                <span>Downloading</span>
                              </div>
                            ) : (
                              <>
                                <FileText className="h-3.5 w-3.5 mr-1" />
                                Certificate
                              </>
                            )}
                          </Button>
                        ) : !viewOnly && cert.status === 'not-started' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => handleStartCertification(cert.id, cert.name)}
                          >
                            Start
                          </Button>
                        ) : !viewOnly && cert.status === 'in-progress' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => toast.success("Continuing certification process")}
                          >
                            Continue
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CertificationDialog;
