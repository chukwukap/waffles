import { useEffect, useRef } from "react";

export const useCountdown = (
  onTick: () => void,
  interval: number = 1000,
  enabled: boolean = true
) => {
  const savedCallback = useRef(onTick);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = onTick;
  });

  // Set up the interval.
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval, enabled]);
};
