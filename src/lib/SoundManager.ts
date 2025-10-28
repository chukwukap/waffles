// src/lib/SoundManager.ts

// Define available sound names and their corresponding file paths
const SOUND_FILES = {
  click: "/sounds/click_001.ogg", // Example UI click sound
  countdown: "/sounds/dice-shake-1.ogg", // Sound for countdown timers
  correct: "/sounds/dice-shake-1.ogg", // Sound for correct answer (placeholder)
  wrong: "/sounds/dice-shake-1.ogg", // Sound for incorrect answer (placeholder)
  nextQuestion: "/sounds/dice-shake-1.ogg", // Sound for transitioning to next question (placeholder)
  questionStart: "/sounds/dice-shake-1.ogg", // Sound when a new question appears (placeholder)
  gameOver: "/sounds/dice-shake-1.ogg", // Sound for game over screen (placeholder)
} as const; // Use 'as const' for stricter typing of keys

// Type representing the valid sound names based on the SOUND_FILES keys
export type SoundName = keyof typeof SOUND_FILES; //

// Options for playing a sound
type PlayOptions = {
  loop?: boolean; // Should the sound loop?
  volume?: number; // Volume level (0.0 to 1.0)
};

// Interface defining the public API of the SoundManager
type SoundManagerAPI = {
  /** Initializes the audio context (required for playback in some browsers after user interaction). */
  init(): Promise<void>; //
  /** Plays the specified sound. */
  play(name: SoundName, options?: PlayOptions): void; //
  /** Stops a specific looping sound. */
  stop(name: SoundName): void; //
  /** Stops all currently looping sounds. */
  stopAll(): void; //
};

// Check if running in a browser environment with Audio API support
const isBrowser = //
  typeof window !== "undefined" && typeof window.Audio !== "undefined"; //

/**
 * Manages audio playback using the HTMLAudioElement API.
 * Implemented as a Singleton to ensure single instance and context management.
 */
class BrowserSoundManager implements SoundManagerAPI {
  // Singleton instance holder
  private static instance: BrowserSoundManager; //
  // Optional AudioContext for unlocking playback
  private audioContext?: AudioContext; //
  // Map to store base Audio elements (primarily for src lookup)
  private sounds: Map<SoundName, HTMLAudioElement> = new Map(); //
  // Map to store currently active looping Audio elements
  private looping: Map<SoundName, HTMLAudioElement> = new Map(); //

  // Private constructor for Singleton pattern
  private constructor() {
    //
    if (!isBrowser) return; // Do nothing if not in a browser

    // Pre-create Audio elements for each sound file (improves initial play latency slightly)
    (Object.entries(SOUND_FILES) as [SoundName, string][]).forEach(
      //
      ([name, url]) => {
        //
        try {
          const base = new window.Audio(url); // Create Audio element
          base.preload = "auto"; // Hint browser to preload metadata/data
          // Attempt to load metadata - useful for duration but might fail initially
          base.load();
          this.sounds.set(name, base); // Store the base element
        } catch (error) {
          console.error(
            `Failed to create Audio element for sound "${name}" at ${url}:`,
            error
          );
        }
      }
    );
  }

  /** Gets the singleton instance of the SoundManager. */
  public static getInstance(): BrowserSoundManager {
    //
    if (!BrowserSoundManager.instance) {
      //
      BrowserSoundManager.instance = new BrowserSoundManager(); // Create instance if needed
    } //
    return BrowserSoundManager.instance; //
  }

