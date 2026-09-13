"use client";

import React from "react";
import { X, Check, Sparkles, Image as ImageIcon, Palette, Sliders } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { 
  COLOR_THEMES, 
  WALLPAPER_PRESETS, 
} from "../../constants/theme.constants";

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({ isOpen, onClose }) => {
  const { 
    themeId, 
    setThemeId, 
    wallpaperId, 
    setWallpaperId, 
    wallpaperDim, 
    setWallpaperDim 
  } = useAppStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-[#151820] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#1a1e28]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
              <Palette size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Chat Theme & Wallpaper</h3>
              <p className="text-xs text-text-muted">Customize colors, AI wallpapers, and atmosphere</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Color Accent Section */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <Sparkles size={13} className="text-accent" />
              Theme Accent Color
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {COLOR_THEMES.map((theme) => {
                const isSelected = themeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setThemeId(theme.id)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                      isSelected 
                        ? "bg-white/10 border-accent shadow-[0_0_15px_var(--accent-glow)] scale-105" 
                        : "bg-elevated/60 border-white/5 hover:bg-elevated hover:border-white/10"
                    }`}
                  >
                    <div 
                      className="w-7 h-7 rounded-full flex items-center justify-center shadow-md relative"
                      style={{ background: theme.accent }}
                    >
                      {isSelected && <Check size={14} className="text-white drop-shadow" strokeWidth={3} />}
                    </div>
                    <span className="text-[10px] font-semibold text-text-secondary truncate w-full text-center">
                      {theme.name.split(" ")[1] || theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wallpapers Section */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <ImageIcon size={13} className="text-accent" />
              Chat Wallpaper & Patterns (Gemini AI Included)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {WALLPAPER_PRESETS.map((wp) => {
                const isSelected = wallpaperId === wp.id;
                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => setWallpaperId(wp.id)}
                    className={`group relative h-24 rounded-xl border overflow-hidden transition-all text-left flex flex-col justify-end p-2.5 ${
                      isSelected 
                        ? "border-accent shadow-[0_0_15px_var(--accent-glow)] scale-[1.02]" 
                        : "border-white/5 hover:border-white/20"
                    }`}
                  >
                    {/* Wallpaper Preview Background */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                      style={{ 
                        backgroundImage: wp.type === "image" ? `url('${wp.bgStyle}')` : undefined,
                        background: wp.type !== "image" ? wp.bgStyle : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div className="absolute inset-0 bg-black/40" />
                    </div>

                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center shadow-md z-10">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}

                    {/* Wallpaper Label */}
                    <div className="relative z-10">
                      <span className="text-xs font-bold text-white drop-shadow block truncate">
                        {wp.name}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-white/70 font-semibold">
                        {wp.type}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wallpaper Dimmer Slider */}
          <div className="space-y-2 p-4 rounded-xl bg-elevated/50 border border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                <Sliders size={13} className="text-accent" />
                Wallpaper Dimming (Darkness)
              </label>
              <span className="text-xs font-bold text-accent">{wallpaperDim}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="80"
              step="5"
              value={wallpaperDim}
              onChange={(e) => setWallpaperDim(Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer h-1.5 bg-surface rounded-lg appearance-none"
            />
            <p className="text-[10px] text-text-muted">
              Adjust darkness to make messages pop and ensure high contrast readability.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-white/5 bg-[#1a1e28]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-accent hover:opacity-90 transition-opacity shadow-md shadow-accent/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
