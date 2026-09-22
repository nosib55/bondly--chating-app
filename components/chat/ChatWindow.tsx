"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useAppStore } from "../../store/useAppStore";
import { WALLPAPER_PRESETS } from "../../constants/theme.constants";
import Swal from "sweetalert2";

export const ChatWindow = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);
  const { currentUser } = useAuth();
  const { wallpaperId, customWallpaperUrl, wallpaperDim } = useAppStore();
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
          // Compare JSON string or length to avoid resetting when reactions change
          setMessages((prev: any[]) => {
            const isDifferent = JSON.stringify(prev) !== JSON.stringify(data.messages);
            if (!isDifferent) return prev;
            const prevClientIds = new Map(prev.map((m: any) => [m._id, m.clientMsgId]));
            return data.messages.map((m: any) => {
              const clientMsgId = prevClientIds.get(m._id);
              return clientMsgId ? { ...m, clientMsgId } : m;
            });
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

    // Mark as read when opening
    const markAsRead = async () => {
      try {
        await fetch(`/api/messages/${user._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: currentUser.uid })
        });
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    };
    markAsRead();

    // Polling interval
    const intervalId = setInterval(() => {
      fetchMessages();
      markAsRead();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [user?._id, currentUser?.uid]);

  // Handle auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (text: string, imageUrl = "") => {
    if (!currentUser?.uid || !user?._id) return;

    try {
      const tempId = "temp-" + Date.now();
      // Optimistic Update for butter-smooth UI
      const optimisticMsg = {
        _id: tempId,
        clientMsgId: tempId,
        sender: { _id: "me" }, // Messagebubble handles "isMe"
        text,
        image: imageUrl,
        reactions: [],
        createdAt: new Date(),
        temp: true,
        justSent: true
      };
      setMessages((prev: any) => [...prev, optimisticMsg]);

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
        // Swap temp message with real DB message while keeping stable clientMsgId
        setMessages((prev: any) => 
          prev.map((m: any) => 
            (m._id === tempId || (m.temp && m.text === text))
              ? { ...data.message, clientMsgId: tempId }
              : m
          )
        );
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!currentUser?.uid || !messageId || !user?._id) return;

    // Optimistic reaction update
    setMessages((prev: any[]) =>
      prev.map((msg) => {
        if (msg._id !== messageId) return msg;
        const reactions = [...(msg.reactions || [])];
        const userIdx = reactions.findIndex(
          (r: any) => r.userId === currentUser.uid || (dbUser?._id && r.userId === dbUser._id.toString())
        );
        if (userIdx > -1) {
          if (reactions[userIdx].emoji === emoji) {
            reactions.splice(userIdx, 1);
          } else {
            reactions[userIdx] = { ...reactions[userIdx], emoji };
          }
        } else {
          reactions.push({ emoji, userId: currentUser.uid });
        }
        return { ...msg, reactions };
      })
    );

    try {
      await fetch(`/api/messages/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: currentUser.uid,
          messageId,
          emoji,
        }),
      });
    } catch (err) {
      console.error("Failed to react to message", err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser?.uid || !messageId || !user?._id) return;

    const result = await Swal.fire({
      title: "Delete message?",
      text: "This message will be removed for everyone in this conversation.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "var(--bg-active)",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      background: "var(--bg-surface)",
      color: "var(--text-primary)",
      iconColor: "#ef4444",
    });

    if (!result.isConfirmed) return;

    // Optimistic delete
    setMessages((prev: any[]) => prev.filter((m) => m._id !== messageId));

    try {
      await fetch(`/api/messages/${user._id}?uid=${currentUser.uid}&messageId=${messageId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete message", err);
    }
  };

  if (!user) {
    return (
      <div className="chat-empty animate-fadeIn opacity-20">
        <p className="text-xs uppercase tracking-[0.2em] font-bold">Select a person to start chatting</p>
      </div>
    );
  }

  const currentWp = WALLPAPER_PRESETS.find((w) => w.id === wallpaperId) || WALLPAPER_PRESETS[0];
  const isCustom = !!customWallpaperUrl;
  const isImage = isCustom || currentWp.type === "image";
  const imageSrc = isCustom ? customWallpaperUrl : currentWp.bgStyle;

  return (
    <div className="chat-main animate-fadeIn relative">
      <ChatHeader user={user} />

      {/* Main Chat Scroll Container with Wallpaper & Overlay */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Background Wallpaper Layer */}
        {wallpaperId !== "default" && (
          <div 
            className="absolute inset-0 pointer-events-none transition-all duration-300 z-0"
            style={
              isImage
                ? {
                    backgroundImage: `url('${imageSrc}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }
                : {
                    background: currentWp.bgStyle,
                  }
            }
          />
        )}
        {/* Dimmer / Darkness Overlay */}
        {wallpaperId !== "default" && (
          <div 
            className="absolute inset-0 pointer-events-none bg-black transition-opacity duration-300 z-0"
            style={{ opacity: wallpaperDim / 100 }}
          />
        )}

        <div className="messages-area custom-scrollbar overflow-y-auto pb-4 relative z-10 flex-1">
          {loading && messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-40 gap-3">
              <div className="spinner w-6 h-6 border-2"></div>
              <span className="text-xs">Loading history...</span>
            </div>
          ) : messages.length > 0 ? (
            <>
              <div className="msg-date-divider uppercase tracking-widest opacity-30 text-[9px] font-bold">Conversation Started</div>
              {messages.map((msg: any, i) => (
                <MessageBubble 
                  key={msg.clientMsgId || msg._id || i} 
                  message={msg} 
                  dbUser={dbUser} 
                  onReact={handleReact}
                  onDelete={handleDeleteMessage}
                />
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
      </div>

      <ChatInput onSend={handleSend} />
    </div>
  );
};
