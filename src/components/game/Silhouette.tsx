import { useState, useCallback } from "react";
import { Player, countryCodeToFlag } from "@/data/players";

interface SilhouetteProps {
  player: Player;
  revealed: boolean;
}

export function Silhouette({ player, revealed }: SilhouetteProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-40 flex items-center justify-center">
        {/* Generic silhouette SVG */}
        <svg
          viewBox="0 0 120 160"
          className={`w-full h-full transition-all duration-700 ${
            revealed ? "opacity-100" : "opacity-80"
          }`}
        >
          {/* Head */}
          <circle
            cx="60"
            cy="35"
            r="22"
            className={revealed ? "fill-primary" : "fill-muted-foreground/30"}
          />
          {/* Body */}
          <path
            d="M30 70 Q60 55 90 70 L95 130 Q60 140 25 130 Z"
            className={revealed ? "fill-primary" : "fill-muted-foreground/30"}
          />
          {/* Arms */}
          <path
            d="M30 70 L10 110"
            className={revealed ? "stroke-primary" : "stroke-muted-foreground/30"}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M90 70 L110 110"
            className={revealed ? "stroke-primary" : "stroke-muted-foreground/30"}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        {revealed && (
          <div className="absolute -bottom-1 text-center">
            <span className="text-2xl">{countryCodeToFlag(player.countryCode)}</span>
          </div>
        )}
      </div>
      {revealed && (
        <p className="text-lg font-display font-bold text-accent animate-bounce-in">
          {player.name}
        </p>
      )}
    </div>
  );
}
