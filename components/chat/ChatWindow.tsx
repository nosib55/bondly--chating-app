"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { useAuth } from "../../features/auth/hooks/useAuth";

export const ChatWindow = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);
  const { currentUser } = useAuth();
  const bottomRef = useRef(null);

  // Fetch current user's DB record
  useEffect(() => {
    async function fetchMe() {
      if (!currentUser?.uid) return;
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success) {
          const found = data.users.find((u: any) => u.firebaseUid === currentUser.uid);
          setDbUser(found);
        }
      } catch (err) {
        console.error("Failed to load my profile", err);
      }
    }
    fetchMe();
  }, [currentUser?.uid]);

  // Synchronous messaging via Polling
  useEffect(() => {
    if (!user?._id || !currentUser?.uid) return;

    let isFetching = false;
    
    async function fetchMessages() {
      if (isFetching) return;
      isFetching = true;
      try {
        const res = await fetch(`/api/messages/${user._id}?uid=${currentUser.uid}`);
        const data = await res.json();
        if (data.success) {
          // Only update if count or ID changed to prevent unnecessary re-renders
          setMessages((prev) => {
            if (prev.length === data.messages.length) return prev;
            return data.messages;
          });
        }
      } catch (err) {
        console.error("Polling error:", err);
      } finally {
        isFetching = false;
        setLoading(false);
      }
    }

    // Initial load
    setLoading(true);
    fetchMessages();

    // Polling interval
    const intervalId = setInterval(fetchMessages, 3000);

    return () => clearInterval(intervalId);
  }, [user?._id, currentUser?.uid]);

  // Handle auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text, imageUrl = "") => {
    if (!currentUser?.uid || !user?._id) return;

    try {
      // Optimistic Update for butter-smooth UI
      const optimisticMsg = {
        _id: "temp-" + Date.now(),
        sender: { _id: "me" }, // Messagebubble handles "isMe"
        text,
        image: imageUrl,
        createdAt: new Date(),
        temp: true
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      // Real API call
      const res = await fetch(`/api/messages/${user._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderUid: currentUser.uid,
          text,
          image: imageUrl
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Swap temp message with real DB message
        setMessages((prev) => 
          prev.map(m => m.temp && m.text === text ? data.message : m)
        );
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  if (!user) {
    return (
      <div className="chat-empty animate-fadeIn">
        <div className="chat-empty-icon text-4xl">👋</div>
        <h2 className="text-xl font-bold mt-4">Welcome to Bondly</h2>
        <p className="text-sm opacity-60 max-w-xs text-center">Select a person from the sidebar to start a real-time conversation.</p>
      </div>
    );
  }

  return (
    <div className="chat-main animate-fadeIn">
      <ChatHeader user={user} />

      <div className="messages-area custom-scrollbar overflow-y-auto pb-4">
        {loading && messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40 gap-3">
             <div className="spinner w-6 h-6 border-2"></div>
             <span className="text-xs">Loading history...</span>
          </div>
        ) : messages.length > 0 ? (
          <>
            <div className="msg-date-divider uppercase tracking-widest opacity-30 text-[9px] font-bold">Conversation Started</div>
            {messages.map((msg, i) => (
              <MessageBubble key={msg._id || i} message={msg} dbUser={dbUser} />
            ))}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30 py-20 text-center">
            <p className="text-sm italic">No messages yet.</p>
            <p className="text-xs">Say hello to {user.name}!</p>
          </div>
        )}
        
        <div ref={bottomRef} className="h-4 w-full" />
      </div>

      <ChatInput onSend={handleSend} />
    </div>
  );
};
