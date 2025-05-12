import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Paperclip, 
  FileText, 
  Image as ImageIcon, 
  File,
  Download,
  X,
  ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  _content?: string;
  _size?: string;
}

interface JobAttachmentsProps {
  attachments: Attachment[];
}

const JobAttachments: React.FC<JobAttachmentsProps> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  // Helper to determine file type
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4 mr-1" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4 mr-1" />;
    return <File className="h-4 w-4 mr-1" />;
  };

  // Helper to determine if attachment is an image
  const isImage = (attachment: Attachment) => {
    return attachment.type.startsWith('image/') || 
           (attachment._content && attachment._content.startsWith('data:image/'));
  };

  // Get content source for attachments
  const getContentSource = (attachment: Attachment) => {
    return attachment._content || attachment.url;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <Paperclip className="h-4 w-4" />
          <Badge variant="outline" className="bg-blue-50 text-blue-600 rounded-full">
            {attachments.length}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Job Attachments
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 max-h-[70vh] overflow-y-auto p-2">
          {attachments.map((attachment) => (
            <div 
              key={attachment.id} 
              className="border rounded-md overflow-hidden flex flex-col bg-white shadow-sm"
            >
              <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                {isImage(attachment) ? (
                  <img
                    src={getContentSource(attachment)}
                    alt={attachment.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <FileText className="h-16 w-16 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500 truncate max-w-full">
                      {attachment.name}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium truncate" title={attachment.name}>
                      {attachment.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {attachment._size || 'Unknown size'}
                    </p>
                  </div>
                  
                  <div className="flex">
                    <a 
                      href={getContentSource(attachment)} 
                      download={attachment.name}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Download className="h-4 w-4 text-gray-600" />
                    </a>
                    
                    <a 
                      href={getContentSource(attachment)} 
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 hover:bg-gray-200 rounded ml-1"
                    >
                      <ExternalLink className="h-4 w-4 text-gray-600" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobAttachments; 