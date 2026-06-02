/**
 * FocusMode — Minimal distraction-free overlay
 * Design: Retro-Futurist — dark, centered, ambient
 * Triggered by the "Focus Mode" button in the timer panel
 */

import { X, Maximize2, Minimize2 } from "lucide-react";
import { usePomodoro } from "@/contexts/PomodoroContext";
import TimerPanel from "./TimerPanel";
import { cn } from "@/lib/utils";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663724021854/c2vf7ViKoMo7gXaCyKtNkA/hero-bg-4xwN4NfpEBb4ZtQVafgSH4.webp";

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FocusMode({ isOpen, onClose }: FocusModeProps) {
  const { mode, isRunning } = usePomodoro();

  const modeGradient = {
    "work": "from-violet-900/30 to-transparent",
    "short-break": "from-cyan-900/30 to-transparent",
    "long-break": "from-emerald-900/30 to-transparent",
  }[mode];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: "#0D0D1A",
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-[#0D0D1A]/85 backdrop-blur-sm" />
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className={cn("absolute inset-0 bg-gradient-to-br transition-all duration-1000", modeGradient)} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-all z-10"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <TimerPanel />
        {isRunning && (
          <p className="text-sm text-white/20 animate-pulse">
            {mode === "work" ? "Deep focus mode. You've got this." : "Take a real break. Step away."}
          </p>
        )}
      </div>
    </div>
  );
}
