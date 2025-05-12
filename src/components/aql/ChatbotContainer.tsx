
import React, { useState } from 'react';
import ChatbotBubble from './ChatbotBubble';
import Chatbot from './Chatbot';

const ChatbotContainer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(3);

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadMessages(0);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {isOpen ? (
        <Chatbot onClose={handleClose} />
      ) : (
        <ChatbotBubble unreadMessages={unreadMessages} onClick={handleOpen} />
      )}
    </>
  );
};

export default ChatbotContainer;
