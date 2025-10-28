"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseCountdownOptions {
  durationSeconds?: number;
  target?: Date | number;
  autoStart?: boolean;
  intervalMs?: number;
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
 * A high-accuracy countdown hook that avoids drift by calculating remaining time
 * based on a fixed end timestamp (`endAt`). Supports relative durations or absolute targets.
 */
export function useCountdown(
  options: UseCountdownOptions = {} //
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
    return 0;
  });

  const [isRunning, setIsRunning] = useState<boolean>(
    Boolean(autoStart && (durationSeconds != null || target != null))
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [now, setNow] = useState<number>(() => Date.now());

  const millisecondsLeft = useMemo(
    () => Math.max(0, endAt - now),
    [endAt, now]
  );
  const secondsLeft = useMemo(
    () => Math.ceil(millisecondsLeft / 1000),
    [millisecondsLeft]
  );

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const currentTime = Date.now();
    const msRemaining = Math.max(0, endAt - currentTime);

    setNow(currentTime);
    onTick?.(msRemaining);

    if (msRemaining <= 0) {
      clearTimer();
      setIsRunning(false);
      onComplete?.();
    }
  }, [endAt, onTick, onComplete, clearTimer]);

  const start = useCallback(() => {
    if (isRunning || !endAt || endAt <= Date.now()) return;

    setIsRunning(true);
    tick();
    intervalRef.current = setInterval(tick, Math.max(16, intervalMs));
  }, [isRunning, endAt, intervalMs, tick]);

  const pause = useCallback(() => {
    if (!isRunning) return;

    clearTimer();
    setIsRunning(false);
    const remainingMs = Math.max(0, endAt - Date.now());
    setEndAt(Date.now() + remainingMs);
  }, [isRunning, clearTimer, endAt]);

  const reset = useCallback(
    (opts?: { durationSeconds?: number; target?: Date | number }) => {
      clearTimer();

      const nextTargetOpt = opts?.target ?? target;
      const nextDurationOpt = opts?.durationSeconds ?? durationSeconds;

      let nextEndAt = 0;
      if (typeof nextTargetOpt !== "undefined") {
        nextEndAt =
          nextTargetOpt instanceof Date
            ? nextTargetOpt.getTime()
            : nextTargetOpt;
      } else if (typeof nextDurationOpt === "number") {
        nextEndAt = Date.now() + Math.max(0, nextDurationOpt) * 1000;
      }

      setEndAt(nextEndAt);
      const shouldAutoStart = Boolean(autoStart && nextEndAt > 0);
      setIsRunning(shouldAutoStart);
      setNow(Date.now());

      if (shouldAutoStart) {
        tick();
        intervalRef.current = setInterval(tick, Math.max(16, intervalMs));
      }
    },
    [autoStart, clearTimer, durationSeconds, intervalMs, target, tick]
  );

  const setTarget = useCallback(
    (newTarget: Date | number) => {
      //
      clearTimer();
      const nextEndAt =
        newTarget instanceof Date ? newTarget.getTime() : newTarget;
      setEndAt(nextEndAt);
      const shouldAutoStart = Boolean(autoStart && nextEndAt > 0);
      setIsRunning(shouldAutoStart);
      setNow(Date.now());

      if (shouldAutoStart) {
        tick();
        intervalRef.current = setInterval(tick, Math.max(16, intervalMs));
      }
    },
    [autoStart, clearTimer, intervalMs, tick]
  );

  useEffect(() => {
    if (autoStart && (durationSeconds != null || target != null)) {
      start();
    }
    return clearTimer;
  }, [autoStart, durationSeconds, target, start, clearTimer]);

  // --- Return Hook API ---
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
