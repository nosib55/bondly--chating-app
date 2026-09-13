"use client";

import { useEffect } from "react";
import { useAppStore } from "../../store/useAppStore";
import { 
  COLOR_THEMES, 
  WALLPAPER_PRESETS, 
  DEFAULT_THEME_ID, 
  DEFAULT_WALLPAPER_ID, 
  DEFAULT_WALLPAPER_DIM 
} from "../../constants/theme.constants";

export const ThemeManager = () => {
  const { 
    themeId, 
    setThemeId, 
    wallpaperId, 
    setWallpaperId, 
    customWallpaperUrl, 
    setCustomWallpaperUrl, 
    wallpaperDim, 
    setWallpaperDim,
    me 
  } = useAppStore();

  // Load initial preferences from localStorage or me profile on client boot
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("bondly-theme-id") || me?.theme || DEFAULT_THEME_ID;
      const savedWallpaper = localStorage.getItem("bondly-wallpaper-id") || me?.wallpaper || DEFAULT_WALLPAPER_ID;
      const savedCustomUrl = localStorage.getItem("bondly-custom-wallpaper") || me?.customWallpaperUrl || "";
      const savedDim = localStorage.getItem("bondly-wallpaper-dim");

      if (savedTheme) setThemeId(savedTheme);
      if (savedWallpaper) setWallpaperId(savedWallpaper);
      if (savedCustomUrl) setCustomWallpaperUrl(savedCustomUrl);
      if (savedDim !== null && !isNaN(Number(savedDim))) {
        setWallpaperDim(Number(savedDim));
      } else if (me?.wallpaperDim !== undefined) {
        setWallpaperDim(me.wallpaperDim);
      }
    } catch (e) {
      console.error("Failed to load theme from storage:", e);
    }
  }, [me, setThemeId, setWallpaperId, setCustomWallpaperUrl, setWallpaperDim]);

  // Apply theme tokens to root CSS variables
  useEffect(() => {
    const selectedTheme = COLOR_THEMES.find((t) => t.id === themeId) || COLOR_THEMES[0];
    const root = document.documentElement;

    root.style.setProperty("--accent", selectedTheme.accent);
    root.style.setProperty("--accent-dim", selectedTheme.accentDim);
    root.style.setProperty("--accent-glow", selectedTheme.accentGlow);
    root.style.setProperty("--bubble-me", selectedTheme.bubbleMe);
    root.style.setProperty("--color-accent", selectedTheme.accent);
    root.style.setProperty("--color-accent-dim", selectedTheme.accentDim);

    try {
      localStorage.setItem("bondly-theme-id", themeId);
    } catch (_) {}
  }, [themeId]);

  // Persist wallpaper settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("bondly-wallpaper-id", wallpaperId);
      localStorage.setItem("bondly-custom-wallpaper", customWallpaperUrl);
      localStorage.setItem("bondly-wallpaper-dim", String(wallpaperDim));
    } catch (_) {}
  }, [wallpaperId, customWallpaperUrl, wallpaperDim]);

  return null;
};
