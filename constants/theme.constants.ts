export interface ColorTheme {
  id: string;
  name: string;
  accent: string;
  accentDim: string;
  accentGlow: string;
  bubbleMe: string;
  previewGradient: string;
}

export interface WallpaperPreset {
  id: string;
  name: string;
  type: "default" | "pattern" | "gradient" | "image";
  thumbnailGradient?: string;
  bgStyle: string; // CSS background value or pattern
  overlayOpacity?: number;
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: "violet",
    name: "Bondly Violet",
    accent: "#6c63ff",
    accentDim: "#4e46d4",
    accentGlow: "rgba(108, 99, 255, 0.35)",
    bubbleMe: "linear-gradient(135deg, #6c63ff 0%, #8b5cf6 100%)",
    previewGradient: "from-[#6c63ff] to-[#8b5cf6]",
  },
  {
    id: "emerald",
    name: "Cyber Emerald",
    accent: "#10b981",
    accentDim: "#059669",
    accentGlow: "rgba(16, 185, 129, 0.35)",
    bubbleMe: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    previewGradient: "from-[#10b981] to-[#34d399]",
  },
  {
    id: "cyan",
    name: "Ocean Cyan",
    accent: "#06b6d4",
    accentDim: "#0891b2",
    accentGlow: "rgba(6, 182, 212, 0.35)",
    bubbleMe: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
    previewGradient: "from-[#06b6d4] to-[#38bdf8]",
  },
  {
    id: "rose",
    name: "Sunset Rose",
    accent: "#f43f5e",
    accentDim: "#e11d48",
    accentGlow: "rgba(244, 63, 94, 0.35)",
    bubbleMe: "linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)",
    previewGradient: "from-[#f43f5e] to-[#fb7185]",
  },
  {
    id: "amber",
    name: "Golden Amber",
    accent: "#f59e0b",
    accentDim: "#d97706",
    accentGlow: "rgba(245, 158, 11, 0.35)",
    bubbleMe: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
    previewGradient: "from-[#f59e0b] to-[#fbbf24]",
  },
  {
    id: "sapphire",
    name: "Midnight Sapphire",
    accent: "#3b82f6",
    accentDim: "#2563eb",
    accentGlow: "rgba(59, 130, 246, 0.35)",
    bubbleMe: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
    previewGradient: "from-[#3b82f6] to-[#60a5fa]",
  },
];

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: "default",
    name: "Clean Slate",
    type: "default",
    thumbnailGradient: "from-[#0d0f14] to-[#151820]",
    bgStyle: "#0d0f14",
    overlayOpacity: 0,
  },
  {
    id: "doodles",
    name: "Chat Doodles",
    type: "pattern",
    thumbnailGradient: "from-[#1a1f2c] to-[#11141c]",
    bgStyle: `radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.08) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.06) 3%, transparent 0%)`,
    overlayOpacity: 0.85,
  },
  {
    id: "techgrid",
    name: "Cyber Grid",
    type: "pattern",
    thumbnailGradient: "from-[#0d1424] to-[#0a0f1d]",
    bgStyle: `linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
    overlayOpacity: 0.85,
  },
  {
    id: "aurora",
    name: "Neon Aurora",
    type: "gradient",
    thumbnailGradient: "from-[#2e1065] via-[#0f172a] to-[#082f49]",
    bgStyle: `radial-gradient(circle at 20% 20%, rgba(108, 99, 255, 0.22) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.18) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.12) 0%, transparent 50%), #0d0f14`,
    overlayOpacity: 0.65,
  },
  {
    id: "cosmic",
    name: "Cosmic Stars",
    type: "pattern",
    thumbnailGradient: "from-[#090a10] via-[#141526] to-[#090a10]",
    bgStyle: `radial-gradient(1px 1px at 20px 30px, #eee, rgba(0,0,0,0)), radial-gradient(1px 1px at 40px 70px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 90px 40px, #ddd, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 160px 120px, #fff, rgba(0,0,0,0))`,
    overlayOpacity: 0.8,
  },
  {
    id: "gemini_nebula",
    name: "Gemini Deep Space",
    type: "image",
    thumbnailGradient: "from-[#110d29] via-[#091724] to-[#040508]",
    bgStyle: "/wallpapers/cyber_nebula.jpg",
    overlayOpacity: 0.5,
  },
  {
    id: "gemini_silk",
    name: "Gemini Liquid Silk",
    type: "image",
    thumbnailGradient: "from-[#200d36] via-[#150a24] to-[#06040a]",
    bgStyle: "/wallpapers/liquid_silk.jpg",
    overlayOpacity: 0.55,
  },
  {
    id: "gemini_cybercity",
    name: "Gemini Cyber Neon",
    type: "image",
    thumbnailGradient: "from-[#081b29] via-[#111624] to-[#1a0f1c]",
    bgStyle: "/wallpapers/cyber_city.jpg",
    overlayOpacity: 0.6,
  },
  {
    id: "sunset",
    name: "Velvet Sunset",
    type: "gradient",
    thumbnailGradient: "from-[#4c0519] via-[#18181b] to-[#022c22]",
    bgStyle: `radial-gradient(circle at 10% 90%, rgba(244, 63, 94, 0.2) 0%, transparent 40%), radial-gradient(circle at 90% 10%, rgba(245, 158, 11, 0.18) 0%, transparent 40%), #0d0f14`,
    overlayOpacity: 0.7,
  },
];

export const DEFAULT_THEME_ID = "violet";
export const DEFAULT_WALLPAPER_ID = "default";
export const DEFAULT_WALLPAPER_DIM = 40; // 0 to 80%
