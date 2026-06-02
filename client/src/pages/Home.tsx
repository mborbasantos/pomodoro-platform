/**
 * Home — Main FocusFlow dashboard page
 * Design: Retro-Futurist Dashboard
 * Layout: Three-column asymmetric — Tasks | Timer | Stats
 * Mobile: Single column with bottom tab navigation
 */

import { useState } from "react";
import {
  ListTodo, BarChart2, Settings, Zap, Menu, X, Maximize2
} from "lucide-react";
import { usePomodoro } from "@/contexts/PomodoroContext";
import TimerPanel from "@/components/TimerPanel";
import TaskList from "@/components/TaskList";
import StatsPanel from "@/components/StatsPanel";
import SettingsPanel from "@/components/SettingsPanel";
import YouTubePlayer from "@/components/YouTubePlayer";
import Confetti from "@/components/Confetti";
import FocusMode from "@/components/FocusMode";
import { cn } from "@/lib/utils";

type MobileTab = "tasks" | "timer" | "stats" | "settings";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663724021854/c2vf7ViKoMo7gXaCyKtNkA/hero-bg-4xwN4NfpEBb4ZtQVafgSH4.webp";

export default function Home() {
  const { mode, isRunning, showConfetti, stats, settings, updateSettings } = usePomodoro();
  const [mobileTab, setMobileTab] = useState<MobileTab>("timer");
  const [rightPanel, setRightPanel] = useState<"stats" | "settings">("stats");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [focusModeOpen, setFocusModeOpen] = useState(false);

  const modeGradient = {
    "work": "from-violet-900/20 to-transparent",
    "short-break": "from-cyan-900/20 to-transparent",
    "long-break": "from-emerald-900/20 to-transparent",
  }[mode];

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: "#0D0D1A",
        backgroundImage: `url(${HERO_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#0D0D1A]/80 backdrop-blur-sm" />

      {/* Animated background grid */}
      <div className="absolute inset-0 bg-grid opacity-30" />

      {/* Mode color wash */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br transition-all duration-1000",
        modeGradient
      )} />

      {/* Confetti */}
      <Confetti active={showConfetti} />

      {/* Focus Mode overlay */}
      <FocusMode isOpen={focusModeOpen} onClose={() => setFocusModeOpen(false)} />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-4 md:px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(180deg, rgba(13,13,26,0.8) 0%, transparent 100%)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-[0_0_12px_rgba(124,58,237,0.5)]">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white font-display leading-none">FocusFlow</h1>
              <p className="text-xs text-white/30 leading-none mt-0.5">Advanced Pomodoro Platform</p>
            </div>
          </div>

          {/* Header stats — desktop */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-white/30">Today</p>
              <p className="text-sm font-bold text-violet-400 font-display">{stats.todayPomodoros}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-xs text-white/30">Streak</p>
              <p className="text-sm font-bold text-amber-400 font-display">{stats.currentStreak}d</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-xs text-white/30">Total</p>
              <p className="text-sm font-bold text-cyan-400 font-display">{stats.totalPomodoros}</p>
            </div>
          </div>

          {/* Right panel switcher — desktop */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setRightPanel("stats")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                rightPanel === "stats"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-white/40 hover:text-white/60 hover:bg-white/5"
              )}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Stats
            </button>
            <button
              onClick={() => setRightPanel("settings")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                rightPanel === "settings"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-white/40 hover:text-white/60 hover:bg-white/5"
              )}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white/60 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* ─── Main Layout ─────────────────────────────────────────────────── */}
        <main className="flex-1 flex overflow-hidden">

          {/* Desktop: Three-column layout */}
          <div className="hidden md:flex flex-1 gap-0 overflow-hidden">

            {/* Left: Task List */}
            <div className="w-72 xl:w-80 flex-shrink-0 border-r border-white/8 p-5 overflow-hidden flex flex-col">
              <TaskList />
            </div>

            {/* Center: Timer */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
              <div className="flex flex-col items-center gap-8 w-full max-w-md">
                <TimerPanel />

                {/* Ambient status text */}
                <div className="text-center space-y-3">
                  {isRunning ? (
                    <p className="text-sm text-white/30 animate-pulse">
                      {mode === "work" ? "Stay focused. You're doing great." : "Rest well. You've earned it."}
                    </p>
                  ) : (
                    <p className="text-sm text-white/20">
                      Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/40 text-xs">Space</kbd> to begin
                    </p>
                  )}
                  <button
                    onClick={() => setFocusModeOpen(true)}
                    className="flex items-center gap-1.5 mx-auto text-xs text-white/25 hover:text-white/50 transition-colors"
                  >
                    <Maximize2 className="w-3 h-3" />
                    Focus Mode
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Stats / Settings */}
            <div className="w-72 xl:w-80 flex-shrink-0 border-l border-white/8 p-5 overflow-hidden flex flex-col">
              {rightPanel === "stats" ? <StatsPanel /> : <SettingsPanel />}
            </div>
          </div>

          {/* Mobile: Single column with tab content */}
          <div className="md:hidden flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-4 pb-20">
              {mobileTab === "timer" && (
                <div className="flex flex-col items-center gap-6 pt-4">
                  <TimerPanel />
                  {isRunning && (
                    <p className="text-sm text-white/30 animate-pulse text-center">
                      {mode === "work" ? "Stay focused. You're doing great." : "Rest well. You've earned it."}
                    </p>
                  )}
                </div>
              )}
              {mobileTab === "tasks" && <TaskList />}
              {mobileTab === "stats" && <StatsPanel />}
              {mobileTab === "settings" && <SettingsPanel />}
            </div>
          </div>
        </main>

        {/* ─── Persistent YouTube Music Player ───────────────────────────────── */}
        {/* Mounted at app level so it's always available for startTimer() */}
        {settings.backgroundMusicEnabled && (
          <div className="fixed bottom-20 md:bottom-0 right-0 w-full md:w-96 max-h-96 overflow-hidden z-30 md:border-l md:border-t md:border-white/8 md:bg-[#0D0D1A]/95 md:backdrop-blur-md">
            <div className="p-4">
              <YouTubePlayer
                url={settings.backgroundMusicUrl}
                volume={settings.backgroundMusicVolume}
                onVolumeChange={v => updateSettings({ backgroundMusicVolume: v })}
                onUrlChange={url => updateSettings({ backgroundMusicUrl: url })}
                enabled={settings.backgroundMusicEnabled}
              />
            </div>
          </div>
        )}

        {/* ─── Mobile Bottom Nav ───────────────────────────────────────────── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0D0D1A]/95 backdrop-blur-md border-t border-white/8 z-20">
          <div className="flex items-center justify-around px-2 py-2">
            {([
              { id: "tasks", icon: <ListTodo className="w-5 h-5" />, label: "Tasks" },
              { id: "timer", icon: <Zap className="w-5 h-5" />, label: "Timer" },
              { id: "stats", icon: <BarChart2 className="w-5 h-5" />, label: "Stats" },
              { id: "settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
            ] as { id: MobileTab; icon: React.ReactNode; label: string }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all",
                  mobileTab === tab.id
                    ? "text-violet-400"
                    : "text-white/30 hover:text-white/50"
                )}
              >
                {tab.icon}
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
