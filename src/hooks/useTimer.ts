"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseTimerOptions {
  duration: number;
  autoStart?: boolean;
  onComplete?: () => void;
}

export interface UseTimerResult {
  isRunning: boolean;
  elapsed: number;
  remaining: number;
  duration: number;
  percent: number;
  formatted: string;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

export function useTimer({
  duration,
  autoStart = false,
  onComplete,
}: UseTimerOptions): UseTimerResult {
  const [isRunning, setIsRunning] = useState(autoStart);
  const [elapsed, setElapsed] = useState(0);

  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const tick = useCallback(() => {
    if (!isRunning) return;

    const now = performance.now();
    if (startRef.current === null) {
      startRef.current = now;
    }

    const currentElapsed = elapsed + (now - startRef.current);
    const clampedElapsed = Math.min(currentElapsed, duration);

    setElapsed(clampedElapsed);
    startRef.current = now;

    if (clampedElapsed >= duration && !completedRef.current) {
      completedRef.current = true;
      setIsRunning(false);
      onComplete?.();
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [elapsed, duration, isRunning, onComplete]);

  const start = useCallback(() => {
    if (isRunning && !completedRef.current) return;
    completedRef.current = false;
    startRef.current = null;
    setElapsed(0);
    setIsRunning(true);
  }, [isRunning]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    setIsRunning(false);
  }, [isRunning]);

  const resume = useCallback(() => {
    if (isRunning || elapsed >= duration) return;
    setIsRunning(true);
    startRef.current = null;
  }, [isRunning, elapsed, duration]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
    startRef.current = null;
    completedRef.current = false;
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    startRef.current = null;
    completedRef.current = false;
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isRunning, tick]);

  useEffect(() => {
    if (autoStart) {
      start();
    }
  }, [autoStart, start]);

  const remaining = Math.max(duration - elapsed, 0);
  const percent = duration > 0 ? Math.min(elapsed / duration, 1) : 0;
  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  return {
    isRunning,
    elapsed,
    remaining,
    duration,
    percent,
    formatted,
    start,
    pause,
    resume,
    reset,
  };
}
