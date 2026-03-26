"use client";

import React, { useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { ChatWindow } from "../../../components/chat/ChatWindow";
import { CHATS, USERS, MESSAGES } from "../../../constants";
import { useAppStore } from "../../../store/useAppStore";

export default function ChatScreenPage() {
  const { chatId } = useParams();
  const { setActiveChatId } = useAppStore();
  
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setActiveChatId(chatId);
    
    async function fetchPeer() {
      try {
        const res = await fetch(`/api/users/${chatId}`);
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to load user info", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPeer();
  }, [chatId, setActiveChatId]);

  if (loading) {
    return (
      <div className="chat-main animate-fadeIn flex items-center justify-center h-full">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return <ChatWindow user={user} />;
}
