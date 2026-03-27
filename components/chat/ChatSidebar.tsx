"use client";

import React, { useMemo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "../ui/Avatar";
import { useAppStore } from "../../store/useAppStore";
import { CURRENT_USER } from "../../constants";
import { Search, Plus, LogOut, MessageSquare, X } from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

export const ChatSidebar = () => {
  const router = useRouter();
  const { searchQuery, setSearchQuery, activeChatId, setActiveChatId, me, setMe } = useAppStore();
  const { currentUser } = useAuth();

  // Contacts = users with whom there's at least one message
  const [contacts, setContacts] = React.useState([]);
  // Search results = any user on Bondly matched by name/email
  const [searchResults, setSearchResults] = React.useState([]);
  const [loadingContacts, setLoadingContacts] = React.useState(true);
  const [searching, setSearching] = React.useState(false);
  
  // Track what was actually submitted for searching
  const [activeSearchQuery, setActiveSearchQuery] = useState("");

  const isSearching = activeSearchQuery.trim().length > 0;

  // 1. Load MY profile + conversation partners on mount
  React.useEffect(() => {
    async function fetchContacts() {
      if (!currentUser) return;
      try {
        // Load my profile
        const usersRes = await fetch("/api/users");
        const usersData = await usersRes.json();
        if (usersData.success) {
          const foundMe = usersData.users.find((u: any) => u.firebaseUid === currentUser.uid);
          setMe(foundMe);
        }

        // Load conversation partners only
        const convRes = await fetch(`/api/conversations?uid=${currentUser.uid}`);
        const convData = await convRes.json();
        if (convData.success) {
          setContacts(convData.users);
        }
      } catch (err) {
        console.error("Failed to fetch contacts", err);
      } finally {
        setLoadingContacts(false);
      }
    }
    fetchContacts();
  }, [currentUser]);

  // 2. Search all users ONLY when activeSearchQuery changes (manual trigger)
  // Exact match for name or email
  React.useEffect(() => {
    if (!isSearching) {
      setSearchResults([]);
      return;
    }

    async function doSearch() {
      setSearching(true);
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success) {
          const q = activeSearchQuery.toLowerCase();
          const results = data.users.filter(
            (u: any) =>
              u.firebaseUid !== currentUser?.uid &&
              (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
          );
          setSearchResults(results);
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setSearching(false);
      }
    }
    
    doSearch();
  }, [activeSearchQuery, currentUser, isSearching]);

  const handleChatClick = useCallback((id: string) => {
    setActiveChatId(id);
    setSearchQuery("");
    setActiveSearchQuery("");
    router.push(`/${id}`);
  }, [setActiveChatId, setSearchQuery, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearchQuery(searchQuery);
  };
  
  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearchQuery("");
  };

  const displayList = isSearching ? searchResults : contacts;
  const sectionLabel = isSearching ? "Search Results" : "Conversations";
  const isLoading = isSearching ? searching : loadingContacts;

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
          <button className="icon-btn hover:text-red-400 transition-colors" onClick={handleLogout} title="Log Out">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* User Info */}
      <div
        onClick={() => router.push("/profile")}
        className="sidebar-user bg-elevated/40 backdrop-blur-sm border border-white/5 hover:bg-elevated/60 transition-all cursor-pointer group"
        title="Edit your profile"
      >
        <Avatar
          src={me?.avatar}
          alt={me?.name || "User"}
          color={CURRENT_USER.avatarColor}
          size="sm"
        />
        <div className="sidebar-user-info">
          <div className="sidebar-user-name group-hover:text-accent transition-colors">
            {me?.name || currentUser?.email || "User"}
          </div>
          <div className="sidebar-user-status">
            <span className="online-dot" /> Online
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <form className="search-wrap" onSubmit={handleSearchSubmit}>
          <button 
            type="submit" 
            className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center text-text-muted hover:text-accent transition-colors z-10"
            title="Search"
          >
            <Search size={16} />
          </button>
          <input
            className="search-input"
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && (
            <button
              onClick={handleClearSearch}
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      {/* List */}
      <div className="sidebar-section-label">{sectionLabel}</div>
      <div className="sidebar-list custom-scrollbar">
        {isLoading ? (
          <div className="px-4 py-8 flex flex-col items-center gap-3 opacity-50">
            <div className="spinner w-6 h-6 border-2"></div>
            <span className="text-xs">{isSearching ? "Searching..." : "Loading..."}</span>
          </div>
        ) : displayList.length > 0 ? (
          displayList.map((user: any) => (
            <div
              key={user._id}
              onClick={() => handleChatClick(user._id)}
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
                </div>
                <div className="chat-item-bottom">
                  <span className="chat-item-msg">
                    {isSearching ? user.email : "Tap to continue chatting"}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-10 text-center space-y-1">
            {isSearching ? (
              <p className="text-xs text-text-muted">No matching users found for "{activeSearchQuery}"</p>
            ) : (
              <>
                <p className="text-xs font-semibold text-text-secondary">No conversations yet</p>
                <p className="text-xs text-text-muted">Search for someone to start chatting</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
