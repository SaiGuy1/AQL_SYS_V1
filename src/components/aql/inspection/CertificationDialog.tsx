import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import CertificationFlow from './CertificationFlow';
import { Job } from '@/types/aql';
import { CertificationQuestion } from '@/services/aqlService';

// Extend Job interface to include certificationQuestions
interface ExtendedJob extends Job {
  certificationQuestions?: CertificationQuestion[];
}

interface CertificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  job: ExtendedJob;
}

const CertificationDialog: React.FC<CertificationDialogProps> = ({
  isOpen,
  onClose,
  onComplete,
  job
}) => {
  // Check if certification was previously completed
  useEffect(() => {
    const certificationCompleted = localStorage.getItem(`certification_completed_${job?.id}`);
    if (certificationCompleted === 'true' && isOpen) {
      // Auto-complete if already done
      onComplete();
    }
  }, [isOpen, job?.id, onComplete]);

  const handleCertificationComplete = () => {
    // Save certification completion status to localStorage
    if (job?.id) {
      localStorage.setItem(`certification_completed_${job.id}`, 'true');
    }
    onComplete();
  };

  // Sample job data
  const safetyRequirements = job?.safetyRequirements || [
    "Wear safety glasses and gloves at all times",
    "Use proper lifting techniques for parts over 20 pounds",
    "Be aware of moving equipment in the inspection area",
    "Report any safety concerns to your supervisor immediately",
    "Do not remove safety guards from equipment"
  ];

  const instructions = job?.instructions || 
    "1. Scan each part barcode before inspection\n\n" +
    "2. Visually inspect all surfaces for defects\n\n" +
    "3. Check for proper assembly of all components\n\n" +
    "4. Verify part dimensions against specifications\n\n" +
    "5. Document all findings in the inspection system\n\n" +
    "6. Tag defective parts for rework or rejection";

  const defectGuidelines = job?.defectGuidelines ||
    "Critical defects: Any issue that affects safety, functionality, or regulatory compliance. Must be reported immediately.\n\n" +
    "Major defects: Issues that affect appearance or durability but not functionality. Should be documented with photos.\n\n" +
    "Minor defects: Cosmetic issues that don't impact performance. Document but parts may still be accepted.\n\n" +
    "When in doubt about a defect's severity, consult with your supervisor before proceeding.";

  // Get certification questions from the job if available
  const certificationQuestions = job?.certificationQuestions || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <CertificationFlow
          jobTitle={job?.title || "Inspection Task"}
          safetyRequirements={safetyRequirements}
          instructions={instructions}
          defectGuidelines={defectGuidelines}
          certificationQuestions={certificationQuestions}
          onComplete={handleCertificationComplete}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CertificationDialog;
