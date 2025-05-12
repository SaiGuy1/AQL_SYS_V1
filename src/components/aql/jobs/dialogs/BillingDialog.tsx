
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer, DollarSign, CalendarDays } from "lucide-react";

interface BillingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  isAdjustment?: boolean;
}

// Sample billing data
const mockBillingItems = [
  {
    id: "1",
    description: "Standard Inspection",
    hours: 4.5,
    rate: 65,
    amount: 292.5,
    date: "2023-08-15",
    inspector: "Luis Garcia",
    billable: true,
  },
  {
    id: "2",
    description: "Extended Inspection",
    hours: 6.5,
    rate: 65,
    amount: 422.5,
    date: "2023-08-16",
    inspector: "Luis Garcia",
    billable: true,
  },
  {
    id: "3",
    description: "Training Session",
    hours: 4.5,
    rate: 65,
    amount: 292.5,
    date: "2023-08-15",
    inspector: "Sarah Johnson",
    billable: false,
  }
];

const BillingDialog: React.FC<BillingDialogProps> = ({ 
  isOpen, 
  onClose, 
  job,
  isAdjustment = false
}) => {
  const [billingItems, setBillingItems] = useState(mockBillingItems);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [poNumber, setPoNumber] = useState("PO-12345");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toggleBillable = (id: string) => {
    setBillingItems(items => 
      items.map(item => 
        item.id === id ? { ...item, billable: !item.billable } : item
      )
    );
  };
  
  const calculateTotal = () => {
    return billingItems
      .filter(item => item.billable)
      .reduce((sum, item) => sum + item.amount, 0);
  };
  
  const handleAdjustRate = (id: string, newRate: number) => {
    setBillingItems(items =>
      items.map(item =>
        item.id === id ? { ...item, rate: newRate, amount: item.hours * newRate } : item
      )
    );
  };
  
  const handleBillJob = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("Job billed successfully");
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };
  
  const handleUpdateBilling = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("Billing information updated");
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isAdjustment ? 'Adjust Billing' : 'Billing Report'}</DialogTitle>
          <DialogDescription>
            Job #{job.contractNumber} - {job.customerName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <div className="flex items-center mt-1">
                <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                <Input 
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="poNumber">PO Number</Label>
              <div className="flex items-center mt-1">
                <FileBox className="h-4 w-4 mr-2 text-muted-foreground" />
                <Input 
                  id="poNumber"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="billingStatus">Status</Label>
              <div className="mt-1">
                <Badge 
                  variant="outline" 
                  className={
                    job.billingStatus === 'pending' ? "bg-yellow-50 text-yellow-700 border-yellow-300" :
                    job.billingStatus === 'billed' ? "bg-blue-50 text-blue-700 border-blue-300" :
                    "bg-green-50 text-green-700 border-green-300"
                  }
                >
                  {job.billingStatus === 'pending' ? 'Pending' :
                  job.billingStatus === 'billed' ? 'Billed' : 'Paid'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Billable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell>{item.inspector}</TableCell>
                    <TableCell>{item.hours}</TableCell>
                    <TableCell>
                      {isAdjustment ? (
                        <div className="flex items-center">
                          <span className="mr-1">$</span>
                          <Input 
                            type="number" 
                            value={item.rate} 
                            onChange={(e) => handleAdjustRate(item.id, parseFloat(e.target.value))} 
                            className="w-16 h-7"
                          />
                        </div>
                      ) : (
                        <span>${item.rate}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">${item.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Checkbox 
                        checked={item.billable} 
                        onCheckedChange={() => toggleBillable(item.id)}
                        disabled={!isAdjustment && job.billingStatus !== 'pending'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={5} className="text-right font-medium">Total:</TableCell>
                  <TableCell colSpan={2} className="font-bold">${calculateTotal().toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter className="flex justify-between w-full gap-4 flex-wrap sm:flex-nowrap">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="gap-1"
                onClick={() => toast.success("Invoice printed successfully")}
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button 
                variant="outline" 
                className="gap-1"
                onClick={() => toast.success("Invoice exported successfully")}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {isAdjustment ? (
                <Button 
                  variant="default" 
                  onClick={handleUpdateBilling} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Billing"}
                </Button>
              ) : job.billingStatus === 'pending' && (
                <Button 
                  className="gap-1" 
                  onClick={handleBillJob} 
                  disabled={isSubmitting}
                >
                  <DollarSign className="h-4 w-4" />
                  {isSubmitting ? "Processing..." : "Bill Job"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillingDialog;

// Helper component for file icon
const FileBox = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M3.5 2C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13H11.5C11.7761 13 12 12.7761 12 12.5V6H8.5C8.22386 6 8 5.77614 8 5.5V2H3.5ZM9 2.70711L11.2929 5H9V2.70711ZM2 2.5C2 1.67157 2.67157 1 3.5 1H8.5C8.63261 1 8.75979 1.05268 8.85355 1.14645L12.8536 5.14645C12.9473 5.24021 13 5.36739 13 5.5V12.5C13 13.3284 12.3284 14 11.5 14H3.5C2.67157 14 2 13.3284 2 12.5V2.5Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    ></path>
  </svg>
);
