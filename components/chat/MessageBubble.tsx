import React from "react";
import { Check, CheckCheck } from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth";

export const MessageBubble = ({ message, showTail = true }) => {
  const { currentUser } = useAuth();
  
  if (message.typing) {
    return (
      <div className="msg-row other">
        <div className="typing-indicator">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    );
  }

  // Check if current user is the sender
  // Optimistic messages use sender._id === "me" 
  // Real messages have populated sender or ID string
  const isMe = message.sender?._id === "me" || 
               message.sender === currentUser?.uid || 
               message.sender?.firebaseUid === currentUser?.uid;

  const displayTime = message.createdAt 
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "Just now";

  return (
    <div className={`msg-row ${isMe ? "me" : "other"}`}>
      <div className={`bubble ${message.temp ? "opacity-70" : ""}`}>
        {message.image && (
          <img src={message.image} alt="attachment" className="bubble-img mb-2" />
        )}
        
        {message.text}
        
        <div className="bubble-meta">
          <span>{displayTime}</span>
          {isMe && (
            <span className={`bubble-tick ${message.read ? "read" : ""}`}>
              {message.read ? <CheckCheck size={14} /> : <Check size={14} />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
