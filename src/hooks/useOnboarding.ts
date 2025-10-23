"use client";

import { useCallback, useEffect, useState } from "react";

const ONBOARDING_STORAGE_KEY = "waffles:onboarded:v1";

/**
 * Manages first-time user onboarding state with safe, persistent storage.
 * We intentionally scope persistence to the device (localStorage) to avoid
 * leaking cross-account state and to keep UX snappy without server roundtrips.
 */
export function useOnboarding() {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(ONBOARDING_STORAGE_KEY)
          : null;
      setIsOnboarded(stored === "true");
    } catch (_err) {
      console.log(_err);
      // If storage is blocked, default to showing onboarding once
      setIsOnboarded(false);
    } finally {
      setIsReady(true);
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      }
    } catch (_err) {
      console.log(_err);
      // Non-fatal: proceed even if storage fails
    }
    setIsOnboarded(true);
  }, []);

  return {
    isReady,
    isOnboarded,
    shouldShowOnboarding: isReady && !isOnboarded,
    // for testing
    // shouldShowOnboarding: true,
    completeOnboarding,
  };
}
