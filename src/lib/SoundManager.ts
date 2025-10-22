// src/utils/SoundManager.ts
class SoundManager {
  private static instance: SoundManager;
  private audioContext?: AudioContext;
  private sounds: Map<string, HTMLAudioElement> = new Map();

  private constructor() {
    // Preload sound files
    const soundFiles: Record<string, string> = {
      click: "/sounds/click.mp3",
      countdown: "/sounds/countdown.mp3",
      correct: "/sounds/correct.mp3",
      wrong: "/sounds/wrong.mp3",
      gameOver: "/sounds/gameOver.mp3",
      // Add more sounds as needed
    };
    for (const [key, url] of Object.entries(soundFiles)) {
      const audio = new Audio(url);
      audio.load();
      this.sounds.set(key, audio);
    }
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  /** Call this on first user interaction (click/tap) to enable audio on browsers */
  public async init(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: AudioContext })
          .webkitAudioContext)();
      // Resume context (needed for mobile autoplay policy)
      await this.audioContext.resume();
    }
  }

  /** Play a loaded sound effect by name */
  public play(soundName: string): void {
    const audio = this.sounds.get(soundName);
    if (!audio) {
      console.warn(`Sound "${soundName}" not found`);
      return;
    }
    try {
      audio.currentTime = 0;
      audio.play();
    } catch (error) {
      // Playback might fail if not initiated by user gesture yet; safe to ignore or log
      console.warn(`Failed to play sound "${soundName}":`, error);
    }
  }
}

export default SoundManager.getInstance();
