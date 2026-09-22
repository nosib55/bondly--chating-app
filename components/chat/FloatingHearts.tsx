"use client";

import React, { useEffect, useState } from "react";

interface HeartParticle {
  id: number;
  emoji: string;
  leftPercent: number;
  bottomPx: number;
  flyY: number;
  swayMid: number;
  swayEnd: number;
  swayFinal: number;
  rotMid: number;
  rotFinal: number;
  popScale: number;
  fontSize: number;
  delayMs: number;
  durationMs: number;
}

const HEART_ICONS = ["❤️", "💖", "💕", "💓", "💗", "💘", "✨", "❤️‍🔥", "🥰"];

function createHeartParticles(isMe: boolean): HeartParticle[] {
  const list: HeartParticle[] = [];
  const count = 14;

  for (let i = 0; i < count; i++) {
    const emoji = HEART_ICONS[Math.floor(Math.random() * HEART_ICONS.length)];
    const delayMs = i * 75 + Math.floor(Math.random() * 50);
    const durationMs = 1800 + Math.floor(Math.random() * 600);

    // Horizontal position spread along the bubble
    const leftPercent = isMe
      ? 35 + Math.random() * 60 // Right-aligned for sender
      : 5 + Math.random() * 60;  // Left-aligned for other

    const flyY = -(100 + Math.random() * 95); // Floats upward by 100px - 195px
    const swayMid = (Math.random() - 0.5) * 32;
    const swayEnd = (Math.random() - 0.5) * 44;
    const swayFinal = (Math.random() - 0.5) * 36;
    const rotMid = (Math.random() - 0.5) * 40;
    const rotFinal = (Math.random() - 0.5) * 50;
    const popScale = 1.15 + Math.random() * 0.4;
    const fontSize = 18 + Math.floor(Math.random() * 12);

    list.push({
      id: i,
      emoji,
      leftPercent,
      bottomPx: 10 + Math.floor(Math.random() * 12),
      flyY,
      swayMid,
      swayEnd,
      swayFinal,
      rotMid,
      rotFinal,
      popScale,
      fontSize,
      delayMs,
      durationMs,
    });
  }

  return list;
}

interface FloatingHeartsProps {
  onComplete?: () => void;
  isMe?: boolean;
}

export const FloatingHearts: React.FC<FloatingHeartsProps> = ({ onComplete, isMe = true }) => {
  const [particles] = useState<HeartParticle[]>(() => createHeartParticles(isMe));

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (particles.length === 0) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-visible select-none"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes flyLoveBurst {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) scale(0.3) rotate(0deg);
          }
          15% {
            opacity: 1;
            transform: translate3d(var(--sway-mid, 8px), -35px, 0) scale(var(--pop-scale, 1.35)) rotate(var(--rot-mid, 15deg));
          }
          50% {
            opacity: 0.95;
            transform: translate3d(var(--sway-end, -12px), -90px, 0) scale(1.1) rotate(var(--rot-end, -10deg));
          }
          80% {
            opacity: 0.75;
            transform: translate3d(var(--sway-final, 10px), calc(var(--fly-y, -140px) * 0.8), 0) scale(0.85);
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--sway-final, 15px), var(--fly-y, -150px), 0) scale(0.4) rotate(var(--rot-final, 20deg));
          }
        }
      `}</style>
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute select-none pointer-events-none will-change-transform"
          style={{
            left: `${p.leftPercent}%`,
            bottom: `${p.bottomPx}px`,
            fontSize: `${p.fontSize}px`,
            animation: `flyLoveBurst ${p.durationMs}ms cubic-bezier(0.2, 0.8, 0.2, 1) ${p.delayMs}ms both`,
            ["--fly-y" as any]: `${p.flyY}px`,
            ["--sway-mid" as any]: `${p.swayMid}px`,
            ["--sway-end" as any]: `${p.swayEnd}px`,
            ["--sway-final" as any]: `${p.swayFinal}px`,
            ["--rot-mid" as any]: `${p.rotMid}deg`,
            ["--rot-final" as any]: `${p.rotFinal}deg`,
            ["--pop-scale" as any]: p.popScale,
            filter: "drop-shadow(0 2px 10px rgba(255, 30, 90, 0.65))",
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
};
