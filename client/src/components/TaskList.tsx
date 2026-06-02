/**
 * TaskList — Task management sidebar
 * Design: Retro-Futurist Dashboard
 * Features: Add/edit/delete tasks, set active task, priority badges, pomodoro progress
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp,
  Target, Tag, MoreVertical, Pencil, X, Check
} from "lucide-react";
import { usePomodoro, Task } from "@/contexts/PomodoroContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PRIORITY_CONFIG = {
  high: { label: "High", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  medium: { label: "Med", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  low: { label: "Low", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
};

interface AddTaskFormProps {
  onClose: () => void;
}

function AddTaskForm({ onClose }: AddTaskFormProps) {
  const { addTask } = usePomodoro();
  const [title, setTitle] = useState("");
  const [estimated, setEstimated] = useState(1);
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [tags, setTags] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      estimatedPomodoros: estimated,
      priority,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="card-neon rounded-xl p-4 space-y-3 mb-3">
      <Input
        autoFocus
        placeholder="What are you working on?"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
      />

      <div className="flex gap-2">
        {/* Estimated pomodoros */}
        <div className="flex items-center gap-1.5 flex-1">
          <Target className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs text-white/40">Est.</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEstimated(Math.max(1, estimated - 1))}
              className="w-5 h-5 rounded bg-white/10 text-white/60 hover:bg-white/20 text-xs flex items-center justify-center"
            >−</button>
            <span className="text-sm text-white font-medium w-4 text-center">{estimated}</span>
            <button
              type="button"
              onClick={() => setEstimated(Math.min(20, estimated + 1))}
              className="w-5 h-5 rounded bg-white/10 text-white/60 hover:bg-white/20 text-xs flex items-center justify-center"
            >+</button>
          </div>
        </div>

        {/* Priority */}
        <div className="flex gap-1">
          {(["low", "medium", "high"] as Task["priority"][]).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={cn(
                "px-2 py-0.5 rounded text-xs border transition-all",
                priority === p ? PRIORITY_CONFIG[p].color : "border-white/10 text-white/30 hover:border-white/20"
              )}
            >
              {PRIORITY_CONFIG[p].label}
            </button>
          ))}
        </div>
      </div>

      <Input
        placeholder="Tags (comma separated)"
        value={tags}
        onChange={e => setTags(e.target.value)}
        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs"
      />

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white/40 hover:text-white h-7 px-3"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!title.trim()}
          className="btn-neon h-7 px-3 text-xs"
        >
          Add Task
        </Button>
      </div>
    </form>
  );
}

interface TaskItemProps {
  task: Task;
  isActive: boolean;
}

function TaskItem({ task, isActive }: TaskItemProps) {
  const { setActiveTask, completeTask, deleteTask, updateTask } = usePomodoro();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      updateTask(task.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const pomodoroProgress = Math.min(task.completedPomodoros / task.estimatedPomodoros, 1);

  return (
    <div
      className={cn(
        "group relative rounded-xl p-3 border transition-all duration-200 cursor-pointer",
        task.completed
          ? "opacity-50 border-white/5 bg-white/2"
          : isActive
          ? "border-violet-500/40 bg-violet-500/10 shadow-[0_0_20px_rgba(124,58,237,0.15)]"
          : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"
      )}
      onClick={() => !task.completed && setActiveTask(isActive ? null : task.id)}
    >
      {/* Active indicator */}
      {isActive && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-r-full"
          style={{ background: 'linear-gradient(180deg, #7C3AED, #06B6D4)', boxShadow: '0 0 8px rgba(124,58,237,0.8)' }}
        />
      )}

      <div className="flex items-start gap-2.5">
        {/* Complete checkbox */}
        <button
          onClick={e => { e.stopPropagation(); completeTask(task.id); }}
          className="mt-0.5 flex-shrink-0 text-white/30 hover:text-emerald-400 transition-colors"
        >
          {task.completed ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
              <Input
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") setIsEditing(false);
                }}
                className="h-6 text-xs bg-white/10 border-white/20 text-white px-2"
              />
              <button onClick={handleSaveEdit} className="text-emerald-400 hover:text-emerald-300">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setIsEditing(false)} className="text-white/40 hover:text-white/60">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p className={cn(
              "text-sm font-medium leading-snug",
              task.completed ? "line-through text-white/30" : "text-white/90"
            )}>
              {task.title}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {/* Priority badge */}
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded border font-medium",
              PRIORITY_CONFIG[task.priority].color
            )}>
              {PRIORITY_CONFIG[task.priority].label}
            </span>

            {/* Pomodoro progress */}
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(task.estimatedPomodoros, 8) }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      i < task.completedPomodoros
                        ? "bg-violet-400"
                        : "bg-white/15"
                    )}
                  />
                ))}
                {task.estimatedPomodoros > 8 && (
                  <span className="text-xs text-white/30">+{task.estimatedPomodoros - 8}</span>
                )}
              </div>
              <span className="text-xs text-white/30">
                {task.completedPomodoros}/{task.estimatedPomodoros}
              </span>
            </div>

            {/* Tags */}
            {task.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs text-cyan-400/60 flex items-center gap-0.5">
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>

          {/* Progress bar */}
          {task.estimatedPomodoros > 0 && (
            <div className="mt-2 h-0.5 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${pomodoroProgress * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 opacity-0 group-hover:opacity-100 text-white/40 hover:text-white hover:bg-white/10 flex-shrink-0 transition-all"
            >
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-white/10 text-white/80">
            <DropdownMenuItem
              onClick={e => { e.stopPropagation(); setIsEditing(true); }}
              className="hover:bg-white/10 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
              className="hover:bg-red-500/20 text-red-400 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function TaskList() {
  const { tasks, activeTaskId, stats, settings } = usePomodoro();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const dailyProgress = Math.min(stats.todayPomodoros / settings.dailyGoal, 1);

  return (
    <div className="flex flex-col h-full">
      {/* Daily goal progress */}
      <div className="mb-4 p-3 rounded-xl bg-white/3 border border-white/8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/50 font-medium">Daily Goal</span>
          <span className="text-xs font-bold text-violet-400">
            {stats.todayPomodoros} / {settings.dailyGoal}
          </span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-700"
            style={{ width: `${dailyProgress * 100}%` }}
          />
        </div>
        {dailyProgress >= 1 && (
          <p className="text-xs text-emerald-400 mt-1.5">🎉 Daily goal reached!</p>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/80 font-display">Tasks</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="h-7 px-2 text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Task
        </Button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <AddTaskForm onClose={() => setShowAddForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {activeTasks.length === 0 && !showAddForm && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">✨</div>
            <p className="text-sm text-white/30">No tasks yet</p>
            <p className="text-xs text-white/20 mt-1">Add a task to track your focus</p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {activeTasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.96 }}
              transition={{ duration: 0.2, delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
            >
              <TaskItem
                task={task}
                isActive={task.id === activeTaskId}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors mb-2"
            >
              {showCompleted ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Completed ({completedTasks.length})
            </button>

            {showCompleted && completedTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                isActive={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
