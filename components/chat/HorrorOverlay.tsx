"use client";

import React, { useEffect, useRef } from "react";

interface HorrorOverlayProps {
  active: boolean;
  onFinished?: () => void;
}

export const HorrorOverlay: React.FC<HorrorOverlayProps> = ({ active, onFinished }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!active) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onFinished?.();
    }, 2800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, onFinished]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden select-none horror-wrapper">
      <style>{`
        @keyframes horrorShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-4px, 3px) rotate(-1deg); }
          20% { transform: translate(5px, -3px) rotate(1deg); }
          30% { transform: translate(-5px, 4px) rotate(-0.5deg); }
          40% { transform: translate(4px, -2px) rotate(1deg); }
          50% { transform: translate(-3px, 2px) rotate(-1deg); }
          65% { transform: translate(2px, -1px) rotate(0deg); }
          80% { transform: translate(-1px, 1px) rotate(0.5deg); }
        }

        @keyframes horrorFlicker {
          0% { opacity: 0; }
          4% { opacity: 0.95; }
          8% { opacity: 0.2; }
          12% { opacity: 0.9; }
          16% { opacity: 0.1; }
          22% { opacity: 0.85; }
          30% { opacity: 0.3; }
          40% { opacity: 0.75; }
          60% { opacity: 0.5; }
          80% { opacity: 0.3; }
          100% { opacity: 0; }
        }

        @keyframes bloodPulse {
          0% { opacity: 0; transform: scale(1); }
          15% { opacity: 0.9; transform: scale(1.05); }
          40% { opacity: 0.6; transform: scale(1.02); }
          70% { opacity: 0.35; transform: scale(1.01); }
          100% { opacity: 0; transform: scale(1); }
        }

        @keyframes creepyEyes {
          0% { opacity: 0; transform: scale(0.6) translateY(10px); }
          20% { opacity: 0.85; transform: scale(1.1) translateY(0); filter: drop-shadow(0 0 15px rgba(255, 0, 0, 0.9)); }
          45% { opacity: 0.9; transform: scale(1.05); }
          75% { opacity: 0.4; transform: scale(0.95); }
          100% { opacity: 0; transform: scale(0.8) translateY(-10px); }
        }

        .horror-shake-effect {
          animation: horrorShake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        .horror-blood-vignette {
          animation: bloodPulse 2.8s ease-out forwards;
        }

        .horror-flicker-overlay {
          animation: horrorFlicker 2.6s linear forwards;
        }

        .horror-creepy-eyes {
          animation: creepyEyes 2.5s ease-out forwards;
        }
      `}</style>

      {/* Screen Shake Container */}
      <div className="absolute inset-0 horror-shake-effect">
        {/* Blood Red Vignette around edges */}
        <div
          className="absolute inset-0 horror-blood-vignette"
          style={{
            background: "radial-gradient(ellipse at center, transparent 35%, rgba(140, 0, 0, 0.55) 75%, rgba(40, 0, 0, 0.92) 100%)",
            boxShadow: "inset 0 0 100px rgba(200, 0, 0, 0.8)",
          }}
        />

        {/* Eerie Strobe / Ghostly Flash Overlay */}
        <div
          className="absolute inset-0 horror-flicker-overlay bg-red-950/40 backdrop-invert-15"
          style={{
            mixBlendMode: "color-burn",
          }}
        />

        {/* Creepy Shadow Silhouette & Demon Eyes in Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center horror-creepy-eyes pointer-events-none">
          <div className="text-5xl tracking-widest filter drop-shadow-[0_0_25px_rgba(255,0,0,1)] select-none">
            👁️ &nbsp; 👁️
          </div>
          <div className="mt-2 text-[11px] tracking-[0.35em] uppercase text-red-500 font-extrabold opacity-75 font-mono">
            BEHIND YOU
          </div>
        </div>

        {/* Creepy Dark Scratch Lines */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255, 0, 0, 0.1) 4px)",
          }}
        />
      </div>
    </div>
  );
};
