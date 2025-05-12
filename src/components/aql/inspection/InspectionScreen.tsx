
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Barcode, ClipboardList, MessageCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { InspectionProps } from './types';
import ScanTab from './ScanTab';
import InspectTab from './InspectTab';
import ChatTab from './ChatTab';
import ClockControl from './ClockControl';
import { useInspection } from './hooks/useInspection';
import { Button } from '@/components/ui/button';

const InspectionScreen: React.FC<InspectionProps> = () => {
  const {
    clockedIn,
    startTime,
    currentTab,
    setCurrentTab,
    defectPhotos,
    setDefectPhotos,
    barcode,
    setBarcode,
    handleClockIn,
    handleClockOut,
    handleBarcodeScan,
    handleSubmitInspection
  } = useInspection();

  const [showEmergencyInfo, setShowEmergencyInfo] = useState(false);

  // Mock emergency data - in a real app, this would come from the job context
  const mockEmergencyData = {
    procedures: "1. When evacuation alarm sounds, stop all work immediately.\n2. Follow the marked evacuation routes to the nearest exit.\n3. Do not use elevators during evacuation.\n4. Proceed to the assembly point in the main parking lot.\n5. Report to your supervisor for headcount.\n6. Do not return to the building until authorized by emergency personnel.",
    floorPlan: "/placeholder.svg"
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">Inspection Execution</CardTitle>
          <ClockControl 
            clockedIn={clockedIn} 
            startTime={startTime} 
            handleClockIn={handleClockIn} 
            handleClockOut={handleClockOut} 
          />
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button
              variant="outline"
              className="w-full flex items-center justify-between border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800"
              onClick={() => setShowEmergencyInfo(!showEmergencyInfo)}
            >
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                <span className="font-medium">Emergency Evacuation Information</span>
              </div>
              {showEmergencyInfo ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {showEmergencyInfo && (
              <div className="mt-3 border border-amber-300 rounded-md p-4 bg-amber-50">
                <h3 className="text-sm font-semibold mb-2 text-amber-800">Emergency Procedures:</h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap mb-4">
                  {mockEmergencyData.procedures}
                </div>

                {mockEmergencyData.floorPlan && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-amber-800">Evacuation Floor Plan:</h3>
                    <div 
                      className="border rounded overflow-hidden cursor-pointer"
                      onClick={() => window.open(mockEmergencyData.floorPlan, '_blank')}
                    >
                      <img 
                        src={mockEmergencyData.floorPlan} 
                        alt="Emergency evacuation floor plan" 
                        className="w-full max-h-[200px] object-contain" 
                      />
                    </div>
                    <p className="text-xs text-center mt-1 text-gray-500">
                      Click to open full size image
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="scan" disabled={!clockedIn}>
                <Barcode className="h-4 w-4 mr-2" /> Scan Barcode
              </TabsTrigger>
              <TabsTrigger value="inspect" disabled={!clockedIn}>
                <ClipboardList className="h-4 w-4 mr-2" /> Inspect Part
              </TabsTrigger>
              <TabsTrigger value="chat" disabled={!clockedIn}>
                <MessageCircle className="h-4 w-4 mr-2" /> Chat with Supervisor
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="scan">
              <ScanTab 
                barcode={barcode} 
                setBarcode={setBarcode} 
                handleBarcodeScan={handleBarcodeScan}
                clockedIn={clockedIn}
              />
            </TabsContent>
            
            <TabsContent value="inspect">
              <InspectTab 
                barcode={barcode} 
                defectPhotos={defectPhotos} 
                setDefectPhotos={setDefectPhotos} 
                handleSubmitInspection={handleSubmitInspection}
                setCurrentTab={setCurrentTab}
              />
            </TabsContent>
            
            <TabsContent value="chat">
              <ChatTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectionScreen;