  /** Initializes (or resumes) the AudioContext. Should be called after user interaction. */
  public async init(): Promise<void> {
    //
    // Don't initialize if already done or not in browser
    if (this.audioContext || !isBrowser) return; //

    // Get the appropriate AudioContext constructor
    const AudioContextCtor = //
      window.AudioContext || // Standard
      (window as unknown as { webkitAudioContext: AudioContext })
        .webkitAudioContext; // Safari/legacy webkit prefix
    if (!AudioContextCtor) {
      // Check if AudioContext is supported
      console.warn("AudioContext is not supported in this browser.");
      return;
    }

    try {
      this.audioContext = new AudioContextCtor(); // Create the context
      // Attempt to resume the context (required after user interaction)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume(); //
        // console.log("AudioContext resumed successfully.");
      }
    } catch (error) {
      // Catch errors during context creation/resumption
      console.warn("Failed to initialize or resume AudioContext:", error); //
      this.audioContext = undefined; // Reset context on failure
    }
  }

  /** Plays a sound by name, with optional looping and volume control. */
  public play(name: SoundName, options: PlayOptions = {}): void {
    //
    // Get the base Audio element (used primarily for src)
    const base = this.sounds.get(name); //
    if (!base) {
      // Check if sound exists
      console.warn(`Sound "${name}" not found or failed to load.`);
      return; //
    }

    const { loop = false, volume = 0.6 } = options; // Default volume to 0.6

    // Get or create the actual Audio instance to play
    const instance = loop
      ? this.getOrCreateLoopInstance(name, base.src) // Use/create specific instance for looping
      : this.createOneShotInstance(base.src); // Create new instance for one-shot

    instance.loop = loop; // Set loop property
    // Set volume, clamped between 0 and 1
    instance.volume = Math.min(1, Math.max(0, volume)); //

    // Reset playback position for non-looping sounds or initially starting loops
    if (!loop || (loop && instance.paused)) {
      //
      instance.currentTime = 0; //
    }

    // Attempt to play the sound
    const playPromise = instance.play(); // Returns a promise
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        // Catch playback errors (e.g., user hasn't interacted)
        // Log specific errors for debugging, avoid flooding console for common interaction errors
        if (error.name === "NotAllowedError") {
          console.debug(
            `Playback prevented for "${name}": User interaction likely required.`
          );
        } else {
          console.error(`Failed to play sound "${name}":`, error); //
        }
        // If it was a one-shot instance that failed, clean it up
        if (!loop) {
          instance.remove(); // Assuming createOneShotInstance doesn't attach to DOM
        }
      });
    }

    // For one-shot sounds, clean up the instance after playback finishes
    if (!loop) {
      //
      instance.addEventListener(
        //
        "ended", //
        () => {
          //
          // Optional: Explicitly remove if needed, though garbage collection should handle it
          // instance.remove();
        }, //
        { once: true } // Ensure listener is removed after firing once
      );
    }
  }

  /** Stops a specific looping sound and resets its position. */
  public stop(name: SoundName): void {
    //
    const loopingInstance = this.looping.get(name); // Get the active looping instance
    if (!loopingInstance) return; // Exit if not currently looping

    loopingInstance.pause(); // Pause playback
    loopingInstance.currentTime = 0; // Reset position to start
    // Note: We keep the instance in the `looping` map but paused,
    // so `play` can potentially reuse it without creating a new one.
    // If true cleanup is needed:
    // loopingInstance.remove(); // If attached to DOM (unlikely here)
    // this.looping.delete(name);
  }

  /** Stops all currently active looping sounds. */
  public stopAll(): void {
    //
    this.looping.forEach((instance, name) => {
      // Iterate through looping sounds
      try {
        instance.pause(); // Pause
        instance.currentTime = 0; // Reset
      } catch (error) {
        console.warn(`Error stopping looping sound "${name}":`, error);
      }
    });
    // Keep instances in the map but paused. To fully clear:
    // this.looping.clear();
  }

  // --- Private Helper Methods ---

  /** Gets an existing looping instance or creates a new one. */
  private getOrCreateLoopInstance(
    name: SoundName,
    src: string
  ): HTMLAudioElement {
    //
    const existing = this.looping.get(name); // Check if already looping
    if (existing) {
      //
      // Optionally reset time if needed, depends on desired behavior when play is called again
      // existing.currentTime = 0;
      return existing; // Return existing instance
    }
    // Create, store, and return a new instance for looping
    const instance = this.createAndConfigureInstance(src); //
    instance.loop = true; // Ensure loop is set
    this.looping.set(name, instance); // Store it
    return instance; //
  }

  /** Creates a new Audio instance for one-shot playback. */
  private createOneShotInstance(src: string): HTMLAudioElement {
    //
    return this.createAndConfigureInstance(src); // Just create a new configured instance
  }

  /** Creates a new Audio instance and sets basic configuration. */
  private createAndConfigureInstance(src: string): HTMLAudioElement {
    const instance = new window.Audio(src);
    instance.preload = "auto"; // Hint preload
    // instance.load(); // Might not be needed if src is set in constructor
    return instance;
  }
}

// --- Export Singleton Instance or No-op Object ---
// Export the singleton instance for browser environments,
// or a no-op object for server-side environments.
const SoundManager: SoundManagerAPI = isBrowser //
  ? BrowserSoundManager.getInstance() // Use Singleton in browser
  : {
      // No-op implementations for server-side
      async init() {
        /* noop */
      }, //
      play() {
        /* noop */
      }, //
      stop() {
        /* noop */
      }, //
      stopAll() {
        /* noop */
      }, //
    }; //

export default SoundManager; // Export the instance/object
