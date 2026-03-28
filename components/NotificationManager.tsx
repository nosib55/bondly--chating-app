"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "../store/useAppStore";

export const NotificationManager = () => {
  const { totalUnread } = useAppStore();
  const prevUnreadRef = useRef(totalUnread);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Initialize audio
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
  }, []);

  useEffect(() => {
    // Update Document Title
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) Bondly — Connect with Anyone`;
    } else {
      document.title = "Bondly — Connect with Anyone";
    }

    // Detect increase in unread messages
    if (totalUnread > prevUnreadRef.current) {
      // Play sound
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Audio play blocked", e));
      }

      // Show Browser Notification if tab is not focused
      if (document.visibilityState !== "visible" && "Notification" in window && Notification.permission === "granted") {
        new Notification("New Message on Bondly", {
          body: "You have new unread messages.",
          icon: "/favicon.ico", // Ensure this exists or use project logo
        });
      }
    }

    prevUnreadRef.current = totalUnread;
  }, [totalUnread]);

  return null; // Side-effect only component
};
