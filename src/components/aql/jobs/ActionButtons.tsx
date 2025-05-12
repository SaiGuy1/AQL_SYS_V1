import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { UserRole } from "@/pages/AQLSystem";
import { Job } from "./types";
import { 
  Eye, 
  Edit, 
  UserPlus, 
  Download, 
  BarChart3, 
  ClipboardCheck, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Printer, 
  Lock, 
  Unlock, 
  ShieldCheck 
} from "lucide-react";
import JobDetailsDialog from './dialogs/JobDetailsDialog';
import JobEditDialog from './dialogs/JobEditDialog';
import StaffAssignmentDialog from './dialogs/StaffAssignmentDialog';
import ReportsDialog from './dialogs/ReportsDialog';
import DefectReviewDialog from './dialogs/DefectReviewDialog';
import TimesheetDialog from './dialogs/TimesheetDialog';
import BillingDialog from './dialogs/BillingDialog';
import CertificationDialog from './dialogs/CertificationDialog';
import ClockDialog from './dialogs/ClockDialog';
import DefectReportDialog from './dialogs/DefectReportDialog';

interface ActionButtonsProps {
  job: Job;
  userRole: UserRole;
  onJobUpdated?: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ job, userRole, onJobUpdated }) => {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  
  const openDialog = (dialogName: string) => {
    setActiveDialog(dialogName);
  };
  
  const closeDialog = () => {
    setActiveDialog(null);
  };
  
  // View Details button is common to all roles
  const viewDetailsButton = (
    <Button 
      variant="ghost" 
      size="sm" 
      title="View Details"
      onClick={() => openDialog('details')}
    >
      <Eye className="h-4 w-4 text-blue-500" />
    </Button>
  );
  
  // Staff Assignment dialog is used in multiple places, so create a reusable component
  const staffAssignmentDialog = (
    <StaffAssignmentDialog 
      isOpen={activeDialog === 'staffAssignment'} 
      onClose={closeDialog} 
      job={job}
      onJobUpdated={onJobUpdated}
    />
  );
  
  switch (userRole) {
    case 'admin':
      return (
        <>
          {viewDetailsButton}
          <Button 
            variant="ghost" 
            size="sm" 
            title="Edit Job"
            onClick={() => openDialog('edit')}
          >
            <Edit className="h-4 w-4 text-amber-500" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            title="Assign Staff"
            onClick={() => openDialog('staffAssignment')}
          >
            <UserPlus className="h-4 w-4 text-purple-500" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            title="Export Report"
            onClick={() => openDialog('reports')}
          >
            <Download className="h-4 w-4 text-green-500" />
          </Button>

          {/* Dialogs */}
          <JobDetailsDialog 
            isOpen={activeDialog === 'details'} 
            onClose={closeDialog} 
            job={job} 
          />
          <JobEditDialog 
            isOpen={activeDialog === 'edit'} 
            onClose={closeDialog} 
            job={job} 
            onJobUpdated={onJobUpdated}
          />
          {staffAssignmentDialog}
          <ReportsDialog 
            isOpen={activeDialog === 'reports'} 
            onClose={closeDialog} 
            job={job} 
          />
        </>
      );
      
    case 'manager':
      return (
        <>
          {viewDetailsButton}
          <Button 
            variant="ghost" 
            size="sm" 
            title="Edit Job"
            onClick={() => openDialog('edit')}
          >
            <Edit className="h-4 w-4 text-amber-500" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            title="Assign Staff"
            onClick={() => openDialog('staffAssignment')}
          >
            <UserPlus className="h-4 w-4 text-purple-500" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            title="Run Reports"
            onClick={() => openDialog('reports')}
          >
            <BarChart3 className="h-4 w-4 text-indigo-500" />
          </Button>

          {/* Dialogs */}
          <JobDetailsDialog 
            isOpen={activeDialog === 'details'} 
            onClose={closeDialog} 
            job={job} 
          />
          <JobEditDialog 
            isOpen={activeDialog === 'edit'} 
            onClose={closeDialog} 
            job={job} 
            onJobUpdated={onJobUpdated}
          />
          {staffAssignmentDialog}
          <ReportsDialog 
            isOpen={activeDialog === 'reports'} 
            onClose={closeDialog} 
            job={job} 
          />
        </>
      );
      
    case 'supervisor':
      return (
        <>
          {viewDetailsButton}
          <Button 
            variant="ghost" 
            size="sm" 
            title="Assign Inspector"
            onClick={() => openDialog('staffAssignment')}
          >
            <UserPlus className="h-4 w-4 text-purple-500" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            title="Approve Timesheet"
            onClick={() => openDialog('timesheet')}
          >
            <ClipboardCheck className="h-4 w-4 text-green-500" />
          </Button>
          {job.status === 'needs-review' && (
            <Button 
              variant="ghost" 
              size="sm" 
              title="Review Defects"
              onClick={() => openDialog('defectReview')}
            >
              <AlertCircle className="h-4 w-4 text-red-500" />
            </Button>
          )}

          {/* Dialogs */}
          <JobDetailsDialog 
            isOpen={activeDialog === 'details'} 
            onClose={closeDialog} 
            job={job} 
          />
          {staffAssignmentDialog}
          <TimesheetDialog 
            isOpen={activeDialog === 'timesheet'} 
            onClose={closeDialog} 
            job={job} 
          />
          {job.status === 'needs-review' && (
            <DefectReviewDialog 
              isOpen={activeDialog === 'defectReview'} 
              onClose={closeDialog} 
              job={job} 
            />
          )}
        </>
      );
      
    case 'inspector':
      return (
        <>
          {viewDetailsButton}
          <Button 
            variant="ghost" 
            size="sm" 
            title="Clock In/Out"
            onClick={() => openDialog('clock')}
          >
            <Clock className="h-4 w-4 text-green-500" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            title="Report Defect"
            onClick={() => openDialog('defectReport')}
          >
            <AlertCircle className="h-4 w-4 text-red-500" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            title="Certification"
            onClick={() => openDialog('certification')}
          >
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </Button>

          {/* Dialogs */}
          <JobDetailsDialog 
            isOpen={activeDialog === 'details'} 
            onClose={closeDialog} 
            job={job} 
          />
          <ClockDialog 
            isOpen={activeDialog === 'clock'} 
            onClose={closeDialog} 
            job={job} 
          />
          <DefectReportDialog 
            isOpen={activeDialog === 'defectReport'} 
            onClose={closeDialog} 
            job={job} 
          />
          <CertificationDialog 
            isOpen={activeDialog === 'certification'} 
            onClose={closeDialog} 
            job={job} 
          />
        </>
      );
      
    case 'hr':
      return (
        <>
          {viewDetailsButton}
          <Button 
            variant="ghost" 
            size="sm" 
            title="View Timesheet"
            onClick={() => openDialog('timesheet')}
          >
            <Calendar className="h-4 w-4 text-blue-500" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            title="Check Certification"
            onClick={() => openDialog('certification')}
          >
            <ShieldCheck className="h-4 w-4 text-purple-500" />
          </Button>

          {/* Dialogs */}
          <JobDetailsDialog 
            isOpen={activeDialog === 'details'} 
            onClose={closeDialog} 
            job={job} 
          />
          <TimesheetDialog 
            isOpen={activeDialog === 'timesheet'} 
            onClose={closeDialog} 
            job={job} 
            viewOnly={true}
          />
          <CertificationDialog 
            isOpen={activeDialog === 'certification'} 
            onClose={closeDialog} 
            job={job} 
            viewOnly={true}
          />
        </>
      );
      
    case 'accounting':
      return (
        <>
          {viewDetailsButton}
          <Button 
            variant="ghost" 
            size="sm" 
            title="Billing Report"
            onClick={() => openDialog('billing')}
          >
            <Printer className="h-4 w-4 text-green-500" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            title={job.billingStatus === 'pending' ? "Mark as Billed" : "Adjust Billing"}
            onClick={() => openDialog('billingAdjust')}
          >
            {job.billingStatus === 'pending' ? (
              <Lock className="h-4 w-4 text-amber-500" />
            ) : (
              <Unlock className="h-4 w-4 text-blue-500" />
            )}
          </Button>

          {/* Dialogs */}
          <JobDetailsDialog 
            isOpen={activeDialog === 'details'} 
            onClose={closeDialog} 
            job={job} 
          />
          <BillingDialog 
            isOpen={activeDialog === 'billing' || activeDialog === 'billingAdjust'} 
            onClose={closeDialog} 
            job={job} 
            isAdjustment={activeDialog === 'billingAdjust'}
          />
        </>
      );
      
    case 'customer':
      return (
        <>
          {viewDetailsButton}
          <Button 
            variant="ghost" 
            size="sm" 
            title="Download Report"
            onClick={() => openDialog('reports')}
          >
            <Download className="h-4 w-4 text-green-500" />
          </Button>

          {/* Dialogs */}
          <JobDetailsDialog 
            isOpen={activeDialog === 'details'} 
            onClose={closeDialog} 
            job={job} 
          />
          <ReportsDialog 
            isOpen={activeDialog === 'reports'} 
            onClose={closeDialog} 
            job={job} 
            customerView={true}
          />
        </>
      );
      
    default:
      return <>{viewDetailsButton}</>;
  }
};

export default ActionButtons;
