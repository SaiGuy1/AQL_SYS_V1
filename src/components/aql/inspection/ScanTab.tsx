import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Barcode, Camera } from "lucide-react";
import { ScanTabProps } from './types';

const ScanTab: React.FC<ScanTabProps> = ({ 
  barcode, 
  setBarcode, 
  handleBarcodeScan,
  clockedIn,
  scannedBarcodes
}) => {
  // Function to format time relative to now (e.g. "5 minutes ago")
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const scanTime = new Date(timestamp);
    const diffMs = now.getTime() - scanTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  // Get the current job information from localStorage
  const jobInfo = (() => {
    try {
      // Get the selected job ID from localStorage
      const jobId = localStorage.getItem('inspection_selectedJobId');
      if (!jobId) return null;
      
      // Get the job data
      const jobsData = localStorage.getItem('jobs');
      if (!jobsData) return null;
      
      const jobs = JSON.parse(jobsData);
      return jobs.find((job: any) => job.id === jobId) || null;
    } catch (error) {
      console.error('Error retrieving job information:', error);
      return null;
    }
  })();

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-3 rounded-md mb-4">
        <h3 className="font-semibold mb-2 text-sm md:text-base">Job Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm">
          <div className="truncate"><span className="font-medium">Contract #:</span> {jobInfo?.id || 'Unknown'}</div>
          <div className="truncate"><span className="font-medium">Customer:</span> {jobInfo?.customer?.name || 'Unknown'}</div>
          <div className="truncate"><span className="font-medium">Part Name:</span> {jobInfo?.parts?.[0]?.partName || jobInfo?.title?.split(' ')[0] || 'Demo Part'}</div>
          <div className="truncate"><span className="font-medium">Part Number:</span> {jobInfo?.parts?.[0]?.partNumber || `PN-${jobInfo?.id?.substring(4) || '12345'}`}</div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-end">
          <div className="flex-grow">
            <Label htmlFor="barcode" className="text-sm md:text-base">Scan or Enter Barcode</Label>
            <Input 
              id="barcode" 
              placeholder="Scan barcode or enter manually..." 
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              disabled={!clockedIn}
              className="text-xs md:text-sm"
            />
          </div>
          <Button 
            className="flex-shrink-0 flex items-center text-xs md:text-sm" 
            onClick={handleBarcodeScan}
            disabled={!clockedIn || !barcode}
          >
            <Barcode className="h-3 w-3 md:h-4 md:w-4 mr-1" /> Scan Barcode
          </Button>
        </div>
        
        <div className="border border-dashed border-gray-300 rounded-md p-4 md:p-8 text-center">
          <Barcode className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-xs md:text-sm text-gray-500">Or use camera to scan barcode</p>
          <Button variant="outline" className="mt-2 text-xs md:text-sm" disabled={!clockedIn}>
            <Camera className="h-3 w-3 md:h-4 md:w-4 mr-1" /> Open Camera
          </Button>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded-md">
          <h3 className="font-semibold mb-2 text-yellow-700 text-sm md:text-base">Recent Scans</h3>
          {scannedBarcodes && scannedBarcodes.length > 0 ? (
            <ul className="space-y-2 text-xs md:text-sm">
              {scannedBarcodes.slice().reverse().map((scan, index) => (
                <li key={index} className="flex justify-between">
                  <span className="truncate mr-2">{scan.barcode}</span>
                  <span className="flex-shrink-0">{getRelativeTime(scan.timestamp)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No recent scans. Start scanning parts to see them here.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanTab;
