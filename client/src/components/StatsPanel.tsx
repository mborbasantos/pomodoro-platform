/**
 * StatsPanel — Statistics dashboard and session history
 * Design: Retro-Futurist Dashboard
 * Features: Daily/weekly charts, streak, focus time, session log
 */

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell
} from "recharts";
import { Flame, Clock, Target, TrendingUp, Trash2, CheckCircle, XCircle } from "lucide-react";
import { usePomodoro, SessionRecord } from "@/contexts/PomodoroContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}

function StatCard({ icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className="card-neon rounded-xl p-4 flex flex-col gap-2">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white font-display">{value}</p>
        <p className="text-xs text-white/40 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-white/25 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SessionItem({ session }: { session: SessionRecord }) {
  const modeColors = {
    "work": "text-violet-400",
    "short-break": "text-cyan-400",
    "long-break": "text-emerald-400",
  };
  const modeLabels = {
    "work": "Focus",
    "short-break": "Short Break",
    "long-break": "Long Break",
  };

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className="flex-shrink-0">
        {session.interrupted ? (
          <XCircle className="w-4 h-4 text-red-400/60" />
        ) : (
          <CheckCircle className="w-4 h-4 text-emerald-400/60" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs font-medium", modeColors[session.mode])}>
          {modeLabels[session.mode]}
        </p>
        {session.taskTitle && (
          <p className="text-xs text-white/30 truncate">{session.taskTitle}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-white/50">{formatDuration(session.duration)}</p>
        <p className="text-xs text-white/25">{formatTime(session.completedAt)}</p>
      </div>
    </div>
  );
}

export default function StatsPanel() {
  const { stats, sessions, clearHistory, settings } = usePomodoro();
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");

  // Build chart data for last 7 days
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sun
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const chartData = stats.weekPomodoros.map((count, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dayIdx = d.getDay();
    const dayLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIdx];
    return {
      day: dayLabel,
      count,
      isToday: i === 6,
    };
  });

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  // Group sessions by date
  const groupedSessions: Record<string, SessionRecord[]> = {};
  sessions.slice(0, 50).forEach(s => {
    const key = formatDate(s.completedAt);
    if (!groupedSessions[key]) groupedSessions[key] = [];
    groupedSessions[key].push(s);
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-xs">
          <p className="text-white font-medium">{payload[0].value} pomodoros</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/8 mb-4">
        {(["overview", "history"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-200 capitalize",
              activeTab === tab
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "text-white/40 hover:text-white/60"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {activeTab === "overview" ? (
          <div className="space-y-4">
            {/* Stat cards grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<Target className="w-4 h-4 text-violet-300" />}
                label="Total Pomodoros"
                value={String(stats.totalPomodoros)}
                color="bg-violet-500/20"
              />
              <StatCard
                icon={<Clock className="w-4 h-4 text-cyan-300" />}
                label="Focus Time"
                value={formatDuration(stats.totalFocusTime)}
                color="bg-cyan-500/20"
              />
              <StatCard
                icon={<Flame className="w-4 h-4 text-amber-300" />}
                label="Current Streak"
                value={`${stats.currentStreak}d`}
                sub={`Best: ${stats.longestStreak}d`}
                color="bg-amber-500/20"
              />
              <StatCard
                icon={<TrendingUp className="w-4 h-4 text-emerald-300" />}
                label="Completion Rate"
                value={`${stats.completionRate}%`}
                color="bg-emerald-500/20"
              />
            </div>

            {/* Today's progress */}
            <div className="card-neon rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Today</h4>
                <span className="text-xs text-violet-400 font-bold">
                  {stats.todayPomodoros} / {settings.dailyGoal} goal
                </span>
              </div>
              <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(stats.todayPomodoros / settings.dailyGoal, 1) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-white/25">0</span>
                <span className="text-xs text-white/25">{settings.dailyGoal}</span>
              </div>
            </div>

            {/* Weekly chart */}
            <div className="card-neon rounded-xl p-4">
              <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4">
                Last 7 Days
              </h4>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData} barSize={20} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.isToday ? "#7C3AED" : entry.count > 0 ? "#4C1D95" : "rgba(255,255,255,0.08)"}
                        style={entry.isToday ? { filter: "drop-shadow(0 0 6px rgba(124,58,237,0.6))" } : {}}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Break time */}
            <div className="card-neon rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/40">Total Break Time</p>
                  <p className="text-lg font-bold text-cyan-400 font-display mt-0.5">
                    {formatDuration(stats.totalBreakTime)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/40">Sessions Logged</p>
                  <p className="text-lg font-bold text-white font-display mt-0.5">
                    {sessions.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* History tab */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/40">{sessions.length} sessions recorded</p>
              {sessions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="h-6 px-2 text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-sm text-white/30">No sessions yet</p>
                <p className="text-xs text-white/20 mt-1">Complete a Pomodoro to see history</p>
              </div>
            ) : (
              Object.entries(groupedSessions).map(([date, dateSessions]) => (
                <div key={date} className="card-neon rounded-xl p-3">
                  <p className="text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">{date}</p>
                  {dateSessions.map(session => (
                    <SessionItem key={session.id} session={session} />
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
