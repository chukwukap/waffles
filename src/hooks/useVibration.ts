"use client";

import { useCallback } from "react";

export function useVibration() {
  const vibrate = useCallback((pattern: number | number[] = 80) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn("Vibration failed:", error);
      }
    }
  }, []);

  return { vibrate };
}
