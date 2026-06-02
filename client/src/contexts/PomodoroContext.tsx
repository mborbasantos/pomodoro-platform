/**
 * PomodoroContext — Central state management for FocusFlow
 * Design: Retro-Futurist Dashboard
 *
 * Manages: timer state, tasks, session history, settings, statistics
 * Persists to localStorage for session continuity
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAmbientSound } from "@/hooks/useAmbientSound";
import { nanoid } from "nanoid";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TimerMode = "work" | "short-break" | "long-break";

export interface Task {
  id: string;
  title: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  notes?: string;
  priority: "low" | "medium" | "high";
  tags: string[];
}

export interface SessionRecord {
  id: string;
  taskId?: string;
  taskTitle?: string;
  mode: TimerMode;
  duration: number; // seconds
  completedAt: number;
  interrupted: boolean;
}

export interface PomodoroSettings {
  workDuration: number;       // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number;  // minutes
  longBreakInterval: number;  // after N work sessions
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  notificationsEnabled: boolean;
  tickingEnabled: boolean;
  alarmSound: "bell" | "digital" | "gentle" | "none";
  dailyGoal: number; // target pomodoros per day
  backgroundMusicEnabled: boolean;
  backgroundMusicVolume: number;
  backgroundMusicUrl?: string; // YouTube video URL
  backgroundMusicPauseOnBreak: boolean; // auto-pause during breaks
}

export interface PomodoroStats {
  totalPomodoros: number;
  totalFocusTime: number; // seconds
  totalBreakTime: number; // seconds
  currentStreak: number;  // consecutive days
  longestStreak: number;
  todayPomodoros: number;
  weekPomodoros: number[];  // last 7 days
  completionRate: number;   // % of sessions not interrupted
}

interface PomodoroContextValue {
  // Timer state
  mode: TimerMode;
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
  isPaused: boolean;
  pomodoroCount: number;
  sessionCount: number;

  // Active task
  activeTaskId: string | null;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt" | "completedPomodoros" | "completed">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setActiveTask: (id: string | null) => void;
  completeTask: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;

  // Timer controls
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  setMode: (mode: TimerMode) => void;

  // Session history
  sessions: SessionRecord[];
  clearHistory: () => void;

  // Settings
  settings: PomodoroSettings;
  updateSettings: (updates: Partial<PomodoroSettings>) => void;

  // Stats
  stats: PomodoroStats;

  // UI state
  showConfetti: boolean;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  soundEnabled: true,
  soundVolume: 70,
  notificationsEnabled: true,
  tickingEnabled: false,
  alarmSound: "bell",
  dailyGoal: 8,
  backgroundMusicEnabled: false,
  backgroundMusicVolume: 30,
  backgroundMusicUrl: undefined,
  backgroundMusicPauseOnBreak: true,
};

const DEFAULT_TASKS: Task[] = [
  {
    id: nanoid(),
    title: "Design new landing page",
    estimatedPomodoros: 4,
    completedPomodoros: 0,
    completed: false,
    createdAt: Date.now(),
    priority: "high",
    tags: ["design", "work"],
  },
  {
    id: nanoid(),
    title: "Review pull requests",
    estimatedPomodoros: 2,
    completedPomodoros: 0,
    completed: false,
    createdAt: Date.now() - 1000,
    priority: "medium",
    tags: ["code", "review"],
  },
  {
    id: nanoid(),
    title: "Write weekly report",
    estimatedPomodoros: 1,
    completedPomodoros: 0,
    completed: false,
    createdAt: Date.now() - 2000,
    priority: "low",
    tags: ["writing"],
  },
];

// ─── Context ─────────────────────────────────────────────────────────────────

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

function getDurationForMode(mode: TimerMode, settings: PomodoroSettings): number {
  switch (mode) {
    case "work": return settings.workDuration * 60;
    case "short-break": return settings.shortBreakDuration * 60;
    case "long-break": return settings.longBreakDuration * 60;
  }
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function computeStats(sessions: SessionRecord[], settings: PomodoroSettings): PomodoroStats {
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTs = todayStart.getTime();

  const workSessions = sessions.filter(s => s.mode === "work");
  const completedWork = workSessions.filter(s => !s.interrupted);

  const totalPomodoros = completedWork.length;
  const totalFocusTime = completedWork.reduce((acc, s) => acc + s.duration, 0);
  const totalBreakTime = sessions
    .filter(s => s.mode !== "work" && !s.interrupted)
    .reduce((acc, s) => acc + s.duration, 0);

  const todayPomodoros = completedWork.filter(s => s.completedAt >= todayTs).length;

  // Last 7 days
  const weekPomodoros = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - (6 - i));
    const dayEnd = dayStart.getTime() + 86400000;
    return completedWork.filter(s => s.completedAt >= dayStart.getTime() && s.completedAt < dayEnd).length;
  });

  // Streak calculation
  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;
  for (let i = 6; i >= 0; i--) {
    if (weekPomodoros[i] > 0) {
      streak++;
      if (i === 6 || (i < 6 && weekPomodoros[i + 1] > 0)) {
        currentStreak = streak;
      }
    } else {
      streak = 0;
    }
    longestStreak = Math.max(longestStreak, streak);
  }

  const completionRate = workSessions.length > 0
    ? Math.round((completedWork.length / workSessions.length) * 100)
    : 100;

  return {
    totalPomodoros,
    totalFocusTime,
    totalBreakTime,
    currentStreak,
    longestStreak,
    todayPomodoros,
    weekPomodoros,
    completionRate,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PomodoroSettings>(() =>
    loadFromStorage("ff_settings", DEFAULT_SETTINGS)
  );
  const [tasks, setTasks] = useState<Task[]>(() =>
    loadFromStorage("ff_tasks", DEFAULT_TASKS)
  );
  const [sessions, setSessions] = useState<SessionRecord[]>(() =>
    loadFromStorage("ff_sessions", [])
  );
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [mode, setModeState] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(() => getDurationForMode("work", loadFromStorage("ff_settings", DEFAULT_SETTINGS)));
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<number>(0);
  const totalTimeRef = useRef(getDurationForMode("work", settings));

  const totalTime = getDurationForMode(mode, settings);

  // Persist tasks and sessions
  useEffect(() => { saveToStorage("ff_tasks", tasks); }, [tasks]);
  useEffect(() => { saveToStorage("ff_sessions", sessions); }, [sessions]);
  useEffect(() => { saveToStorage("ff_settings", settings); }, [settings]);

  // Play alarm sound
  const playAlarm = useCallback(() => {
    if (!settings.soundEnabled || settings.alarmSound === "none") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const gain = ctx.createGain();
      gain.gain.value = settings.soundVolume / 100;
      gain.connect(ctx.destination);

      const playTone = (freq: number, start: number, duration: number, type: OscillatorType = "sine") => {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      if (settings.alarmSound === "bell") {
        playTone(880, 0, 0.3);
        playTone(1100, 0.35, 0.3);
        playTone(1320, 0.7, 0.5);
      } else if (settings.alarmSound === "digital") {
        playTone(440, 0, 0.1, "square");
        playTone(880, 0.15, 0.1, "square");
        playTone(440, 0.3, 0.1, "square");
        playTone(880, 0.45, 0.2, "square");
      } else if (settings.alarmSound === "gentle") {
        playTone(528, 0, 0.8);
        playTone(660, 0.4, 0.8);
      }
    } catch {}
  }, [settings.soundEnabled, settings.soundVolume, settings.alarmSound]);

  // Browser notification
  const sendNotification = useCallback((title: string, body: string) => {
    if (!settings.notificationsEnabled) return;
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  }, [settings.notificationsEnabled]);

  // Handle session completion
  const completeSession = useCallback((interrupted: boolean = false) => {
    const duration = totalTimeRef.current - timeLeft;
    const activeTask = tasks.find(t => t.id === activeTaskId);

    const record: SessionRecord = {
      id: nanoid(),
      taskId: activeTaskId ?? undefined,
      taskTitle: activeTask?.title,
      mode,
      duration: interrupted ? duration : totalTimeRef.current,
      completedAt: Date.now(),
      interrupted,
    };

    setSessions(prev => [record, ...prev].slice(0, 500));

    if (!interrupted && mode === "work") {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      setSessionCount(prev => prev + 1);

      // Update task pomodoro count
      if (activeTaskId) {
        setTasks(prev => prev.map(t =>
          t.id === activeTaskId
            ? { ...t, completedPomodoros: t.completedPomodoros + 1 }
            : t
        ));
      }

      // Trigger confetti
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      playAlarm();
      sendNotification("Pomodoro Complete! 🎉", "Time for a well-deserved break.");

      // Determine next mode
      const isLongBreak = newCount % settings.longBreakInterval === 0;
      const nextMode: TimerMode = isLongBreak ? "long-break" : "short-break";

      if (settings.autoStartBreaks) {
        setModeState(nextMode);
        const nextDuration = getDurationForMode(nextMode, settings);
        totalTimeRef.current = nextDuration;
        setTimeLeft(nextDuration);
        sessionStartRef.current = Date.now();
        setIsRunning(true);
      } else {
        setModeState(nextMode);
        const nextDuration = getDurationForMode(nextMode, settings);
        totalTimeRef.current = nextDuration;
        setTimeLeft(nextDuration);
        setIsRunning(false);
        setIsPaused(false);
      }
    } else if (!interrupted && mode !== "work") {
      playAlarm();
      sendNotification("Break Over!", "Ready to focus again?");

      if (settings.autoStartWork) {
        setModeState("work");
        const nextDuration = getDurationForMode("work", settings);
        totalTimeRef.current = nextDuration;
        setTimeLeft(nextDuration);
        sessionStartRef.current = Date.now();
        setIsRunning(true);
      } else {
        setModeState("work");
        const nextDuration = getDurationForMode("work", settings);
        totalTimeRef.current = nextDuration;
        setTimeLeft(nextDuration);
        setIsRunning(false);
        setIsPaused(false);
      }
    }
  }, [mode, timeLeft, pomodoroCount, activeTaskId, tasks, settings, playAlarm, sendNotification]);

  // Timer tick
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            completeSession(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isPaused, completeSession]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ─── Controls ──────────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    sessionStartRef.current = Date.now();
    setIsRunning(true);
    setIsPaused(false);
    
    // Trigger music playback if in work mode and background music is enabled
    if (mode === "work" && settings.backgroundMusicEnabled && settings.backgroundMusicUrl) {
      console.log("[startTimer] Triggering music playback");
      
      // Retry multiple times with increasing delays to handle iframe readiness
      const attempts = [0, 50, 100, 200, 400];
      attempts.forEach((delay, index) => {
        setTimeout(() => {
          const player = (window as any).__youtubePlayer;
          if (player && player.play) {
            try {
              console.log(`[startTimer] Attempt ${index + 1} at ${delay}ms to play music`);
              player.play();
              console.log(`[startTimer] Music play command sent on attempt ${index + 1}`);
            } catch (e) {
              console.error(`[startTimer] Attempt ${index + 1} failed:`, e);
            }
          } else {
            console.warn(`[startTimer] Attempt ${index + 1}: player not available`);
          }
        }, delay);
      });
    }
  }, [mode, settings.backgroundMusicEnabled, settings.backgroundMusicUrl]);

  const pauseTimer = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    if (isRunning) {
      completeSession(true);
    }
    setIsRunning(false);
    setIsPaused(false);
    const duration = getDurationForMode(mode, settings);
    totalTimeRef.current = duration;
    setTimeLeft(duration);
  }, [isRunning, mode, settings, completeSession]);

  const skipTimer = useCallback(() => {
    if (isRunning) {
      completeSession(true);
    } else {
      const nextMode: TimerMode =
        mode === "work"
          ? (pomodoroCount + 1) % settings.longBreakInterval === 0
            ? "long-break"
            : "short-break"
          : "work";
      setModeState(nextMode);
      const duration = getDurationForMode(nextMode, settings);
      totalTimeRef.current = duration;
      setTimeLeft(duration);
      setIsRunning(false);
      setIsPaused(false);
    }
  }, [isRunning, mode, pomodoroCount, settings, completeSession]);

  const setMode = useCallback((newMode: TimerMode) => {
    if (isRunning) completeSession(true);
    setModeState(newMode);
    const duration = getDurationForMode(newMode, settings);
    totalTimeRef.current = duration;
    setTimeLeft(duration);
    setIsRunning(false);
    setIsPaused(false);
  }, [isRunning, settings, completeSession]);

  // ─── Tasks ─────────────────────────────────────────────────────────────────

  const addTask = useCallback((task: Omit<Task, "id" | "createdAt" | "completedPomodoros" | "completed">) => {
    const newTask: Task = {
      ...task,
      id: nanoid(),
      createdAt: Date.now(),
      completedPomodoros: 0,
      completed: false,
    };
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeTaskId === id) setActiveTaskId(null);
  }, [activeTaskId]);

  const completeTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, completed: !t.completed, completedAt: t.completed ? undefined : Date.now() } : t
    ));
    if (activeTaskId === id) setActiveTaskId(null);
  }, [activeTaskId]);

  const reorderTasks = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
  }, []);

  // ─── Settings ──────────────────────────────────────────────────────────────

  const updateSettings = useCallback((updates: Partial<PomodoroSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      // Update timer if duration changed and not running
      if (!isRunning) {
        const duration = getDurationForMode(mode, next);
        totalTimeRef.current = duration;
        setTimeLeft(duration);
      }
      return next;
    });
  }, [isRunning, mode]);

  const clearHistory = useCallback(() => {
    setSessions([]);
  }, []);

  // Ticking sound
  useAmbientSound(
    settings.tickingEnabled,
    isRunning,
    isPaused,
    settings.soundVolume
  );

  // Auto-pause/resume background music with fade effect
  useEffect(() => {
    if (!settings.backgroundMusicEnabled || !settings.backgroundMusicPauseOnBreak) return;

    const iframeElement = document.querySelector('iframe[title="Background Music"]') as HTMLIFrameElement | null;
    if (!iframeElement) return;

    const command = mode === "work" ? "playVideo" : "pauseVideo";

    // Fade out
    try {
      iframeElement.style.transition = "opacity 0.8s ease-out";
      iframeElement.style.opacity = "0.3";
    } catch {}

    // Pause/play after fade starts
    const pauseTimeout = setTimeout(() => {
      try {
        iframeElement.contentWindow?.postMessage(
          { event: "command", func: command },
          "*"
        );
      } catch {}
    }, 400);

    // Fade in
    const fadeInTimeout = setTimeout(() => {
      try {
        iframeElement.style.transition = "opacity 0.8s ease-in";
        iframeElement.style.opacity = "1";
      } catch {}
    }, 400);

    return () => {
      clearTimeout(pauseTimeout);
      clearTimeout(fadeInTimeout);
    };
  }, [mode, settings.backgroundMusicEnabled, settings.backgroundMusicPauseOnBreak]);

  // Auto-play music only when entering focus mode
  useEffect(() => {
    if (!settings.backgroundMusicEnabled || mode !== "work") return;
    
    console.log("[Autoplay] Starting focus mode, attempting to play music");

    // Try multiple times with increasing delays to ensure iframe is ready
    const timeouts: NodeJS.Timeout[] = [];
    
    // First attempt at 100ms - try using global player method
    timeouts.push(setTimeout(() => {
      try {
        console.log("[Autoplay] Attempt 1 at 100ms");
        const player = (window as any).__youtubePlayer;
        if (player && player.play) {
          player.play();
        } else {
          // Fallback to direct iframe access
          const iframeElement = document.querySelector('iframe[title="Background Music"]') as HTMLIFrameElement | null;
          iframeElement?.contentWindow?.postMessage(
            { event: "command", func: "playVideo" },
            "*"
          );
        }
      } catch (e) {
        console.error("[Autoplay] Attempt 1 failed:", e);
      }
    }, 100));

    // Retry at 300ms
    timeouts.push(setTimeout(() => {
      try {
        console.log("[Autoplay] Attempt 2 at 300ms");
        const player = (window as any).__youtubePlayer;
        if (player && player.play) {
          player.play();
        } else {
          const iframeElement = document.querySelector('iframe[title="Background Music"]') as HTMLIFrameElement | null;
          iframeElement?.contentWindow?.postMessage(
            { event: "command", func: "playVideo" },
            "*"
          );
        }
      } catch (e) {
        console.error("[Autoplay] Attempt 2 failed:", e);
      }
    }, 300));

    // Retry at 600ms
    timeouts.push(setTimeout(() => {
      try {
        console.log("[Autoplay] Attempt 3 at 600ms");
        const player = (window as any).__youtubePlayer;
        if (player && player.play) {
          player.play();
        } else {
          const iframeElement = document.querySelector('iframe[title="Background Music"]') as HTMLIFrameElement | null;
          iframeElement?.contentWindow?.postMessage(
            { event: "command", func: "playVideo" },
            "*"
          );
        }
      } catch (e) {
        console.error("[Autoplay] Attempt 3 failed:", e);
      }
    }, 600));

    // Final retry at 1000ms
    timeouts.push(setTimeout(() => {
      try {
        console.log("[Autoplay] Attempt 4 at 1000ms");
        const player = (window as any).__youtubePlayer;
        if (player && player.play) {
          player.play();
        } else {
          const iframeElement = document.querySelector('iframe[title="Background Music"]') as HTMLIFrameElement | null;
          iframeElement?.contentWindow?.postMessage(
            { event: "command", func: "playVideo" },
            "*"
          );
        }
      } catch (e) {
        console.error("[Autoplay] Attempt 4 failed:", e);
      }
    }, 1000));

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [mode, settings.backgroundMusicEnabled]);

  const stats = computeStats(sessions, settings);

  return (
    <PomodoroContext.Provider value={{
      mode,
      timeLeft,
      totalTime,
      isRunning,
      isPaused,
      pomodoroCount,
      sessionCount,
      activeTaskId,
      tasks,
      addTask,
      updateTask,
      deleteTask,
      setActiveTask: setActiveTaskId,
      completeTask,
      reorderTasks,
      startTimer,
      pauseTimer,
      resetTimer,
      skipTimer,
      setMode,
      sessions,
      clearHistory,
      settings,
      updateSettings,
      stats,
      showConfetti,
    }}>
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro must be used within PomodoroProvider");
  return ctx;
}
