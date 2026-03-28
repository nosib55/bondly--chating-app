"use client";

import React from "react";
import { Avatar } from "../ui/Avatar";
import { useRouter } from "next/navigation";
import { useAppStore } from "../../store/useAppStore";
import { Phone, Video, Info, ChevronLeft, Lock, Trash2, Unlock } from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import Swal from "sweetalert2";

export const ChatHeader = ({ user, chat = null }) => {
  const router = useRouter();
  const { setActiveChatId } = useAppStore();
  const { currentUser } = useAuth();
  
  const [isLocked, setIsLocked] = React.useState(user.locked || false);

  const handleDeleteChat = async () => {
    if (!currentUser) return;
    
    const result = await Swal.fire({
      title: "Delete chat history?",
      text: "This will permanently remove all messages with this person. This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--accent)",
      cancelButtonColor: "var(--bg-active)",
      confirmButtonText: "Yes, delete it",
      background: "var(--bg-surface)",
      color: "var(--text-primary)",
      iconColor: "#ef4444"
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/messages/${user._id}?uid=${currentUser.uid}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire({
            title: "Deleted!",
            text: "Your conversation has been wiped.",
            icon: "success",
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            confirmButtonColor: "var(--accent)"
          });
          setActiveChatId(null);
          router.push("/");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleLock = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/users/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ myUid: currentUser.uid, peerUserId: user._id }),
      });
      const data = await res.json();
      if (data.success) {
        setIsLocked(data.isLocked);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className="chat-header">
      <button
        className="icon-btn"
        onClick={() => {
          setActiveChatId(null);
          router.push("/");
        }}
        style={{ marginRight: 8 }}
      >
        <ChevronLeft size={20} />
      </button>

      <Avatar
        src={user.avatar}
        alt={user.name}
        color={user.avatarColor}
        status={user.online}
      />
      <div className="chat-header-info">
        <div className="chat-header-name flex items-center gap-1.5">
          {user.name}
          {isLocked && <Lock size={12} className="text-accent" />}
        </div>
        <div
          className={`chat-header-status ${user.online ? "" : "offline"}`}
        >
          {chat?.typing ? (
            <span style={{ color: "var(--accent)" }}>typing...</span>
          ) : user.online ? (
            "Online"
          ) : (
            "Offline"
          )}
        </div>
      </div>
      <div className="chat-header-actions">
        <button className="icon-btn" onClick={handleToggleLock} title={isLocked ? "Unlock Chat" : "Lock Chat"}>
          {isLocked ? <Unlock size={18} className="text-accent" /> : <Lock size={18} />}
        </button>
        <button className="icon-btn hover:text-red-500 transition-colors" onClick={handleDeleteChat} title="Delete Chat">
          <Trash2 size={18} />
        </button>
        <button className="icon-btn">
          <Info size={18} />
        </button>
      </div>
    </div>
  );
};
