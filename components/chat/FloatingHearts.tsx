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

const HEART_ICONS = ["❤️", "💖", "💕", "💓", "💗", "💘", "✨", "❤️‍🔥"];

function createHeartParticles(isMe: boolean): HeartParticle[] {
  const list: HeartParticle[] = [];
  const count = 12;

  for (let i = 0; i < count; i++) {
    const emoji = HEART_ICONS[Math.floor(Math.random() * HEART_ICONS.length)];
    const delayMs = i * 85 + Math.floor(Math.random() * 60);
    const durationMs = 1700 + Math.floor(Math.random() * 500);

    // Horizontal position spread along the bubble top edge
    const leftPercent = isMe
      ? 40 + Math.random() * 55 // Biased towards right edge for sender
      : 5 + Math.random() * 55;  // Biased towards left edge for receiver

    const flyY = -(90 + Math.random() * 95); // Floats upward by 90px - 185px
    const swayMid = (Math.random() - 0.5) * 28;
    const swayEnd = (Math.random() - 0.5) * 40;
    const swayFinal = (Math.random() - 0.5) * 32;
    const rotMid = (Math.random() - 0.5) * 35;
    const rotFinal = (Math.random() - 0.5) * 45;
    const popScale = 1.1 + Math.random() * 0.35;
    const fontSize = 16 + Math.floor(Math.random() * 11);

    list.push({
      id: i,
      emoji,
      leftPercent,
      bottomPx: 12 + Math.floor(Math.random() * 10),
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
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (particles.length === 0) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-30 overflow-visible"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute select-none pointer-events-none will-change-transform animate-flyLove"
          style={{
            left: `${p.leftPercent}%`,
            bottom: `${p.bottomPx}px`,
            fontSize: `${p.fontSize}px`,
            animationDelay: `${p.delayMs}ms`,
            animationDuration: `${p.durationMs}ms`,
            ["--fly-y" as any]: `${p.flyY}px`,
            ["--sway-mid" as any]: `${p.swayMid}px`,
            ["--sway-end" as any]: `${p.swayEnd}px`,
            ["--sway-final" as any]: `${p.swayFinal}px`,
            ["--rot-mid" as any]: `${p.rotMid}deg`,
            ["--rot-final" as any]: `${p.rotFinal}deg`,
            ["--pop-scale" as any]: p.popScale,
            filter: "drop-shadow(0 2px 8px rgba(255, 60, 110, 0.5))",
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
};
