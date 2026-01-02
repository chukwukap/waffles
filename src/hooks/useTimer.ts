"use client";

import { useState, useEffect, useRef } from "react";

/**
 * useTimer - Efficient countdown hook
 *
 * Returns seconds remaining until target timestamp.
 * Updates exactly once per second, aligned to clock.
 * Returns 0 when expired.
 * When targetMs is 0, timer is paused (doesn't tick or fire onComplete).
 *
 * @param targetMs - Absolute timestamp when timer ends (Date.now() + duration). 0 = paused.
 * @param onComplete - Optional callback when timer reaches 0
 */
export function useTimer(targetMs: number, onComplete?: () => void): number {
  const [seconds, setSeconds] = useState(() => {
    if (targetMs === 0) return 0; // Paused
    const diff = targetMs - Date.now();
    return Math.max(0, Math.ceil(diff / 1000));
  });

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const hasCompletedRef = useRef(false);

  useEffect(() => {
    // Reset completion flag when target changes
    hasCompletedRef.current = false;

    // If targetMs is 0, timer is paused - don't tick
    if (targetMs === 0) {
      setSeconds(0);
      return;
    }

    // Calculate initial seconds
    const getSeconds = () => {
      const diff = targetMs - Date.now();
      return Math.max(0, Math.ceil(diff / 1000));
    };

    // Update immediately
    const initial = getSeconds();
    setSeconds(initial);

    if (initial <= 0) {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }

    // Tick function
    const tick = () => {
      const remaining = getSeconds();
      setSeconds(remaining);

      if (remaining <= 0) {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onCompleteRef.current?.();
        }
        return;
      }

      // Schedule next tick aligned to second boundary
      const now = Date.now();
      const msUntilNextSecond = 1000 - (now % 1000);
      timeoutId = window.setTimeout(tick, msUntilNextSecond);
    };

    // Start ticking
    let timeoutId: number;
    const now = Date.now();
    const msUntilNextSecond = 1000 - (now % 1000);
    timeoutId = window.setTimeout(tick, msUntilNextSecond);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [targetMs]);

  return seconds;
}

/**
 * useTimerFromDuration - Convenience wrapper
 *
 * Creates a timer from a duration in seconds.
 * Timer target is computed once on mount.
 */
export function useTimerFromDuration(
  durationSec: number,
  onComplete?: () => void
): number {
  const targetRef = useRef(Date.now() + durationSec * 1000);
  return useTimer(targetRef.current, onComplete);
}
