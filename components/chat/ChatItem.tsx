import React from "react";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { useAppStore } from "../../store/useAppStore";
import { USERS } from "../../constants";

export const ChatItem = ({ chat, onClick }) => {
  const { activeChatId } = useAppStore();
  const isActive = activeChatId === chat.id;

  const user = USERS.find((u) => u.id === chat.userId);

  if (!user) return null;

  return (
    <div
      onClick={() => onClick(chat.id)}
      className={`chat-item ${isActive ? "active" : ""}`}
    >
      <Avatar
        src={user.avatar}
        alt={user.name}
        color={user.avatarColor}
        status={user.online}
      />
      <div className="chat-item-body">
        <div className="chat-item-top">
          <span className="chat-item-name">{user.name}</span>
          <span className="chat-item-time">{chat.lastTime}</span>
        </div>
        <div className="chat-item-bottom">
          {chat.typing ? (
            <span className="chat-item-msg" style={{ color: "var(--accent)" }}>
              Typing...
            </span>
          ) : (
            <span
              className={`chat-item-msg ${chat.unread > 0 ? "unread" : ""}`}
            >
              {chat.lastMessage}
            </span>
          )}
          <Badge count={chat.unread} />
        </div>
      </div>
    </div>
  );
};
