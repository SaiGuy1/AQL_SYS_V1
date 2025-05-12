
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatbotBubbleProps {
  unreadMessages: number;
  onClick: () => void;
}

const ChatbotBubble: React.FC<ChatbotBubbleProps> = ({ unreadMessages, onClick }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="fixed bottom-6 right-6 z-50"
            onClick={onClick}
          >
            <Button 
              className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg flex items-center justify-center relative"
              aria-label="Chat with AI Assistant"
            >
              <MessageCircle className="h-6 w-6" />
              
              {unreadMessages > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 flex items-center justify-center bg-red-500 min-w-6 h-6 rounded-full text-white"
                  variant="destructive"
                >
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </Badge>
              )}
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Chat with AQL Assistant</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ChatbotBubble;
