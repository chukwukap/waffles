// src/lib/sounds/SoundManager.ts
// Simple, efficient sound manager with automatic preference handling

import { SOUNDS, type SoundName } from "./config";

const isBrowser = typeof window !== "undefined" && typeof window.Audio !== "undefined";

interface SoundInstance {
  audio: HTMLAudioElement;
  isLoop: boolean;
}

class SoundManagerClass {
  private sounds: Map<string, SoundInstance> = new Map();
  private soundEnabled: boolean = true;
  private audioContext?: AudioContext;

  /**
   * Initialize audio context (call on user interaction)
   */
  async init(): Promise<void> {
    if (!isBrowser || this.audioContext) return;

    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) {
      console.warn("[SoundManager] AudioContext not supported");
      return;
    }

    try {
      this.audioContext = new AudioContextCtor();
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.warn("[SoundManager] Failed to initialize AudioContext:", error);
    }
  }

  /**
   * Set whether sounds should play (respects user preferences)
   */
  setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  /**
   * Play a sound by name
   */
  play(name: SoundName, options?: { volume?: number; loop?: boolean }): void {
    if (!isBrowser || !this.soundEnabled) return;

    const soundConfig = SOUNDS[name];
    if (!soundConfig) {
      console.warn(`[SoundManager] Sound "${name}" not found`);
      return;
    }

    const isLoop = soundConfig.loop || options?.loop || false;

    // Stop existing instance if it's a loop
    if (isLoop) {
      this.stop(name);
    }

    // For one-shot sounds, create a new audio element each time
    // For loops, reuse existing element if available
    let instance = this.sounds.get(name);
    if (!instance || !isLoop) {
      const audio = new Audio(soundConfig.path);
      audio.preload = "auto";
      instance = {
        audio,
        isLoop,
      };
      if (isLoop) {
        this.sounds.set(name, instance);
      }
    }

    // Configure audio
    const volume = options?.volume ?? soundConfig.volume;
    instance.audio.volume = Math.max(0, Math.min(1, volume));
    instance.audio.loop = isLoop;
    instance.audio.currentTime = 0;

    // Play
    const playPromise = instance.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        if (error.name !== "NotAllowedError") {
          console.warn(`[SoundManager] Failed to play "${name}":`, error);
        }
      });
    }

    // Clean up one-shot sounds when they end
    if (!isLoop) {
      instance.audio.addEventListener(
        "ended",
        () => {
          // Cleanup handled automatically
        },
        { once: true }
      );
    }
  }

  /**
   * Play a sound from URL (for dynamic sounds like question audio)
   */
  playUrl(
    url: string,
    options?: { volume?: number; loop?: boolean }
  ): string {
    if (!isBrowser || !this.soundEnabled) return "";

    // Stop any existing URL sound with same URL
    this.stopUrl(url);

    const audio = new Audio(url);
    audio.preload = "auto";
    audio.volume = Math.max(0, Math.min(1, options?.volume ?? 1));
    audio.loop = options?.loop ?? false;

    const instance: SoundInstance = {
      audio,
      isLoop: options?.loop ?? false,
    };

    this.sounds.set(url, instance);

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        // AbortError is expected when stopping sounds - ignore it
        // NotAllowedError means user interaction required - also ignore
        if (error.name !== "NotAllowedError" && error.name !== "AbortError") {
          console.warn(`[SoundManager] Failed to play URL:`, error);
        }
        // Only delete if it's still the same instance (wasn't replaced)
        if (this.sounds.get(url) === instance) {
          this.sounds.delete(url);
        }
      });
    }

    // Clean up one-shot sounds when they end
    if (!instance.isLoop) {
      audio.addEventListener(
        "ended",
        () => {
          // Only delete if it's still the same instance
          if (this.sounds.get(url) === instance) {
            this.sounds.delete(url);
          }
        },
        { once: true }
      );
    }

    return url;
  }

  /**
   * Stop a sound by name
   */
  stop(name: SoundName): void {
    if (!isBrowser) return;

    const instance = this.sounds.get(name);
    if (instance) {
      try {
        instance.audio.pause();
        instance.audio.currentTime = 0;
      } catch (error) {
        console.warn(`[SoundManager] Error stopping "${name}":`, error);
      }
    }
  }

  /**
   * Stop a sound by URL
   */
  stopUrl(url: string): void {
    if (!isBrowser) return;

    const instance = this.sounds.get(url);
    if (instance) {
      try {
        // Pause and reset - AbortError from play() promise is expected
        instance.audio.pause().catch(() => {
          // Ignore pause errors (e.g., if already paused)
        });
        instance.audio.currentTime = 0;
        this.sounds.delete(url);
      } catch (error) {
        console.warn(`[SoundManager] Error stopping URL:`, error);
      }
    }
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    if (!isBrowser) return;

    this.sounds.forEach((instance, key) => {
      try {
        // Pause and reset - AbortError from play() promise is expected
        instance.audio.pause().catch(() => {
          // Ignore pause errors (e.g., if already paused)
        });
        instance.audio.currentTime = 0;
        // Only delete URL sounds, keep predefined sounds for reuse
        if (!(key in SOUNDS)) {
          this.sounds.delete(key);
        }
      } catch (error) {
        console.warn(`[SoundManager] Error stopping sound:`, error);
      }
    });
  }
}

// Export singleton instance
export const SoundManager = new SoundManagerClass();

