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

type SoundManagerAPI = {
  init(): Promise<void>;
  play(name: SoundName, options?: PlayOptions): void;
  stop(name: SoundName): void;
  stopAll(): void;
};

const isBrowser =
  typeof window !== "undefined" && typeof window.Audio !== "undefined";

class BrowserSoundManager implements SoundManagerAPI {
  private static instance: BrowserSoundManager;
  private audioContext?: AudioContext;
  private sounds: Map<SoundName, HTMLAudioElement> = new Map();
  private looping: Map<SoundName, HTMLAudioElement> = new Map();

  private constructor() {
    if (!isBrowser) return;

    (Object.entries(SOUND_FILES) as [SoundName, string][]).forEach(
      ([name, url]) => {
        const base = new window.Audio(url);
        base.preload = "auto";
        base.load();
        this.sounds.set(name, base);
      }
    );
  }

  public static getInstance(): BrowserSoundManager {
    if (!BrowserSoundManager.instance) {
      BrowserSoundManager.instance = new BrowserSoundManager();
    }
    return BrowserSoundManager.instance;
  }

  public async init(): Promise<void> {
    if (this.audioContext || !isBrowser) return;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: AudioContext })
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
    if (!base) return;

    const { loop = false, volume } = options;
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

    instance.play().catch((error) => {
      console.debug(`Failed to play sound "${name}"`, error);
    });

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
    const loopingInstance = this.looping.get(name);
    if (!loopingInstance) return;
    loopingInstance.pause();
    loopingInstance.currentTime = 0;
    loopingInstance.loop = false;
    this.looping.delete(name);
  }

  public stopAll(): void {
    this.looping.forEach((instance) => {
      instance.pause();
      instance.currentTime = 0;
      instance.loop = false;
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
    const instance = new window.Audio(base.src);
    instance.preload = "auto";
    return instance;
  }
}

const SoundManager: SoundManagerAPI = isBrowser
  ? BrowserSoundManager.getInstance()
  : {
      async init() {
        return Promise.resolve();
      },
      play() {
        // noop on server
      },
      stop() {
        // noop on server
      },
      stopAll() {
        // noop on server
      },
    };

export default SoundManager;
