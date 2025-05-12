
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { ChatTabProps } from './types';

const ChatTab: React.FC<ChatTabProps> = () => {
  return (
    <div className="space-y-3 md:space-y-4">
      <div className="border rounded-md h-60 md:h-80 p-3 overflow-y-auto bg-gray-50">
        <div className="flex flex-col space-y-2">
          <div className="self-start max-w-[80%] bg-white p-2 rounded-md shadow-sm">
            <div className="text-xs text-gray-500">Supervisor David (9:30 AM)</div>
            <div className="text-xs md:text-sm">How's the inspection going?</div>
          </div>
          <div className="self-end max-w-[80%] bg-blue-50 p-2 rounded-md shadow-sm">
            <div className="text-xs text-gray-500">You (9:32 AM)</div>
            <div className="text-xs md:text-sm">I found an issue with part #7500287G88-001. The threading appears damaged.</div>
          </div>
          <div className="self-start max-w-[80%] bg-white p-2 rounded-md shadow-sm">
            <div className="text-xs text-gray-500">Supervisor David (9:35 AM)</div>
            <div className="text-xs md:text-sm">Can you send a photo of the issue?</div>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Input placeholder="Type your message..." className="flex-grow text-xs md:text-sm" />
        <Button className="text-xs md:text-sm">
          <Upload className="h-3 w-3 md:h-4 md:w-4 mr-1" /> Send
        </Button>
      </div>
    </div>
  );
};

export default ChatTab;
