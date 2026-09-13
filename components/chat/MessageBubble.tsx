"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, CheckCheck, ChevronDown, Trash2, Copy } from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth";

const REACTION_EMOJIS = ["❤️", "👍", "😂", "🔥", "😮", "😢"];

export const MessageBubble = ({ 
  message, 
  showTail = true, 
  dbUser = null,
  onReact = null,
  onDelete = null 
}) => {
  const { currentUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);
  
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
  const isMe = message.sender?._id === "me" || 
               message.sender === dbUser?._id || 
               message.sender?._id === dbUser?._id ||
               message.sender === currentUser?.uid || 
               message.sender?.firebaseUid === currentUser?.uid;

  const displayTime = message.createdAt 
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "Just now";

  // Group reactions by emoji
  const reactionsMap = (message.reactions || []).reduce((acc: any, r: any) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, users: [] };
    acc[r.emoji].count += 1;
    acc[r.emoji].users.push(r.userId);
    return acc;
  }, {});

  const myUid = currentUser?.uid;
  const isTemp = !!message.temp;

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
    }
    setMenuOpen(false);
  };

  return (
    <div className={`msg-row ${isMe ? "me" : "other"} group relative select-text`}>
      <div className={`bubble ${message.temp ? "opacity-70" : ""} relative group/bubble`}>
        {message.image && (
          <img 
            src={message.image} 
            alt="attachment" 
            className="bubble-img mb-2 rounded-lg max-h-72 object-cover cursor-pointer hover:opacity-95 transition-opacity" 
            onClick={() => window.open(message.image, "_blank")}
          />
        )}
        
        {/* Message Text */}
        {message.text && (
          <div className="leading-relaxed whitespace-pre-wrap break-words">
            {message.text}
          </div>
        )}

        {/* Dropdown Floating Icon-Only Menu (React & Delete Icons Only) */}
        {menuOpen && (
          <div 
            ref={menuRef}
            className={`absolute -top-11 ${isMe ? "right-0" : "left-0"} z-50 flex items-center gap-1 px-2 py-1 rounded-full bg-[#181b26]/95 border border-white/10 shadow-2xl backdrop-blur-xl animate-scaleUp`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Reaction Icons */}
            <div className="flex items-center gap-0.5">
              {REACTION_EMOJIS.map((emoji) => {
                const hasReacted = reactionsMap[emoji]?.users?.includes(myUid);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onReact?.(message._id, emoji);
                      setMenuOpen(false);
                    }}
                    className={`w-7 h-7 flex items-center justify-center text-sm rounded-full transition-transform hover:scale-130 active:scale-95 ${
                      hasReacted ? "bg-accent/30 scale-110 shadow-sm" : "hover:bg-white/10"
                    }`}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>

            <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

            {/* Copy Icon */}
            {message.text && (
              <button
                type="button"
                onClick={handleCopy}
                className="w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:text-white hover:bg-white/10 transition-colors"
                title="Copy"
              >
                <Copy size={13} />
              </button>
            )}

            {/* Delete Icon */}
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(message._id);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:text-red-400 hover:bg-red-500/15 transition-colors"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
        
        {/* Meta (Time & Read Receipts & Down Arrow Next To Time) */}
        <div className="bubble-meta flex items-center gap-1 justify-end mt-1 text-[10px] opacity-75 select-none">
          <span>{displayTime}</span>
          
          {isMe && (
            <span className={`bubble-tick ${message.read ? "read text-emerald-400" : "text-white/60"}`}>
              {message.read ? <CheckCheck size={13} /> : <Check size={13} />}
            </span>
          )}

          {/* Small Arrow Trigger Next to Time */}
          {!isTemp && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className={`p-0.5 rounded transition-all cursor-pointer ${
                menuOpen 
                  ? "opacity-100 bg-white/20 text-white" 
                  : "opacity-40 group-hover/bubble:opacity-100 hover:bg-white/15 hover:text-white"
              }`}
              title="Options"
            >
              <ChevronDown size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Reaction Pill Badges Display */}
        {Object.keys(reactionsMap).length > 0 && (
          <div className={`flex flex-wrap items-center gap-1 mt-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
            {Object.entries(reactionsMap).map(([emoji, data]: any) => {
              const reactedByMe = data.users.includes(myUid);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact?.(message._id, emoji)}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all ${
                    reactedByMe
                      ? "bg-accent/30 border border-accent/40 text-white scale-105 shadow-sm"
                      : "bg-surface/80 border border-white/10 text-text-primary hover:bg-surface"
                  }`}
                  title={`${data.count} reaction${data.count > 1 ? "s" : ""}`}
                >
                  <span>{emoji}</span>
                  {data.count > 1 && <span className="text-[10px] font-bold opacity-80">{data.count}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
