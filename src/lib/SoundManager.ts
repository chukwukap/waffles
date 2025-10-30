// src/lib/SoundManager.ts
// A unified, browser-only sound manager singleton.
// Handles both predefined static sounds and dynamic URLs.

// Define available sound names and their corresponding file paths
const PREDEFINED_SOUNDS = {
  click: "/sounds/click_001.ogg",
  countdown: "/sounds/dice-shake-1.ogg",
  correct: "/sounds/dice-shake-1.ogg",
  wrong: "/sounds/dice-shake-1.ogg",
  nextQuestion: "/sounds/dice-shake-1.ogg",
  questionStart: "/sounds/dice-shake-1.ogg",
  gameOver: "/sounds/dice-shake-1.ogg",
  roundBreak: "/sounds/dice-shake-1.ogg", // Added this
} as const;

// Type representing the valid *predefined* sound names
type PredefinedSoundName = keyof typeof PREDEFINED_SOUNDS;

// Options for playing a sound
type PlayOptions = {
  loop?: boolean; // Should the sound loop?
  volume?: number; // Volume level (0.0 to 1.0)
};

// Interface defining the public API
type SoundManagerAPI = {
  init(): Promise<void>;
  /**
   * Plays a sound.
   * @param nameOrUrl Can be a predefined sound name (e.g., 'click') or a full URL.
   * @param options Playback options like loop and volume.
   */
  play(nameOrUrl: string, options?: PlayOptions): void;
  /**
   * Stops a sound.
   * @param nameOrUrl The predefined name or full URL of the sound to stop.
   */
  stop(nameOrUrl: string): void;
  stopAll(): void;
};

const isBrowser =
  typeof window !== "undefined" && typeof window.Audio !== "undefined";

/**
 * Manages all audio playback.
 * Implemented as a Singleton.
 */
class UnifiedSoundManager implements SoundManagerAPI {
  private static instance: UnifiedSoundManager;
  private audioContext?: AudioContext;

  /**
   * Stores all active audio elements, keyed by their nameOrUrl.
   * This is crucial for stopping them, especially loops.
   */
  private activeSounds: Map<string, HTMLAudioElement> = new Map();

  private constructor() {
    // Pre-load predefined sounds for faster playback
    if (!isBrowser) return;

    (
      Object.entries(PREDEFINED_SOUNDS) as [PredefinedSoundName, string][]
    ).forEach(([name, url]) => {
      try {
        const base = new window.Audio(url);
        base.preload = "auto";
        base.load();
        // We store the *preloaded* element itself.
        // We will *clone* this for one-shot sounds.
        this.activeSounds.set(name, base);
      } catch (error) {
        console.error(`Failed to create Audio for "${name}" at ${url}:`, error);
      }
    });
  }

  public static getInstance(): UnifiedSoundManager {
    if (!UnifiedSoundManager.instance) {
      UnifiedSoundManager.instance = new UnifiedSoundManager();
    }
    return UnifiedSoundManager.instance;
  }

  public async init(): Promise<void> {
    if (this.audioContext || !isBrowser) return;

    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) {
      console.warn("AudioContext is not supported.");
      return;
    }

    try {
      this.audioContext = new AudioContextCtor();
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.warn("Failed to initialize AudioContext:", error);
      this.audioContext = undefined;
    }
  }

  public play(nameOrUrl: string, options: PlayOptions = {}): void {
    if (!isBrowser) return;

    const { loop = false, volume = 0.6 } = options;
    const clampedVolume = Math.min(1, Math.max(0, volume));

    // Check if it's a predefined sound
    const isPredefined = nameOrUrl in PREDEFINED_SOUNDS;
    let audio: HTMLAudioElement;

    // --- Get or Create Audio Element ---
    if (this.activeSounds.has(nameOrUrl) && (loop || isPredefined)) {
      // 1. Reuse existing element (for loops or predefined sounds)
      audio = this.activeSounds.get(nameOrUrl)!;
    } else {
      // 2. Create new element (for one-shot URLs or if not found)
      try {
        const src = isPredefined
          ? PREDEFINED_SOUNDS[nameOrUrl as PredefinedSoundName]
          : nameOrUrl;
        audio = new window.Audio(src);
        audio.preload = "auto";
      } catch (error) {
        console.error(
          `[SoundManager] Error loading sound from ${nameOrUrl}:`,
          error
        );
        return;
      }
    }

    // --- Configure and Play ---
    audio.loop = loop;
    audio.volume = clampedVolume;
    audio.currentTime = 0; // Always play from the start

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        if (error.name === "NotAllowedError") {
          console.debug(`[SoundManager] Playback requires user interaction.`);
        } else {
          console.error(`[SoundManager] Error playing ${nameOrUrl}:`, error);
        }
        // If it failed, remove it from active sounds if it's not predefined
        if (!isPredefined) {
          this.activeSounds.delete(nameOrUrl);
        }
      });
    }

    // --- Manage Active Sounds Map ---
    if (loop) {
      // If looping, *always* store it so we can stop it
      this.activeSounds.set(nameOrUrl, audio);
    } else if (!isPredefined) {
      // If one-shot URL, store it and remove on 'ended'
      this.activeSounds.set(nameOrUrl, audio);
      audio.addEventListener(
        "ended",
        () => {
          this.activeSounds.delete(nameOrUrl);
        },
        { once: true }
      );
    }
    // (If one-shot predefined, we just play it but don't re-store it)
  }

  public stop(nameOrUrl: string): void {
    if (!isBrowser) return;

    const audio = this.activeSounds.get(nameOrUrl);
    if (!audio) return;

    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (error) {
      console.error(`[SoundManager] Error stopping ${nameOrUrl}:`, error);
    }

    // If it wasn't a predefined sound, remove it from the map
    if (!(nameOrUrl in PREDEFINED_SOUNDS)) {
      this.activeSounds.delete(nameOrUrl);
    }
  }

  public stopAll(): void {
    if (!isBrowser) return;

    this.activeSounds.forEach((audio, key) => {
      try {
        audio.pause();
        audio.currentTime = 0;
        // Don't remove predefined sounds, just stop them
        if (!(key in PREDEFINED_SOUNDS)) {
          this.activeSounds.delete(key);
        }
      } catch (error) {
        console.warn(`[SoundManager] Error stopping sound "${key}":`, error);
      }
    });
  }
}

// --- Export Singleton Instance ---
const SoundManager: SoundManagerAPI = isBrowser
  ? UnifiedSoundManager.getInstance()
  : {
      async init() {},
      play() {},
      stop() {},
      stopAll() {},
    };

export default SoundManager;
