/**
 * SettingsPanel — Full settings configuration
 * Design: Retro-Futurist Dashboard
 * Features: Timer durations, auto-start, sound, notifications, daily goal
 */

import { usePomodoro } from "@/contexts/PomodoroContext";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Volume2, Bell, Target, Zap, RefreshCw, Music } from "lucide-react";
// YouTubePlayer is now mounted persistently in Home.tsx for always-available playback
import { cn } from "@/lib/utils";

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 font-medium">{label}</p>
        {description && <p className="text-xs text-white/30 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

interface DurationInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

function DurationInput({ value, onChange, min = 1, max = 90 }: DurationInputProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 rounded-lg bg-white/8 text-white/60 hover:bg-white/15 hover:text-white transition-all text-sm font-bold flex items-center justify-center active:scale-95"
      >
        −
      </button>
      <span className="text-sm font-bold text-white w-8 text-center font-display">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-7 h-7 rounded-lg bg-white/8 text-white/60 hover:bg-white/15 hover:text-white transition-all text-sm font-bold flex items-center justify-center active:scale-95"
      >
        +
      </button>
      <span className="text-xs text-white/30 w-6">min</span>
    </div>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <div className="card-neon rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-violet-400">{icon}</div>
        <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPanel() {
  const { settings, updateSettings } = usePomodoro();

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-1">
      {/* Timer Durations */}
      <Section icon={<Clock className="w-4 h-4" />} title="Timer Durations">
        <SettingRow label="Focus" description="Work session length">
          <DurationInput
            value={settings.workDuration}
            onChange={v => updateSettings({ workDuration: v })}
            min={1}
            max={90}
          />
        </SettingRow>
        <SettingRow label="Short Break" description="Short rest period">
          <DurationInput
            value={settings.shortBreakDuration}
            onChange={v => updateSettings({ shortBreakDuration: v })}
            min={1}
            max={30}
          />
        </SettingRow>
        <SettingRow label="Long Break" description="Extended rest period">
          <DurationInput
            value={settings.longBreakDuration}
            onChange={v => updateSettings({ longBreakDuration: v })}
            min={5}
            max={60}
          />
        </SettingRow>
        <SettingRow label="Long Break Interval" description="Sessions before long break">
          <DurationInput
            value={settings.longBreakInterval}
            onChange={v => updateSettings({ longBreakInterval: v })}
            min={2}
            max={10}
          />
        </SettingRow>
      </Section>

      {/* Auto-start */}
      <Section icon={<RefreshCw className="w-4 h-4" />} title="Auto-Start">
        <SettingRow label="Auto-start Breaks" description="Automatically begin break after focus">
          <Switch
            checked={settings.autoStartBreaks}
            onCheckedChange={v => updateSettings({ autoStartBreaks: v })}
          />
        </SettingRow>
        <SettingRow label="Auto-start Focus" description="Automatically begin focus after break">
          <Switch
            checked={settings.autoStartWork}
            onCheckedChange={v => updateSettings({ autoStartWork: v })}
          />
        </SettingRow>
      </Section>

      {/* Sound */}
      <Section icon={<Volume2 className="w-4 h-4" />} title="Sound">
        <SettingRow label="Sound Enabled">
          <Switch
            checked={settings.soundEnabled}
            onCheckedChange={v => updateSettings({ soundEnabled: v })}
          />
        </SettingRow>
        {settings.soundEnabled && (
          <>
            <SettingRow label="Alarm Sound">
              <Select
                value={settings.alarmSound}
                onValueChange={v => updateSettings({ alarmSound: v as any })}
              >
                <SelectTrigger className="w-28 h-8 text-xs bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                  <SelectItem value="bell" className="text-xs hover:bg-white/10">Bell</SelectItem>
                  <SelectItem value="digital" className="text-xs hover:bg-white/10">Digital</SelectItem>
                  <SelectItem value="gentle" className="text-xs hover:bg-white/10">Gentle</SelectItem>
                  <SelectItem value="none" className="text-xs hover:bg-white/10">None</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="Volume" description={`${settings.soundVolume}%`}>
              <div className="w-28">
                <Slider
                  value={[settings.soundVolume]}
                  onValueChange={([v]) => updateSettings({ soundVolume: v })}
                  min={0}
                  max={100}
                  step={5}
                  className="[&_[role=slider]]:bg-violet-400 [&_[role=slider]]:border-violet-500"
                />
              </div>
            </SettingRow>
            <SettingRow label="Ticking Sound" description="Subtle tick during focus">
              <Switch
                checked={settings.tickingEnabled}
                onCheckedChange={v => updateSettings({ tickingEnabled: v })}
              />
            </SettingRow>
          </>
        )}
      </Section>

      {/* Notifications */}
      <Section icon={<Bell className="w-4 h-4" />} title="Notifications">
        <SettingRow label="Browser Notifications" description="Alerts when sessions complete">
          <Switch
            checked={settings.notificationsEnabled}
            onCheckedChange={v => updateSettings({ notificationsEnabled: v })}
          />
        </SettingRow>
      </Section>

      {/* Goals */}
      <Section icon={<Target className="w-4 h-4" />} title="Goals">
        <SettingRow label="Daily Pomodoro Goal" description="Target sessions per day">
          <DurationInput
            value={settings.dailyGoal}
            onChange={v => updateSettings({ dailyGoal: v })}
            min={1}
            max={20}
          />
        </SettingRow>
      </Section>

      {/* Background Music */}
      <Section icon={<Music className="w-4 h-4" />} title="Background Music">
        <SettingRow label="Enable Background Music">
          <Switch
            checked={settings.backgroundMusicEnabled}
            onCheckedChange={v => updateSettings({ backgroundMusicEnabled: v })}
          />
        </SettingRow>
        {settings.backgroundMusicEnabled && (
          <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
            <SettingRow label="Pause on Break" description="Auto-pause during break sessions">
              <Switch
                checked={settings.backgroundMusicPauseOnBreak}
                onCheckedChange={v => updateSettings({ backgroundMusicPauseOnBreak: v })}
              />
            </SettingRow>
            <p className="text-xs text-white/40 text-center py-2">🎵 Music player controls available in the main interface</p>
          </div>
        )}
      </Section>

      {/* Presets */}
      <div className="card-neon rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-violet-400" />
          <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Quick Presets</h4>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Classic", work: 25, short: 5, long: 15 },
            { label: "Deep Work", work: 50, short: 10, long: 30 },
            { label: "Sprint", work: 15, short: 3, long: 10 },
          ].map(preset => (
            <button
              key={preset.label}
              onClick={() => updateSettings({
                workDuration: preset.work,
                shortBreakDuration: preset.short,
                longBreakDuration: preset.long,
              })}
              className="p-2 rounded-lg bg-white/5 border border-white/8 hover:border-violet-500/30 hover:bg-violet-500/10 transition-all text-center group"
            >
              <p className="text-xs font-medium text-white/70 group-hover:text-violet-300">{preset.label}</p>
              <p className="text-xs text-white/30 mt-0.5">{preset.work}/{preset.short}/{preset.long}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
