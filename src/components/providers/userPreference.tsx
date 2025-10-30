"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// --- Types and Constants (from your original file) ---

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

// --- Define the shape of the Context ---

type SetPrefs = (
  value: UserPreferences | ((val: UserPreferences) => UserPreferences)
) => void;

interface PrefsContextType {
  prefs: UserPreferences;
  setPrefs: SetPrefs;
  removePrefs: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  setHapticsEnabled: (enabled: boolean) => void;
  toggleHaptics: () => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  toggleAnimations: () => void;
}

// --- Create the Context ---

const UserPreferencesContext = createContext<PrefsContextType | undefined>(
  undefined
);

// --- Create the Provider Component ---

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  // Call useLocalStorage *once* here in the provider
  const [prefs, setPrefs, removePrefs] = useLocalStorage<UserPreferences>(
    STORAGE_KEY,
    DEFAULT_PREFERENCES
  );

  // --- Mutators (from your original file, now defined here) ---
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

  // Memoize the context value to provide to children
  const value = useMemo(
    () => ({
      prefs,
      setPrefs,
      removePrefs,
      setSoundEnabled,
      toggleSound,
      setHapticsEnabled,
      toggleHaptics,
      setAnimationsEnabled,
      toggleAnimations,
    }),
    [
      prefs,
      setPrefs,
      removePrefs,
      setSoundEnabled,
      toggleSound,
      setHapticsEnabled,
      toggleHaptics,
      setAnimationsEnabled,
      toggleAnimations,
    ]
  );

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

// --- Create the Consumer Hook (this is what your components use) ---

/**
 * Hook to access and manage user preferences.
 * Must be used within a <UserPreferencesProvider>.
 */
export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider"
    );
  }
  return context;
}
