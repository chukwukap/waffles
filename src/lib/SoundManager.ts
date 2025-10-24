// src/lib/SoundManager.ts

const SOUND_FILES = {
  click: "/sounds/click_001.ogg",
  countdown: "/sounds/dice-shake-1.ogg",
  correct: "/sounds/dice-shake-1.ogg",
  wrong: "/sounds/dice-shake-1.ogg",
  nextQuestion: "/sounds/dice-shake-1.ogg",
  questionStart: "/sounds/dice-shake-1.ogg",
  gameOver: "/sounds/dice-shake-1.ogg",
} as const;

export type SoundName = keyof typeof SOUND_FILES;

type PlayOptions = {
  loop?: boolean;
  volume?: number;
};

class SoundManager {
  private static instance: SoundManager;
  private audioContext?: AudioContext;
  private sounds: Map<SoundName, HTMLAudioElement> = new Map();
  private looping: Map<SoundName, HTMLAudioElement> = new Map();

  private constructor() {
    (Object.entries(SOUND_FILES) as [SoundName, string][]).forEach(
      ([key, url]) => {
        const audio = new Audio(url);
        audio.preload = "auto";
        audio.load();
        this.sounds.set(key, audio);
      }
    );
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  /** Call once on first user gesture to unlock audio playback on browsers */
  public async init(): Promise<void> {
    if (this.audioContext) return;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;

    this.audioContext = new Ctor();
    try {
      await this.audioContext.resume();
    } catch (error) {
      console.warn("Failed to resume audio context", error);
    }
  }

  public play(name: SoundName, options: PlayOptions = {}): void {
    const base = this.sounds.get(name);
    if (!base) {
      console.warn(`Sound "${name}" not found.`);
      return;
    }

    const { loop = false, volume } = options;

    // Reuse a persistent instance for loops so we can stop them later.
    const instance = loop
      ? this.getLoopInstance(name, base)
      : this.createOneShot(base);

    instance.loop = loop;
    if (typeof volume === "number") {
      instance.volume = Math.min(1, Math.max(0, volume));
    }

    if (!loop) {
      instance.currentTime = 0;
    }

    instance
      .play()
      .catch((error) => console.warn(`Failed to play sound "${name}":`, error));

    if (!loop) {
      instance.addEventListener(
        "ended",
        () => {
          instance.remove();
        },
        { once: true }
      );
    }
  }

  public stop(name: SoundName): void {
    const loop = this.looping.get(name);
    if (!loop) return;
    loop.pause();
    loop.currentTime = 0;
    loop.loop = false;
    this.looping.delete(name);
  }

  public stopAll(): void {
    this.looping.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
      audio.loop = false;
    });
    this.looping.clear();
  }

  private getLoopInstance(
    name: SoundName,
    base: HTMLAudioElement
  ): HTMLAudioElement {
    const existing = this.looping.get(name);
    if (existing) {
      existing.currentTime = 0;
      return existing;
    }
    const instance = this.createOneShot(base);
    instance.currentTime = 0;
    this.looping.set(name, instance);
    return instance;
  }

  private createOneShot(base: HTMLAudioElement): HTMLAudioElement {
    const instance = new Audio(base.src);
    instance.preload = "auto";
    return instance;
  }
}

const manager = SoundManager.getInstance();
export default manager;
