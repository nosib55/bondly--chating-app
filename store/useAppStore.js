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

  // Notifications
  totalUnread: 0,
  setTotalUnread: (count) => set({ totalUnread: count }),

  // Typing simulation
  typingUsers: {},
  setTyping: (chatId, isTyping) =>
    set((s) => ({
      typingUsers: { ...s.typingUsers, [chatId]: isTyping },
    })),

  // Theme & Wallpaper Customization
  themeId: "violet",
  setThemeId: (id) => set({ themeId: id }),
  wallpaperId: "default",
  setWallpaperId: (id) => set({ wallpaperId: id }),
  customWallpaperUrl: "",
  setCustomWallpaperUrl: (url) => set({ customWallpaperUrl: url }),
  wallpaperDim: 40,
  setWallpaperDim: (dim) => set({ wallpaperDim: dim }),
}));
