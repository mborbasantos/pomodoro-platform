/**
 * TimerRing — Animated SVG circular progress ring
 * Design: Retro-Futurist — gradient stroke with neon glow effect
 * Animates stroke-dashoffset for smooth countdown visualization
 */

import { useEffect, useRef } from "react";
import { TimerMode } from "@/contexts/PomodoroContext";

interface TimerRingProps {
  progress: number; // 0 to 1 (1 = full, 0 = empty)
  mode: TimerMode;
  isRunning: boolean;
  isPaused: boolean;
  size?: number;
  strokeWidth?: number;
}

const MODE_COLORS: Record<TimerMode, { from: string; to: string; glow: string; id: string }> = {
  "work": {
    from: "#7C3AED",
    to: "#06B6D4",
    glow: "rgba(124, 58, 237, 0.5)",
    id: "grad-work",
  },
  "short-break": {
    from: "#06B6D4",
    to: "#10B981",
    glow: "rgba(6, 182, 212, 0.5)",
    id: "grad-short",
  },
  "long-break": {
    from: "#10B981",
    to: "#3B82F6",
    glow: "rgba(16, 185, 129, 0.5)",
    id: "grad-long",
  },
};

export default function TimerRing({
  progress,
  mode,
  isRunning,
  isPaused,
  size = 280,
  strokeWidth = 8,
}: TimerRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  const colors = MODE_COLORS[mode];
  const gradId = `${colors.id}-${size}`;
  const filterId = `glow-${mode}-${size}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background glow image */}
      <div
        className="absolute inset-0 rounded-full opacity-20 blur-2xl transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${colors.from}40 0%, transparent 70%)`,
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg]"
        style={{ filter: `drop-shadow(0 0 12px ${colors.glow})` }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
          <filter id={filterId}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Inner fill circle for depth */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - strokeWidth / 2}
          fill="rgba(0,0,0,0.2)"
        />

        {/* Track ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />

        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: isRunning && !isPaused
              ? "stroke-dashoffset 1s linear"
              : "stroke-dashoffset 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
            filter: `url(#${filterId})`,
          }}
        />

        {/* Dot at progress end — SVG is rotated -90deg, so we compensate */}
        {progress > 0.01 && progress < 0.99 && (
          <circle
            cx={size / 2 + radius * Math.cos(2 * Math.PI * progress - Math.PI / 2)}
            cy={size / 2 + radius * Math.sin(2 * Math.PI * progress - Math.PI / 2)}
            r={strokeWidth / 2 + 1}
            fill={colors.to}
            style={{ filter: `drop-shadow(0 0 6px ${colors.to})` }}
          />
        )}
      </svg>

      {/* Breathing pulse when paused */}
      {isPaused && (
        <div
          className="absolute inset-0 rounded-full animate-pulse-glow"
          style={{
            border: `1px solid ${colors.from}30`,
            boxShadow: `0 0 30px ${colors.glow}`,
          }}
        />
      )}
    </div>
  );
}
