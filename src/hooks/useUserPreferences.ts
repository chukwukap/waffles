"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

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
  const [prefs, setPrefs, removePrefs] = useLocalStorage<UserPreferences>(
    STORAGE_KEY,
    DEFAULT_PREFERENCES
  );

  // Mutators — stable callbacks
  const setSoundEnabled = useCallback(
    (enabled: boolean) =>
      setPrefs((prev) => ({ ...prev, soundEnabled: enabled })),
    [setPrefs]
  );

  const toggleSound = useCallback(
    () => setPrefs((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled })),
    [setPrefs]
  );

  const setHapticsEnabled = useCallback(
    (enabled: boolean) =>
      setPrefs((prev) => ({ ...prev, hapticsEnabled: enabled })),
    [setPrefs]
  );

  const toggleHaptics = useCallback(
    () =>
      setPrefs((prev) => ({ ...prev, hapticsEnabled: !prev.hapticsEnabled })),
    [setPrefs]
  );

  const setAnimationsEnabled = useCallback(
    (enabled: boolean) =>
      setPrefs((prev) => ({ ...prev, animationsEnabled: enabled })),
    [setPrefs]
  );

  const toggleAnimations = useCallback(
    () =>
      setPrefs((prev) => ({
        ...prev,
        animationsEnabled: !prev.animationsEnabled,
      })),
    [setPrefs]
  );

  return {
    prefs,
    setPrefs,
    removePrefs,
    setSoundEnabled,
    toggleSound,
    setHapticsEnabled,
    toggleHaptics,
    setAnimationsEnabled,
    toggleAnimations,
  };
}
