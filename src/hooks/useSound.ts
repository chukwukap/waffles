// src/hooks/useSound.ts
// React hook for easy sound playback with automatic preference handling

import { useEffect, useCallback, useRef } from "react";
import { SoundManager } from "@/lib/sounds/SoundManager";
import { useUserPreferences } from "@/components/providers/userPreference";
import type { SoundName } from "@/lib/sounds/config";

/**
 * Hook for playing sounds with automatic preference handling
 * 
 * @example
 * const { play, stop } = useSound();
 * play('click');
 * 
 * @example
 * const { playUrl } = useSound();
 * playUrl('/sounds/scenes/matrix.mp3', { loop: true });
 */
export function useSound() {
  const { prefs } = useUserPreferences();
  const activeUrlRef = useRef<string>("");

  // Update SoundManager when preferences change
  useEffect(() => {
    SoundManager.setEnabled(prefs.soundEnabled);
  }, [prefs.soundEnabled]);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      SoundManager.init().catch(() => {
        // Silently fail - audio might not be available
      });
    };

    // Only add listeners if sound is enabled
    if (prefs.soundEnabled) {
      window.addEventListener("pointerdown", handleInteraction, { once: true });
      window.addEventListener("keydown", handleInteraction, { once: true });
    }

    return () => {
      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [prefs.soundEnabled]);

  const play = useCallback(
    (name: SoundName, options?: { volume?: number; loop?: boolean }) => {
      if (!prefs.soundEnabled) return;
      SoundManager.play(name, options);
    },
    [prefs.soundEnabled]
  );

  const playUrl = useCallback(
    (
      url: string,
      options?: { volume?: number; loop?: boolean }
    ): string => {
      if (!prefs.soundEnabled) return "";
      const soundId = SoundManager.playUrl(url, options);
      activeUrlRef.current = soundId;
      return soundId;
    },
    [prefs.soundEnabled]
  );

  const stop = useCallback((name: SoundName) => {
    SoundManager.stop(name);
  }, []);

  const stopUrl = useCallback((url: string) => {
    SoundManager.stopUrl(url);
    if (activeUrlRef.current === url) {
      activeUrlRef.current = "";
    }
  }, []);

  const stopAll = useCallback(() => {
    SoundManager.stopAll();
    activeUrlRef.current = "";
  }, []);

  return {
    play,
    playUrl,
    stop,
    stopUrl,
    stopAll,
    soundEnabled: prefs.soundEnabled,
  };
}

/**
 * Hook for playing a sound when a value changes (e.g., question changes)
 * Automatically stops previous sound and plays new one
 * 
 * @example
 * useSoundEffect(questionId, 'questionStart');
 * 
 * @example
 * useSoundEffect(question?.soundUrl, undefined, { loop: true });
 */
export function useSoundEffect(
  trigger: string | number | null | undefined,
  soundName?: SoundName,
  options?: { volume?: number; loop?: boolean }
): void {
  const { play, playUrl, stopAll } = useSound();
  const previousTriggerRef = useRef<string | number | null | undefined>(null);

  useEffect(() => {
    // Skip if trigger hasn't changed
    if (trigger === previousTriggerRef.current || !trigger) {
      return;
    }

    previousTriggerRef.current = trigger;

    // Stop all sounds first to prevent overlap
    stopAll();

    // Small delay to ensure previous sounds are stopped
    const timeoutId = setTimeout(() => {
      if (soundName) {
        play(soundName, options);
      }
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      stopAll();
    };
  }, [trigger, soundName, play, stopAll, options?.volume, options?.loop]);
}

/**
 * Hook for playing a URL sound when a value changes
 * 
 * @example
 * useSoundUrlEffect(question?.soundUrl, { loop: true, volume: 1 });
 */
export function useSoundUrlEffect(
  url: string | null | undefined,
  options?: { volume?: number; loop?: boolean }
): void {
  const { playUrl, stopAll } = useSound();
  const previousUrlRef = useRef<string | null | undefined>(null);

  useEffect(() => {
    // Skip if URL hasn't changed
    if (url === previousUrlRef.current) {
      return;
    }

    // Stop previous URL sound
    if (previousUrlRef.current) {
      stopAll();
    }

    previousUrlRef.current = url;

    if (!url) {
      return;
    }

    // Small delay to ensure previous sounds are stopped
    const timeoutId = setTimeout(() => {
      playUrl(url, options);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      if (url) {
        stopAll();
      }
    };
  }, [url, playUrl, stopAll, options?.volume, options?.loop]);
}

