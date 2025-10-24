"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseCountdownOptions {
  // Total duration in seconds (mutually exclusive with target)
  durationSeconds?: number;
  // Absolute wall-clock target for countdown end
  target?: Date | number; // epoch ms
  // Autostart countdown on mount (default: true)
  autoStart?: boolean;
  // Tick interval (default: 1000ms)
  intervalMs?: number;
  // Optional callbacks
  onTick?: (millisecondsLeft: number) => void;
  onComplete?: () => void;
}

interface UseCountdownResult {
  millisecondsLeft: number;
  secondsLeft: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (opts?: { durationSeconds?: number; target?: Date | number }) => void;
  setTarget: (target: Date | number) => void;
}

/**
 * High-accuracy countdown hook.
 * - Uses a fixed end timestamp to avoid drift across ticks.
 * - Supports either relative duration or absolute target time.
 */
export function useCountdown(
  options: UseCountdownOptions = {}
): UseCountdownResult {
  const {
    durationSeconds,
    target,
    autoStart = true,
    intervalMs = 1000,
    onTick,
    onComplete,
  } = options;

  const [endAt, setEndAt] = useState<number>(() => {
    if (typeof target !== "undefined") {
      return target instanceof Date ? target.getTime() : target;
    }
    if (typeof durationSeconds === "number") {
      return Date.now() + Math.max(0, durationSeconds) * 1000;
    }
    return 0; // inactive until started
  });

  const [isRunning, setIsRunning] = useState<boolean>(
    Boolean(autoStart && (durationSeconds || target))
  );
  const intervalRef = useRef<number | null>(null);
  // Track the current clock time to drive re-renders each tick
  const [now, setNow] = useState<number>(Date.now());

  const millisecondsLeft = useMemo(
    () => Math.max(0, endAt - now),
    [endAt, now]
  );
  const secondsLeft = Math.ceil(millisecondsLeft / 1000);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const ms = Math.max(0, endAt - Date.now());
    // Advance the clock to force consumers to re-render
    setNow(Date.now());
    if (onTick) onTick(ms);
    if (ms <= 0) {
      clearTimer();
      setIsRunning(false);
      onComplete?.();
    }
  }, [endAt, onTick, onComplete, clearTimer]);

  const start = useCallback(() => {
    if (!endAt || endAt <= Date.now()) return; // nothing to start
    if (intervalRef.current !== null) return;
    setIsRunning(true);
    // Immediate tick to sync consumers before first interval fires
    tick();
    intervalRef.current = window.setInterval(tick, Math.max(16, intervalMs));
  }, [endAt, intervalMs, tick]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    // Convert remaining time into a new endAt relative to pause moment
    const remaining = Math.max(0, endAt - Date.now());
    setEndAt(Date.now() + remaining);
  }, [clearTimer, endAt]);

  const reset = useCallback(
    (opts?: { durationSeconds?: number; target?: Date | number }) => {
      clearTimer();
      const nextTarget = opts?.target ?? target;
      const nextDuration =
        typeof opts?.durationSeconds === "number"
          ? opts.durationSeconds
          : durationSeconds;

      if (typeof nextTarget !== "undefined") {
        const ts =
          nextTarget instanceof Date ? nextTarget.getTime() : nextTarget;
        setEndAt(ts);
        setIsRunning(Boolean(autoStart));
        if (autoStart) {
          // Sync once immediately, then start ticking
          tick();
          intervalRef.current = window.setInterval(
            tick,
            Math.max(16, intervalMs)
          );
        }
        return;
      }
      if (typeof nextDuration === "number") {
        const ts = Date.now() + Math.max(0, nextDuration) * 1000;
        setEndAt(ts);
        setIsRunning(Boolean(autoStart));
        if (autoStart) {
          // Sync once immediately, then start ticking
          tick();
          intervalRef.current = window.setInterval(
            tick,
            Math.max(16, intervalMs)
          );
        }
        return;
      }
      // No inputs -> stop and clear
      setEndAt(0);
      setIsRunning(false);
    },
    [autoStart, clearTimer, durationSeconds, intervalMs, target, tick]
  );

  const setTarget = useCallback(
    (t: Date | number) => {
      clearTimer();
      const ts = t instanceof Date ? t.getTime() : t;
      setEndAt(ts);
      setIsRunning(Boolean(autoStart));
      if (autoStart) {
        // Sync once immediately, then start ticking
        tick();
        intervalRef.current = window.setInterval(
          tick,
          Math.max(16, intervalMs)
        );
      }
    },
    [autoStart, clearTimer, intervalMs, tick]
  );

  // Manage lifecycle
  useEffect(() => {
    if (autoStart && (durationSeconds || target)) {
      start();
    }
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    millisecondsLeft,
    secondsLeft,
    isRunning,
    start,
    pause,
    reset,
    setTarget,
  };
}
