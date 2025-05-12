
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Paperclip, Loader2, Download, FileImage, Bot, ArrowUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  attachments?: {
    type: 'image' | 'pdf' | 'report';
    url: string;
    name: string;
  }[];
  isLoading?: boolean;
}

interface SuggestedQuestion {
  id: string;
  text: string;
}

interface ChatbotProps {
  onClose: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AQL AI Assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const suggestedQuestions: SuggestedQuestion[] = [
    { id: '1', text: 'What\'s the status of my latest job?' },
    { id: '2', text: 'Show me recent defects reported' },
    { id: '3', text: 'I need to create a new job request' },
    { id: '4', text: 'Can I get a service report?' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      generateBotResponse(message);
    }, 1000);
  };

  const generateBotResponse = (userMessage: string) => {
    setIsTyping(false);
    
    let botResponse: Message;
    
    // Simple keyword matching for demo purposes
    if (userMessage.toLowerCase().includes('status') || userMessage.toLowerCase().includes('job')) {
      botResponse = {
        id: Date.now().toString(),
        content: 'Job #69-0010039 is currently in progress. Assigned to David Wilkins at Detroit, MI. Estimated completion: Tomorrow at 5:00 PM. 156 defects found so far.',
        sender: 'bot',
        timestamp: new Date(),
      };
    } else if (userMessage.toLowerCase().includes('defect') || userMessage.toLowerCase().includes('issue')) {
      botResponse = {
        id: Date.now().toString(),
        content: 'In your latest job, we identified 156 defects. Major categories include "Rat Holes Present" (42 instances) and "White Locking Tab" (31 instances). Would you like to see the detailed report?',
        sender: 'bot',
        timestamp: new Date(),
        attachments: [
          {
            type: 'image',
            url: 'https://via.placeholder.com/150',
            name: 'defect-sample.jpg'
          }
        ]
      };
    } else if (userMessage.toLowerCase().includes('create') || userMessage.toLowerCase().includes('new job')) {
      botResponse = {
        id: Date.now().toString(),
        content: 'I can help you create a new job request. Please provide the following details:\n\n1. Customer name\n2. Job location\n3. Part numbers to inspect\n4. Required start date',
        sender: 'bot',
        timestamp: new Date(),
      };
    } else if (userMessage.toLowerCase().includes('report') || userMessage.toLowerCase().includes('download')) {
      botResponse = {
        id: Date.now().toString(),
        content: 'Here\'s the latest service report for Job #69-0010039. It includes all inspection details, defect counts, and certifications.',
        sender: 'bot',
        timestamp: new Date(),
        attachments: [
          {
            type: 'pdf',
            url: '#',
            name: 'Service_Report_69-0010039.pdf'
          }
        ]
      };
    } else {
      botResponse = {
        id: Date.now().toString(),
        content: 'I understand you\'re asking about "' + userMessage + '". To best assist you, could you provide more details about your specific request?',
        sender: 'bot',
        timestamp: new Date(),
      };
    }
    
    setMessages(prev => [...prev, botResponse]);
  };

  const handleSuggestedQuestion = (question: string) => {
    setMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleAttachmentUpload = () => {
    toast({
      title: "Upload feature",
      description: "File upload functionality would be implemented here.",
    });
  };

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-[380px] h-[500px] shadow-xl border-blue-100 flex flex-col animate-fade-in">
      <CardHeader className="bg-blue-50 rounded-t-lg border-b border-blue-100 py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <img 
                src="/lovable-uploads/b85bc411-3664-4efd-82dd-3b57cc2dbc33.png" 
                alt="Bull AI Logo" 
                className="h-5 w-5"
              />
            </div>
            <div>
              <CardTitle className="text-base font-medium">AQL AI Assistant</CardTitle>
              <p className="text-xs text-gray-500 flex items-center">
                Powered by Bull AI
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-xl p-3 ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-line">{msg.content}</p>
              
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {msg.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white bg-opacity-10 p-2 rounded-md">
                      {attachment.type === 'image' ? (
                        <FileImage className="h-4 w-4" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span className="text-sm">{attachment.name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 ml-auto rounded-full"
                        onClick={() => toast({
                          title: "Download started",
                          description: `Downloading ${attachment.name}`,
                        })}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-xs opacity-70 mt-1 text-right">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-xl p-3 bg-gray-100 text-gray-800">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </CardContent>
      
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex flex-wrap gap-2 mb-2">
          {suggestedQuestions.map((question) => (
            <Badge 
              key={question.id}
              variant="outline" 
              className="cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => handleSuggestedQuestion(question.text)}
            >
              {question.text}
            </Badge>
          ))}
        </div>
      </div>
      
      <CardFooter className="p-4 pt-0">
        <div className="flex w-full items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 shrink-0" 
            onClick={handleAttachmentUpload}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="h-9"
          />
          <Button 
            className="h-9 w-9 shrink-0" 
            size="icon"
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default Chatbot;
