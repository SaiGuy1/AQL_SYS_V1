
import React from 'react';
import { Button } from "@/components/ui/button";
import { Clock, TimerReset } from "lucide-react";
import { ClockControlProps } from './types';

const ClockControl: React.FC<ClockControlProps> = ({ 
  clockedIn, 
  startTime, 
  handleClockIn, 
  handleClockOut 
}) => {
  return (
    <div className="flex items-center space-x-2">
      {clockedIn ? (
        <>
          <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center">
            <Clock className="h-4 w-4 mr-1" /> Clocked In: {startTime?.toLocaleTimeString()}
          </span>
          <Button 
            variant="destructive" 
            className="flex items-center" 
            onClick={handleClockOut}
          >
            <TimerReset className="h-4 w-4 mr-1" /> Clock Out
          </Button>
        </>
      ) : (
        <Button 
          variant="default" 
          className="flex items-center" 
          onClick={handleClockIn}
        >
          <Clock className="h-4 w-4 mr-1" /> Clock In
        </Button>
      )}
    </div>
  );
};

export default ClockControl;
