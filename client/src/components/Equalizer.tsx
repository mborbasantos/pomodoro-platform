/*
 * Equalizer — Animated equalizer bars that respond to music volume
 * Design: Retro-Futurist Dashboard
 * Features: Smooth animations, volume-responsive heights, gradient colors
 */

import { useEffect, useState } from "react";

interface EqualizerProps {
  volume: number;
  isPlaying: boolean;
  barCount?: number;
}

export default function Equalizer({
  volume,
  isPlaying,
  barCount = 12,
}: EqualizerProps) {
  const [barHeights, setBarHeights] = useState<number[]>(
    Array(barCount).fill(0)
  );

  useEffect(() => {
    if (!isPlaying || volume === 0) {
      // Fade out bars when not playing
      setBarHeights(Array(barCount).fill(0));
      return;
    }

    // Generate random heights based on volume
    const interval = setInterval(() => {
      const newHeights = Array(barCount)
        .fill(0)
        .map(() => {
          // Base height from volume (0-100)
          const baseHeight = (volume / 100) * 1000;
          // Add random variation (±30% of base height)
          const variation = (Math.random() - 0.5) * baseHeight * 0.6;
          return Math.max(10, Math.min(100, baseHeight + variation));
        });
      setBarHeights(newHeights);
    }, 150); // Update every 150ms for smooth animation

    return () => clearInterval(interval);
  }, [volume, isPlaying, barCount]);

  return (
    <div className="flex items-end justify-center gap-1.5 h-16 px-4">
      {barHeights.map((height, i) => {
        // Create gradient color based on bar position
        const hue = (i / barCount) * 120 + 180; // Cyan to violet range
        const saturation = 70 + (volume / 100) * 30; // More saturated at higher volumes
        const lightness = 50 + (volume / 100) * 10; // Brighter at higher volumes

        return (
          <div
            key={i}
            className="flex-1 rounded-t-sm transition-all duration-100 ease-out shadow-lg"
            style={{
              height: `${height}%`,
              backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
              boxShadow: `0 0 8px hsl(${hue}, ${saturation}%, ${lightness}%), inset 0 0 4px rgba(255, 255, 255, 0.2)`,
              minHeight: "4px",
            }}
          />
        );
      })}
    </div>
  );
}
