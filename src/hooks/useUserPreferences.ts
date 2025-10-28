"use client";

import { useEffect, useState, useCallback } from "react";

export interface UserPreferences {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  animationsEnabled: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  soundEnabled: true,
  hapticsEnabled: true,
  animationsEnabled: true,
};

const STORAGE_KEY = "waffles:preferences";

export function useUserPreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Load stored preferences on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserPreferences;
        setPrefs((prev) => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.warn("Failed to parse user preferences:", err);
    }
  }, []);

  // Save to localStorage whenever prefs change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  // Mutators — stable callbacks
  const setSoundEnabled = useCallback(
    (enabled: boolean) =>
      setPrefs((prev) => ({ ...prev, soundEnabled: enabled })),
    []
  );

  const toggleSound = useCallback(
    () => setPrefs((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled })),
    []
  );

  const setHapticsEnabled = useCallback(
    (enabled: boolean) =>
      setPrefs((prev) => ({ ...prev, hapticsEnabled: enabled })),
    []
  );

  const toggleHaptics = useCallback(
    () =>
      setPrefs((prev) => ({ ...prev, hapticsEnabled: !prev.hapticsEnabled })),
    []
  );

  const setAnimationsEnabled = useCallback(
    (enabled: boolean) =>
      setPrefs((prev) => ({ ...prev, animationsEnabled: enabled })),
    []
  );

  const toggleAnimations = useCallback(
    () =>
      setPrefs((prev) => ({
        ...prev,
        animationsEnabled: !prev.animationsEnabled,
      })),
    []
  );

  return {
    prefs,
    setPrefs,
    setSoundEnabled,
    toggleSound,
    setHapticsEnabled,
    toggleHaptics,
    setAnimationsEnabled,
    toggleAnimations,
  };
}
