import { useEffect, useRef, useState } from "react";

/**
 * Efficient countdown hook based on end timestamp.
 * Updates just frequently enough for the UI, using setTimeout.
 */
export function useCountdown(targetTimeMs: number, onExpire?: () => void) {
  const [msLeft, setMsLeft] = useState(() =>
    Math.max(0, targetTimeMs - Date.now())
  );
  const timeoutRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);

  // Keep the ref up to date with the latest callback
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    let cancelled = false;
    function tick() {
      if (cancelled) return;
      const now = Date.now();
      const diff = targetTimeMs - now;
      if (diff <= 0) {
        setMsLeft(0);
        if (onExpireRef.current) onExpireRef.current();
        return;
      } else {
        setMsLeft(diff);
        // Next tick right as clock may change visually, i.e., on the next second boundary
        // Or at most every 250ms if very close.
        const toNextSecond = diff % 1000 === 0 ? 1000 : diff % 1000; // until next whole second boundary
        const next = Math.min(toNextSecond <= 0 ? 1000 : toNextSecond, 250);
        timeoutRef.current = window.setTimeout(tick, next);
      }
    }
    tick();
    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };
  }, [targetTimeMs]);
  return msLeft;
}
