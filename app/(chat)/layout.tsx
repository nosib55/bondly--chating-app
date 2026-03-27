"use client";

import React, { useEffect } from "react";
import { ChatSidebar } from "../../components/chat/ChatSidebar";
import { useAppStore } from "../../store/useAppStore";

import { useAuth } from "../../features/auth/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";

export default function ChatLayout({ children }) {
  const { activeChatId, setActiveChatId } = useAppStore();
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/login");
    }
  }, [currentUser, loading, router]);

  // Clear active chat when at root so sidebar always shows on mobile
  useEffect(() => {
    if (pathname === "/") {
      setActiveChatId(null);
    }
  }, [pathname, setActiveChatId]);

  if (loading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="spinner"></div>
      </div>
    );
  }

  const isProfile = pathname === "/profile";
  const isRoot = pathname === "/";
  // On root path, never apply chat-open so the sidebar is always shown on mobile
  const shellClass = `chat-shell ${(!isRoot && (activeChatId || isProfile)) ? "chat-open" : ""}`;

  // Mobile layout wrapper config 
  return (
    <div className={shellClass}>
      <ChatSidebar />
      {children}
    </div>
  );
}
