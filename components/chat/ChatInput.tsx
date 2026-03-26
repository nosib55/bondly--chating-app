"use client";

import React, { useState } from "react";
import { Send, Smile, Paperclip, Mic } from "lucide-react";

export const ChatInput = ({ onSend }) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input-area">
      <div className="chat-input-row">
        <button className="icon-btn">
          <Paperclip size={20} />
        </button>

        <div className="chat-input-wrap">
          <textarea
            className="chat-textarea"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <div className="chat-input-attachments">
            <button className="icon-btn" style={{ width: 28, height: 28 }}>
              <Smile size={18} />
            </button>
            <button className="icon-btn" style={{ width: 28, height: 28 }}>
              <Mic size={18} />
            </button>
          </div>
        </div>

        <button className="btn-send" onClick={handleSend}>
          <Send size={18} style={{ marginLeft: -2 }} />
        </button>
      </div>
    </div>
  );
};
