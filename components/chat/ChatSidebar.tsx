"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "../ui/Avatar";
import { ChatItem } from "./ChatItem";
import { useAppStore } from "../../store/useAppStore";
import { CURRENT_USER, CHATS, USERS } from "../../constants";
import { Search, Plus, LogOut, MessageSquare } from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

export const ChatSidebar = () => {
  const router = useRouter();
  const { searchQuery, setSearchQuery, activeChatId, setActiveChatId } = useAppStore();
  const { currentUser } = useAuth();
  
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch real users from MongoDB
  React.useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success) {
          // Filter out the current logged-in user
          setUsers(data.users.filter(u => u.firebaseUid !== currentUser?.uid));
        }
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setLoading(false);
      }
    }
    if (currentUser) fetchUsers();
  }, [currentUser]);

  const handleChatClick = (id) => {
    setActiveChatId(id);
    router.push(`/${id}`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error(error);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    return users.filter((u) => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, users]);

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <MessageSquare size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="sidebar-brand-name">Bondly</span>
        </div>
        <div className="sidebar-actions">
          <button className="icon-btn hover:text-accent transition-colors">
            <Plus size={18} />
          </button>
          <button className="icon-btn hover:text-red-400 transition-colors" onClick={handleLogout} title="Log Out">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="sidebar-user bg-elevated/40 backdrop-blur-sm border border-white/5 hover:bg-elevated/60 transition-all">
        <Avatar
          src={currentUser?.photoURL}
          alt={currentUser?.displayName || currentUser?.email || "User"}
          color={CURRENT_USER.avatarColor}
          size="sm"
          status={true}
        />
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">
            {currentUser?.displayName || currentUser?.email || "User"}
          </div>
          <div className="sidebar-user-status">
            <span className="online-dot" /> Online
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-wrap">
          <span className="search-icon">
            <Search size={16} />
          </span>
          <input
            className="search-input"
            type="text"
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="sidebar-section-label">People on Bondly</div>
      <div className="sidebar-list custom-scrollbar">
        {loading ? (
          <div className="px-4 py-8 flex flex-col items-center gap-3 opacity-50">
            <div className="spinner w-6 h-6 border-2"></div>
            <span className="text-xs">Finding people...</span>
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user._id}
              onClick={() => handleChatClick(user._id)} // Using DB ID for routing
              className={`chat-item group ${activeChatId === user._id ? "active" : ""}`}
            >
              <Avatar
                src={user.avatar}
                alt={user.name}
                color="var(--bg-hover)"
                status={user.online}
              />
              <div className="chat-item-body">
                <div className="chat-item-top">
                  <span className="chat-item-name group-hover:text-accent transition-colors">{user.name}</span>
                  <span className="chat-item-time text-[10px]">Just joined</span>
                </div>
                <div className="chat-item-bottom">
                  <span className="chat-item-msg">Click to start a conversation</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-10 text-center">
            <p className="text-xs text-text-muted">No people found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};
