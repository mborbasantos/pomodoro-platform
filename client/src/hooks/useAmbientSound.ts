/**
 * useAmbientSound — Ticking sound hook for focus sessions
 * Plays a subtle tick every second when enabled and timer is running
 */

import { useEffect, useRef } from "react";

export function useAmbientSound(
  enabled: boolean,
  isRunning: boolean,
  isPaused: boolean,
  volume: number
) {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!enabled || !isRunning || isPaused) return;

    const tick = () => {
      try {
        if (!ctxRef.current || ctxRef.current.state === "closed") {
          ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = ctxRef.current;
        const gain = ctx.createGain();
        gain.gain.value = (volume / 100) * 0.15;
        gain.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 800;
        osc.connect(gain);
        osc.start();
        osc.stop(ctx.currentTime + 0.02);
      } catch {}
    };

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [enabled, isRunning, isPaused, volume]);
}
