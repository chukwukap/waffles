import * as React from "react";

/**
 * Countdown timer hook with drift-resistant timing.
 * Uses requestAnimationFrame for smooth updates and accurate timing.
 *
 * @param durationSec - Total countdown duration in seconds
 * @param onComplete - Callback invoked when countdown reaches zero
 * @param autoStart - Whether to start automatically (default: true)
 */
export function useCountdown(
  durationSec: number,
  onComplete?: () => void,
  autoStart: boolean = true
) {
  const [remaining, setRemaining] = React.useState(durationSec);
  const [isRunning, setIsRunning] = React.useState(autoStart);

  // Refs to avoid re-renders and maintain stable references
  const rAFRef = React.useRef<number | null>(null);
  const endTimeRef = React.useRef<number | null>(null);
  const onCompleteRef = React.useRef(onComplete);
  const remainingRef = React.useRef(remaining);

  // Keep refs in sync
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  React.useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  // Core animation loop
  const loop = React.useCallback(() => {
    if (!endTimeRef.current) return;

    const now = Date.now();
    const newRemaining = Math.max(0, (endTimeRef.current - now) / 1000);

    if (newRemaining <= 0) {
      // Timer finished
      setRemaining(0);
      setIsRunning(false);
      endTimeRef.current = null;
      if (rAFRef.current) {
        cancelAnimationFrame(rAFRef.current);
        rAFRef.current = null;
      }
      onCompleteRef.current?.();
    } else {
      setRemaining(newRemaining);
      rAFRef.current = requestAnimationFrame(loop);
    }
  }, []);

  // Start/stop timer based on isRunning state
  React.useEffect(() => {
    if (isRunning && !rAFRef.current) {
      // Start timer
      endTimeRef.current = Date.now() + remainingRef.current * 1000;
      rAFRef.current = requestAnimationFrame(loop);
    } else if (!isRunning && rAFRef.current) {
      // Stop timer
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
      endTimeRef.current = null;
    }

    return () => {
      if (rAFRef.current) {
        cancelAnimationFrame(rAFRef.current);
        rAFRef.current = null;
      }
    };
  }, [isRunning, loop]);

  // Reset when duration changes
  React.useEffect(() => {
    // Stop current timer
    if (rAFRef.current) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
    endTimeRef.current = null;

    // Reset state
    setRemaining(durationSec);
    remainingRef.current = durationSec;
    setIsRunning(autoStart);

    // Auto-start if enabled
    if (autoStart) {
      endTimeRef.current = Date.now() + durationSec * 1000;
      rAFRef.current = requestAnimationFrame(loop);
    }
  }, [durationSec, autoStart, loop]);

  // Control functions
  const start = React.useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = React.useCallback(() => {
    if (endTimeRef.current) {
      // Update remaining to exact paused time
      const exactRemaining = Math.max(
        0,
        (endTimeRef.current - Date.now()) / 1000
      );
      setRemaining(exactRemaining);
      remainingRef.current = exactRemaining;
    }
    setIsRunning(false);
  }, []);

  const reset = React.useCallback(() => {
    // Stop timer
    if (rAFRef.current) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
    endTimeRef.current = null;

    // Reset state
    setRemaining(durationSec);
    remainingRef.current = durationSec;
    setIsRunning(autoStart);

    // Auto-start if enabled
    if (autoStart) {
      endTimeRef.current = Date.now() + durationSec * 1000;
      rAFRef.current = requestAnimationFrame(loop);
    }
  }, [durationSec, autoStart, loop]);

  // Calculate percentage
  const percentage = React.useMemo(() => {
    if (durationSec <= 0) return 0;
    return ((durationSec - Math.max(0, remaining)) / durationSec) * 100;
  }, [remaining, durationSec]);

  return {
    remaining: Math.max(0, remaining),
    isRunning,
    start,
    pause,
    reset,
    percentage,
  };
}
