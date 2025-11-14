// src/hooks/useSound.ts
// React hook for easy sound playback with automatic preference handling

import { useEffect, useCallback, useRef } from "react";
import { SoundManager } from "@/lib/sounds/SoundManager";
import { useLocalStorage } from "./useLocalStorage";
import type { SoundName } from "@/lib/sounds/config";

const SOUND_STORAGE_KEY = "waffles:soundEnabled";

/**
 * Hook for playing sounds with automatic preference handling
 *
 * @example
 * const { play, stop, toggleSound, soundEnabled } = useSound();
 * play('click');
 * toggleSound(); // Toggle sound on/off
 *
 * @example
 * const { playUrl } = useSound();
 * playUrl('/sounds/scenes/matrix.mp3', { loop: true });
 */
export function useSound() {
  const [soundEnabled, setSoundEnabled] = useLocalStorage<boolean>(
    SOUND_STORAGE_KEY,
    true
  );
  const activeUrlRef = useRef<string>("");

  // Update SoundManager when preferences change
  useEffect(() => {
    SoundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      SoundManager.init().catch(() => {
        // Silently fail - audio might not be available
      });
    };

    // Only add listeners if sound is enabled
    if (soundEnabled) {
      window.addEventListener("pointerdown", handleInteraction, { once: true });
      window.addEventListener("keydown", handleInteraction, { once: true });
    }

    return () => {
      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, [setSoundEnabled]);

  const play = useCallback(
    (name: SoundName, options?: { volume?: number; loop?: boolean }) => {
      if (!soundEnabled) return;
      SoundManager.play(name, options);
    },
    [soundEnabled]
  );

  const playUrl = useCallback(
    (url: string, options?: { volume?: number; loop?: boolean }): string => {
      if (!soundEnabled) return "";
      const soundId = SoundManager.playUrl(url, options);
      activeUrlRef.current = soundId;
      return soundId;
    },
    [soundEnabled]
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
    soundEnabled,
    toggleSound,
    setSoundEnabled,
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
  const { play, stopAll } = useSound();
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
  }, [trigger, soundName, play, stopAll, options]);
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
  const { playUrl, stopUrl } = useSound();
  const previousUrlRef = useRef<string | null | undefined>(null);

  useEffect(() => {
    // Skip if URL hasn't changed
    if (url === previousUrlRef.current) {
      return;
    }

    const previousUrl = previousUrlRef.current;
    previousUrlRef.current = url;

    // Stop previous URL sound specifically (not all sounds)
    if (previousUrl) {
      stopUrl(previousUrl);
    }

    if (!url) {
      return;
    }

    // Small delay to ensure previous sound is stopped
    const timeoutId = setTimeout(() => {
      playUrl(url, options);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      // Only stop this specific URL on cleanup
      if (url) {
        stopUrl(url);
      }
    };
  }, [url, playUrl, stopUrl, options]);
}
