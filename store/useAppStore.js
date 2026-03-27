"use client";

import { create } from "zustand";

export const useAppStore = create((set) => ({
  // Active chat
  activeChatId: null,
  setActiveChatId: (id) => set({ activeChatId: id }),

  // Sidebar visibility (mobile)
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // Search query
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  // User profile synchronization
  me: null,
  setMe: (userData) => set({ me: userData }),

  // Typing simulation
  typingUsers: {},
  setTyping: (chatId, isTyping) =>
    set((s) => ({
      typingUsers: { ...s.typingUsers, [chatId]: isTyping },
    })),
}));
