
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
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, MessageCircle, Image as ImageIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DefectReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

// Sample defect data
const mockDefects = [
  {
    id: "1",
    type: "Surface Scratch",
    count: 3,
    severity: "minor",
    reportedBy: "Luis Garcia",
    date: "2023-08-15",
    status: "pending",
    comments: [
      {
        author: "Luis Garcia",
        text: "Found during visual inspection",
        date: "2023-08-15T10:30:00"
      }
    ],
    images: ["https://placehold.co/300x200/png"]
  },
  {
    id: "2",
    type: "Missing Component",
    count: 1,
    severity: "critical",
    reportedBy: "Luis Garcia",
    date: "2023-08-15",
    status: "pending",
    comments: [
      {
        author: "Luis Garcia",
        text: "This part is completely missing from assembly",
        date: "2023-08-15T11:15:00"
      }
    ],
    images: ["https://placehold.co/300x200/png", "https://placehold.co/300x200/png"]
  }
];

const DefectReviewDialog: React.FC<DefectReviewDialogProps> = ({ isOpen, onClose, job }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [comment, setComment] = useState("");
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleApprove = (defectId: string) => {
    setIsSubmitting(true);
    setSelectedDefectId(defectId);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("Defect approved successfully");
      setIsSubmitting(false);
      setSelectedDefectId(null);
    }, 800);
  };
  
  const handleReject = (defectId: string) => {
    if (!comment.trim()) {
      toast.error("Please provide a reason for rejecting");
      return;
    }
    
    setIsSubmitting(true);
    setSelectedDefectId(defectId);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("Defect rejected successfully");
      setIsSubmitting(false);
      setSelectedDefectId(null);
      setComment("");
    }, 800);
  };
  
  // Filter defects based on active tab
  const filteredDefects = mockDefects.filter(defect => {
    if (activeTab === "all") return true;
    if (activeTab === "minor") return defect.severity === "minor";
    if (activeTab === "critical") return defect.severity === "critical";
    return true;
  });
  
  const renderSeverityBadge = (severity: string) => {
    if (severity === "minor") {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          Minor
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
          Critical
        </Badge>
      );
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Defects</DialogTitle>
          <DialogDescription>
            Job #{job.contractNumber} - {job.defects} defects reported
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({mockDefects.length})</TabsTrigger>
              <TabsTrigger value="minor">Minor ({mockDefects.filter(d => d.severity === "minor").length})</TabsTrigger>
              <TabsTrigger value="critical">Critical ({mockDefects.filter(d => d.severity === "critical").length})</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {filteredDefects.map(defect => (
              <div key={defect.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{defect.type} ({defect.count})</h4>
                    <div className="text-sm text-muted-foreground">
                      Reported by {defect.reportedBy} on {new Date(defect.date).toLocaleDateString()}
                    </div>
                  </div>
                  {renderSeverityBadge(defect.severity)}
                </div>
                
                {defect.images.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <ImageIcon className="h-4 w-4" />
                      Images:
                    </div>
                    {defect.images.map((img, idx) => (
                      <img 
                        key={idx} 
                        src={img} 
                        alt={`Defect ${defect.id} image ${idx + 1}`} 
                        className="h-20 w-auto rounded border"
                      />
                    ))}
                  </div>
                )}
                
                <div className="bg-muted/50 p-3 rounded-md">
                  <h5 className="text-sm font-medium mb-2">Comments</h5>
                  {defect.comments.map((comment, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{comment.author[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <div>
                          <span className="font-medium">{comment.author}</span>
                          <span className="text-muted-foreground ml-2">
                            {new Date(comment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p>{comment.text}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-3 space-y-2">
                    <Textarea 
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="outline"
                    className="text-red-600"
                    onClick={() => handleReject(defect.id)}
                    disabled={isSubmitting && selectedDefectId === defect.id}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    className="text-green-600"
                    onClick={() => handleApprove(defect.id)}
                    disabled={isSubmitting && selectedDefectId === defect.id}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button onClick={onClose}>Done</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DefectReviewDialog;
