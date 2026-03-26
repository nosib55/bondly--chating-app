"use client";

import React from "react";
import { Avatar } from "../ui/Avatar";
import { useRouter } from "next/navigation";
import { useAppStore } from "../../store/useAppStore";
import { Phone, Video, Info, ChevronLeft } from "lucide-react";

export const ChatHeader = ({ user, chat = null }) => {
  const router = useRouter();
  const { setActiveChatId } = useAppStore();

  if (!user) return null;

  return (
    <div className="chat-header">
      <button
        className="icon-btn md:hidden"
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
        <div className="chat-header-name">{user.name}</div>
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
        <button className="icon-btn">
          <Phone size={18} />
        </button>
        <button className="icon-btn">
          <Video size={18} />
        </button>
        <button className="icon-btn">
          <Info size={18} />
        </button>
      </div>
    </div>
  );
};
