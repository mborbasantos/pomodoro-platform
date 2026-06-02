/**
 * DraggablePlayerContainer — Wrapper for YouTube player with drag and drop
 * Design: Retro-Futurist Dashboard
 * Features: Draggable positioning, smooth animations, pointer-events passthrough
 */

import { useState, useRef, useEffect } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraggablePlayerContainerProps {
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
}

export default function DraggablePlayerContainer({
  children,
  initialPosition = { x: 0, y: 0 },
  onPositionChange,
}: DraggablePlayerContainerProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    // Only allow dragging from the handle
    if (dragHandleRef.current && !dragHandleRef.current.contains(e.currentTarget)) {
      return;
    }

    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      const containerRect = containerRef.current.getBoundingClientRect();
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Constrain to viewport with padding
      const padding = 10;
      newX = Math.max(padding - containerRect.width, Math.min(newX, viewport.width - padding));
      newY = Math.max(padding, Math.min(newY, viewport.height - padding));

      setPosition({ x: newX, y: newY });
      onPositionChange?.({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed z-40 transition-all duration-200",
        isDragging && "shadow-2xl shadow-cyan-500/50"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      {/* Drag Handle */}
      <div
        ref={dragHandleRef}
        onMouseDown={handleMouseDown}
        className={cn(
          "flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 rounded-t-lg cursor-grab active:cursor-grabbing hover:from-cyan-500/30 hover:to-violet-500/30 transition-all duration-200",
          isDragging && "from-cyan-500/40 to-violet-500/40"
        )}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-medium text-white/70">Music Player</span>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-white/50 hover:text-white/80 transition-colors"
          title={isMinimized ? "Restore" : "Minimize"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMinimized ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m0-6l7-7 7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Player Content */}
      {!isMinimized && (
        <div className="bg-[#0D0D1A]/95 backdrop-blur-md border border-white/8 border-t-0 rounded-b-lg overflow-hidden pointer-events-auto">
          {children}
        </div>
      )}
    </div>
  );
}
