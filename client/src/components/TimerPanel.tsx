/**
 * TimerPanel — Central timer display with controls
 * Design: Retro-Futurist Dashboard
 * Features: Mode switcher, circular ring, digit display, controls, keyboard shortcuts
 */

import { useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, SkipForward, Coffee, Zap, Clock } from "lucide-react";
import { usePomodoro, TimerMode } from "@/contexts/PomodoroContext";
import TimerRing from "./TimerRing";
import Equalizer from "./Equalizer";
import MusicStatusIndicator from "./MusicStatusIndicator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): { minutes: string; seconds: string } {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return {
    minutes: String(m).padStart(2, "0"),
    seconds: String(s).padStart(2, "0"),
  };
}

const MODE_CONFIG: Record<TimerMode, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  "work": {
    label: "Focus",
    icon: <Zap className="w-3.5 h-3.5" />,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/30 text-violet-300",
  },
  "short-break": {
    label: "Short Break",
    icon: <Coffee className="w-3.5 h-3.5" />,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
  },
  "long-break": {
    label: "Long Break",
    icon: <Clock className="w-3.5 h-3.5" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  },
};

export default function TimerPanel() {
  const {
    mode, timeLeft, totalTime, isRunning, isPaused,
    pomodoroCount, settings, activeTaskId, tasks,
    startTimer, pauseTimer, resetTimer, skipTimer, setMode,
  } = usePomodoro();

  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const { minutes, seconds } = formatTime(timeLeft);
  const activeTask = tasks.find(t => t.id === activeTaskId);
  const modeConfig = MODE_CONFIG[mode];

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.code === "Space") {
      e.preventDefault();
      isRunning ? pauseTimer() : startTimer();
    } else if (e.code === "KeyR" && !e.metaKey && !e.ctrlKey) {
      resetTimer();
    } else if (e.code === "KeyS" && !e.metaKey && !e.ctrlKey) {
      skipTimer();
    }
  }, [isRunning, startTimer, pauseTimer, resetTimer, skipTimer]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Update document title
  useEffect(() => {
    const status = isRunning && !isPaused ? "▶" : isPaused ? "⏸" : "⏹";
    document.title = `${status} ${minutes}:${seconds} — FocusFlow`;
    return () => { document.title = "FocusFlow — Advanced Pomodoro Platform"; };
  }, [minutes, seconds, isRunning, isPaused]);

  const nextBreakIn = settings.longBreakInterval - (pomodoroCount % settings.longBreakInterval);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Mode Switcher */}
      <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/8">
        {(["work", "short-break", "long-break"] as TimerMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200",
              mode === m
                ? MODE_CONFIG[m].bg
                : "border-transparent text-white/40 hover:text-white/70 hover:bg-white/5"
            )}
          >
            {MODE_CONFIG[m].icon}
            {MODE_CONFIG[m].label}
          </button>
        ))}
      </div>

      {/* Timer Ring + Digits */}
      <div className="relative flex items-center justify-center">
        <TimerRing
          progress={progress}
          mode={mode}
          isRunning={isRunning}
          isPaused={isPaused}
          size={280}
          strokeWidth={8}
        />

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          {/* Mode label */}
          <span className={cn("text-xs font-medium uppercase tracking-widest opacity-60", modeConfig.color)}>
            {modeConfig.label}
          </span>

          {/* Time digits */}
          <div className="timer-digits text-7xl font-black text-white leading-none tracking-tight">
            <span
              className={cn(
                "transition-all duration-300",
                isRunning && !isPaused ? "text-glow-violet" : ""
              )}
            >
              {minutes}
            </span>
            <span className="opacity-40 mx-0.5 animate-pulse">:</span>
            <span>{seconds}</span>
          </div>

          {/* Active task */}
          {activeTask && (
            <div className="mt-1 max-w-[180px] text-center">
              <p className="text-xs text-white/50 truncate">{activeTask.title}</p>
            </div>
          )}

          {/* Session dots */}
          <div className="flex gap-1.5 mt-2">
            {Array.from({ length: settings.longBreakInterval }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  i < (pomodoroCount % settings.longBreakInterval)
                    ? "bg-violet-400 shadow-[0_0_6px_rgba(124,58,237,0.8)]"
                    : "bg-white/15"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Music Status Indicator and Equalizer */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Music Status Indicator - shows next to timer */}
        {settings.backgroundMusicEnabled && (
          <MusicStatusIndicator
            isPlaying={isRunning && !isPaused && mode === "work"}
            isMusicEnabled={settings.backgroundMusicEnabled}
            volume={settings.backgroundMusicVolume}
            musicUrl={settings.backgroundMusicUrl}
          />
        )}

        {/* Equalizer - shows when music is playing */}
        {settings.backgroundMusicEnabled && (
          <div className="w-full px-4">
            <Equalizer
              volume={settings.backgroundMusicVolume}
              isPlaying={isRunning && !isPaused && mode === "work"}
              barCount={12}
            />
          </div>
        )}
      </div>

      {/* Session info */}
      <div className="flex items-center gap-4 text-xs text-white/40">
        <span>Session #{pomodoroCount + 1}</span>
        <span>·</span>
        <span>Long break in {nextBreakIn} {nextBreakIn === 1 ? "session" : "sessions"}</span>
        {pomodoroCount > 0 && (
          <>
            <span>·</span>
            <span className="text-violet-400">{pomodoroCount} completed today</span>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetTimer}
              className="w-10 h-10 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Reset <kbd className="ml-1 text-xs opacity-60">R</kbd></p>
          </TooltipContent>
        </Tooltip>

        {/* Main play/pause button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={isRunning ? pauseTimer : startTimer}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95",
                isRunning && !isPaused
                  ? "bg-white/10 border border-white/20 text-white hover:bg-white/15"
                  : "btn-neon text-white"
              )}
            >
              {isRunning && !isPaused ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{isRunning && !isPaused ? "Pause" : "Start"} <kbd className="ml-1 text-xs opacity-60">Space</kbd></p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={skipTimer}
              className="w-10 h-10 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200 active:scale-95"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Skip <kbd className="ml-1 text-xs opacity-60">S</kbd></p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Keyboard hint */}
      <p className="text-xs text-white/15 font-mono">
        [Space] start/pause · [R] reset · [S] skip
      </p>
    </div>
  );
}
