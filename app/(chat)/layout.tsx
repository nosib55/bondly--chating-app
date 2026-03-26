"use client";

import React, { useEffect } from "react";
import { ChatSidebar } from "../../components/chat/ChatSidebar";
import { useAppStore } from "../../store/useAppStore";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function ChatLayout({ children }) {
  const { activeChatId } = useAppStore();
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/login");
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="spinner"></div> 
      </div>
    );
  }

  // Mobile layout wrapper config 
  return (
    <div className={`chat-shell ${activeChatId ? "chat-open" : ""}`}>
      <ChatSidebar />
      {children}
    </div>
  );
}
