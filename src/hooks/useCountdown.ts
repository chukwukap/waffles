import * as React from "react";

// --- The Custom Hook ---

/**
 * A solid, drift-resistant countdown hook.
 *
 * @param durationSec   total countdown duration in seconds
 * @param onComplete    callback when countdown hits zero
 * @param autoStart     whether to start automatically
 */
export function useCountdown(
  durationSec: number,
  onComplete?: () => void,
  autoStart: boolean = true
) {
  const [remaining, setRemaining] = React.useState(durationSec);
  const [isRunning, setIsRunning] = React.useState(autoStart);

  // Refs for stable, non-re-rendering values
  const rAFRef = React.useRef<number | null>(null);
  const endTimeRef = React.useRef<number | null>(null);
  const remainingRef = React.useRef(remaining);

  // Keep remainingRef in sync with remaining state
  React.useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  // Use a ref to store the latest onComplete callback
  // This prevents the main effect from re-running if onComplete changes
  const onCompleteRef = React.useRef(onComplete);
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // The core timer loop
  const loop = React.useCallback(() => {
    if (!endTimeRef.current) {
      // Should not happen if isRunning, but a safeguard
      return;
    }

    const now = Date.now();
    const newRemaining = (endTimeRef.current - now) / 1000;

    if (newRemaining <= 0) {
      // Finished
      setRemaining(0);
      setIsRunning(false);
      onCompleteRef.current?.();
      endTimeRef.current = null;
      if (rAFRef.current) {
        cancelAnimationFrame(rAFRef.current);
        rAFRef.current = null;
      }
    } else {
      // Still running
      setRemaining(newRemaining);
      rAFRef.current = requestAnimationFrame(loop);
    }
  }, []);

  // Effect to start/stop the timer
  React.useEffect(() => {
    if (isRunning) {
      // --- Start or Resume ---
      // Only start if not already running (avoid double-start from reset effect)
      if (!rAFRef.current) {
        // We calculate a new end time based on the *current* remaining time
        // Use remainingRef to avoid dependency on remaining state
        endTimeRef.current = Date.now() + remainingRef.current * 1000;

        // Start the animation frame loop
        rAFRef.current = requestAnimationFrame(loop);
      }
    } else {
      // --- Pause ---
      // Stop any existing loop
      if (rAFRef.current) {
        cancelAnimationFrame(rAFRef.current);
        rAFRef.current = null;
      }
      // Clear the end time
      endTimeRef.current = null;
    }

    // Cleanup: ensure the loop is cancelled on unmount
    return () => {
      if (rAFRef.current) {
        cancelAnimationFrame(rAFRef.current);
        rAFRef.current = null;
      }
    };
  }, [isRunning, loop]); // Only re-run when isRunning changes, not when remaining changes

  // --- Control Functions ---

  const start = React.useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
    }
  }, [isRunning]);

  const pause = React.useCallback(() => {
    if (isRunning) {
      // We must set isRunning to false, which triggers the cleanup
      // in the useEffect above.
      // We also *synchronously* update remaining time to the exact moment of pause.
      if (endTimeRef.current) {
        const exactRemaining = (endTimeRef.current - Date.now()) / 1000;
        setRemaining(Math.max(0, exactRemaining));
      }
      setIsRunning(false);
    }
  }, [isRunning]);

  const reset = React.useCallback(() => {
    // Stop any active timer
    if (rAFRef.current) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
    endTimeRef.current = null;

    // Reset to initial state
    setRemaining(durationSec);
    setIsRunning(autoStart);
  }, [durationSec, autoStart]);

  // --- Reset if duration changes ---
  React.useEffect(() => {
    // Stop any active timer
    if (rAFRef.current) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
    endTimeRef.current = null;

    // Reset to initial state and update ref synchronously
    setRemaining(durationSec);
    remainingRef.current = durationSec; // Update ref synchronously to avoid race condition
    setIsRunning(autoStart);
    
    // If autoStart is true, restart the timer immediately
    // This ensures the timer starts even if isRunning was already true
    if (autoStart) {
      endTimeRef.current = Date.now() + durationSec * 1000;
      rAFRef.current = requestAnimationFrame(loop);
    }
  }, [durationSec, autoStart, loop]); // Reset when duration or autoStart changes

  // --- Derived State ---

  // Memoize percentage calculation
  const percentage = React.useMemo(() => {
    if (durationSec <= 0) return 0;
    // Ensure remaining is not negative for calculation
    const clampedRemaining = Math.max(0, remaining);
    return ((durationSec - clampedRemaining) / durationSec) * 100;
  }, [remaining, durationSec]);

  return {
    // Ensure remaining is never returned as negative
    remaining: Math.max(0, remaining),
    isRunning,
    start,
    pause,
    reset,
    percentage,
  };
}
