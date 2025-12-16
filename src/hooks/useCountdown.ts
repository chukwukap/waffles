/**
 * useCountdown Hook (Optimized)
 *
 * Efficient countdown that only updates once per second.
 * Uses setTimeout aligned to second boundaries for accuracy.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseCountdownOptions {
  onComplete?: () => void;
  autoStart?: boolean;
}

interface UseCountdownReturn {
  /** Remaining seconds (integer) */
  seconds: number;
  /** Whether the countdown is running */
  isRunning: boolean;
  /** Whether the countdown has completed */
  isComplete: boolean;
  /** Start or resume the countdown */
  start: () => void;
  /** Pause the countdown */
  pause: () => void;
  /** Reset to initial duration */
  reset: () => void;
}

/**
 * Efficient countdown hook.
 *
 * @param targetMs - Unix timestamp when countdown ends (ms)
 * @param options - Configuration options
 * @returns Countdown state and controls
 */
export function useCountdown(
  targetMs: number,
  options: UseCountdownOptions = {}
): UseCountdownReturn {
  const { onComplete, autoStart = true } = options;

  // Calculate initial seconds
  const getSecondsRemaining = useCallback(() => {
    return Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
  }, [targetMs]);

  const [seconds, setSeconds] = useState(getSecondsRemaining);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);

  // Refs for callbacks (avoid stale closures)
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Sync state when target changes
  useEffect(() => {
    const newSeconds = getSecondsRemaining();
    setSeconds(newSeconds);
    setIsComplete(newSeconds <= 0);
    if (newSeconds > 0 && autoStart) {
      setIsRunning(true);
    }
  }, [targetMs, getSecondsRemaining, autoStart]);

  // Main countdown effect
  useEffect(() => {
    if (!isRunning || isComplete) return;

    // Calculate ms until next second boundary
    const now = Date.now();
    const msUntilNextSecond = 1000 - (now % 1000);

    const timeout = setTimeout(() => {
      const remaining = getSecondsRemaining();
      setSeconds(remaining);

      if (remaining <= 0) {
        setIsComplete(true);
        setIsRunning(false);
        onCompleteRef.current?.();
      }
    }, msUntilNextSecond);

    return () => clearTimeout(timeout);
  }, [seconds, isRunning, isComplete, getSecondsRemaining]);

  // Control functions
  const start = useCallback(() => {
    if (!isComplete) {
      setIsRunning(true);
    }
  }, [isComplete]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setSeconds(getSecondsRemaining());
    setIsComplete(false);
    setIsRunning(autoStart);
  }, [getSecondsRemaining, autoStart]);

  return {
    seconds,
    isRunning,
    isComplete,
    start,
    pause,
    reset,
  };
}

/**
 * Simplified countdown from duration.
 *
 * @param durationSec - Duration in seconds
 * @param options - Configuration options
 */
export function useCountdownFromDuration(
  durationSec: number,
  options: UseCountdownOptions = {}
): UseCountdownReturn {
  const targetMs = useRef(Date.now() + durationSec * 1000).current;
  return useCountdown(targetMs, options);
}
