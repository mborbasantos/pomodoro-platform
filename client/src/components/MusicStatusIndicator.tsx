/**
 * MusicStatusIndicator — Visual indicator showing music playback status
 * Design: Retro-Futurist Dashboard
 * Features: Animated waveform, status badge, music info display
 */

import { useEffect, useState } from "react";
import { Music, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface MusicStatusIndicatorProps {
  isPlaying: boolean;
  isMusicEnabled: boolean;
  volume: number;
  musicUrl?: string;
}

export default function MusicStatusIndicator({
  isPlaying,
  isMusicEnabled,
  volume,
  musicUrl,
}: MusicStatusIndicatorProps) {
  const [waveHeights, setWaveHeights] = useState<number[]>([0, 0, 0, 0, 0]);
  const [pulseScale, setPulseScale] = useState(1);

  // Animate waveform when music is playing
  useEffect(() => {
    if (!isPlaying || !isMusicEnabled || volume === 0) {
      setWaveHeights([0, 0, 0, 0, 0]);
      return;
    }

    const interval = setInterval(() => {
      const newHeights = Array(5)
        .fill(0)
        .map(() => {
          const baseHeight = (volume / 100) * 100;
          const variation = (Math.random() - 0.5) * baseHeight * 0.8;
          return Math.max(20, Math.min(100, baseHeight + variation));
        });
      setWaveHeights(newHeights);
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, isMusicEnabled, volume]);

  // Animate pulse effect
  useEffect(() => {
    if (!isPlaying || !isMusicEnabled) {
      setPulseScale(1);
      return;
    }

    const interval = setInterval(() => {
      setPulseScale(prev => (prev === 1 ? 1.15 : 1));
    }, 600);

    return () => clearInterval(interval);
  }, [isPlaying, isMusicEnabled]);

  if (!isMusicEnabled) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
        <VolumeX className="w-4 h-4 text-white/30" />
        <span className="text-xs text-white/30">Music Off</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Status badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20">
        {/* Animated waveform */}
        <div className="flex items-end gap-1 h-6">
          {waveHeights.map((height, i) => (
            <div
              key={i}
              className={cn(
                "w-1 rounded-t-sm transition-all duration-100 ease-out",
                isPlaying && isMusicEnabled
                  ? "bg-gradient-to-t from-cyan-400 to-violet-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]"
                  : "bg-white/20"
              )}
              style={{
                height: isPlaying && isMusicEnabled ? `${height}%` : "20%",
                minHeight: "4px",
              }}
            />
          ))}
        </div>

        {/* Status text */}
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              isPlaying && isMusicEnabled
                ? "bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                : "bg-white/30"
            )}
          />
          <span className="text-xs font-medium text-white/70">
            {isPlaying && isMusicEnabled ? "🎵 Playing" : "🎵 Ready"}
          </span>
        </div>

        {/* Volume indicator */}
        <div className="flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-white/40" />
          <span className="text-xs text-white/50 w-6 text-right">{volume}%</span>
        </div>
      </div>

      {/* Music URL indicator (if available) */}
      {musicUrl && (
        <div className="text-xs text-white/40 text-center max-w-xs truncate">
          {musicUrl.includes("youtube.com") || musicUrl.includes("youtu.be")
            ? "🎬 YouTube Music"
            : "🎵 Custom Audio"}
        </div>
      )}
    </div>
  );
}
