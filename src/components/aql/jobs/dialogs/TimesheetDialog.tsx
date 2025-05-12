
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Download, Pencil, Clock, DollarSign, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimesheetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  viewOnly?: boolean;
}

// Sample timesheet data
const mockTimeEntries = [
  {
    id: "1",
    inspector: "Luis Garcia",
    date: "2023-08-15",
    clockIn: "08:00",
    clockOut: "12:30",
    totalHours: 4.5,
    billable: true,
    approved: true,
    notes: "Regular inspection"
  },
  {
    id: "2",
    inspector: "Luis Garcia",
    date: "2023-08-16",
    clockIn: "08:00",
    clockOut: "14:30",
    totalHours: 6.5,
    billable: true,
    approved: false,
    notes: "Extended inspection due to additional defects"
  },
  {
    id: "3",
    inspector: "Sarah Johnson",
    date: "2023-08-15",
    clockIn: "13:00",
    clockOut: "17:30",
    totalHours: 4.5,
    billable: false,
    approved: false,
    notes: "Training session"
  }
];

const TimesheetDialog: React.FC<TimesheetDialogProps> = ({ 
  isOpen, 
  onClose, 
  job, 
  viewOnly = false 
}) => {
  const [timeEntries, setTimeEntries] = useState(mockTimeEntries);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [billableReason, setBillableReason] = useState("default");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleBillable = (id: string) => {
    if (viewOnly) return;
    
    setTimeEntries(entries => 
      entries.map(entry => 
        entry.id === id ? { ...entry, billable: !entry.billable } : entry
      )
    );
  };

  const toggleApproved = (id: string) => {
    if (viewOnly) return;
    
    setTimeEntries(entries => 
      entries.map(entry => 
        entry.id === id ? { ...entry, approved: !entry.approved } : entry
      )
    );
  };

  const startEditing = (id: string, currentNote: string) => {
    setEditingEntryId(id);
    setNote(currentNote);
  };

  const saveNote = (id: string) => {
    setTimeEntries(entries => 
      entries.map(entry => 
        entry.id === id ? { ...entry, notes: note } : entry
      )
    );
    setEditingEntryId(null);
    setNote("");
  };

  const calculateTotalHours = () => {
    return timeEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
  };

  const calculateBillableHours = () => {
    return timeEntries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + entry.totalHours, 0);
  };

  const handleApproveAll = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setTimeEntries(entries => entries.map(entry => ({ ...entry, approved: true })));
      toast.success("All timesheets approved");
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{viewOnly ? 'Timesheet Details' : 'Approve Timesheets'}</DialogTitle>
          <DialogDescription>
            Job #{job.contractNumber} - {job.customerName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col space-y-1">
                <div className="text-sm font-medium text-slate-500">Total Hours</div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-2xl font-bold">{calculateTotalHours()}</span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1">
                <div className="text-sm font-medium text-slate-500">Billable Hours</div>
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">{calculateBillableHours()}</span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1">
                <div className="text-sm font-medium text-slate-500">Non-Billable Hours</div>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-slate-500 mr-2" />
                  <span className="text-2xl font-bold">{calculateTotalHours() - calculateBillableHours()}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="text-sm font-medium text-slate-500 mb-1">Status</div>
              {timeEntries.every(e => e.approved) ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Fully Approved</Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending Approval</Badge>
              )}
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="py-3">Inspector</TableHead>
                  <TableHead className="py-3">Date</TableHead>
                  <TableHead className="py-3">Clock In/Out</TableHead>
                  <TableHead className="py-3 text-right">Hours</TableHead>
                  <TableHead className="py-3">Billable</TableHead>
                  {!viewOnly && <TableHead className="py-3">Approved</TableHead>}
                  <TableHead className="py-3">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{entry.inspector}</TableCell>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{entry.clockIn} - {entry.clockOut}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-right">
                      {entry.totalHours}h
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={entry.billable} 
                          onCheckedChange={() => toggleBillable(entry.id)}
                          disabled={viewOnly}
                          id={`billable-${entry.id}`}
                          className="data-[state=checked]:bg-blue-500"
                        />
                        {!viewOnly && (
                          <Select
                            value={billableReason}
                            onValueChange={setBillableReason}
                            disabled={!entry.billable}
                          >
                            <SelectTrigger className="h-7 w-32">
                              <SelectValue placeholder="Reason" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="training">Training</SelectItem>
                              <SelectItem value="overtime">Overtime</SelectItem>
                              <SelectItem value="rework">Rework</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                    {!viewOnly && (
                      <TableCell>
                        <Checkbox 
                          checked={entry.approved} 
                          onCheckedChange={() => toggleApproved(entry.id)}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </TableCell>
                    )}
                    <TableCell className="max-w-[200px]">
                      {editingEntryId === entry.id ? (
                        <div className="flex gap-2">
                          <Input 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="h-7 text-sm"
                          />
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2"
                            onClick={() => saveNote(entry.id)}
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-sm truncate">{entry.notes || "—"}</span>
                          {!viewOnly && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 ml-1 opacity-50 hover:opacity-100"
                              onClick={() => startEditing(entry.id, entry.notes)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter className="flex justify-between items-center w-full gap-4 pt-2 flex-wrap sm:flex-nowrap">
            <div className="flex-1">
              <Button 
                variant="outline" 
                className="gap-1"
                onClick={() => toast.success("Timesheet exported successfully")}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                {viewOnly ? "Close" : "Cancel"}
              </Button>
              {!viewOnly && (
                <Button 
                  onClick={handleApproveAll} 
                  disabled={isSubmitting || timeEntries.every(e => e.approved)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? "Processing..." : "Approve All"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimesheetDialog;
