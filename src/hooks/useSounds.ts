/**
 * Sound System Hook
 *
 * Provides reactive sound control for React components.
 * Wraps the soundManager singleton with React state for UI updates.
 */

import { useCallback, useState, useEffect } from "react";
import { soundManager, type SoundName } from "@/lib/sounds";

// ============================================
// HOOK
// ============================================

export interface UseSoundsReturn {
  /** Play a sound effect by name */
  play: (name: SoundName) => void;
  /** Whether sounds are muted */
  isMuted: boolean;
  /** Toggle mute state */
  toggleMute: () => void;
  /** Set mute state directly */
  setMuted: (muted: boolean) => void;
  /** Current volume (0-1) */
  volume: number;
  /** Set volume (0-1) */
  setVolume: (volume: number) => void;
  /** Play looping background music */
  playBgMusic: () => void;
  /** Stop background music */
  stopBgMusic: () => void;
  /** Whether background music is playing */
  isBgPlaying: boolean;
}

/**
 * Hook for playing sounds and managing sound preferences
 *
 * @example
 * ```tsx
 * const { play, isMuted, toggleMute } = useSounds();
 *
 * // Play a sound
 * play('click');
 *
 * // Toggle mute in UI
 * <button onClick={toggleMute}>
 *   {isMuted ? '🔇' : '🔊'}
 * </button>
 * ```
 */
export function useSounds(): UseSoundsReturn {
  // Local state for reactivity (synced with soundManager)
  const [isMuted, setIsMutedState] = useState(false);
  const [volume, setVolumeState] = useState(0.7);

  // Sync with soundManager on mount
  useEffect(() => {
    setIsMutedState(soundManager.isMuted);
    setVolumeState(soundManager.volume);
  }, []);

  // Play sound
  const play = useCallback((name: SoundName) => {
    soundManager.play(name);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMuted = soundManager.toggleMute();
    setIsMutedState(newMuted);
  }, []);

  // Set muted
  const setMuted = useCallback((muted: boolean) => {
    soundManager.isMuted = muted;
    setIsMutedState(muted);
  }, []);

  // Set volume
  const setVolume = useCallback((vol: number) => {
    soundManager.volume = vol;
    setVolumeState(vol);
  }, []);

  // Background music controls
  const [isBgPlaying, setIsBgPlaying] = useState(false);

  const playBgMusic = useCallback(() => {
    soundManager.playBgMusic();
    setIsBgPlaying(true);
  }, []);

  const stopBgMusic = useCallback(() => {
    soundManager.stopBgMusic();
    setIsBgPlaying(false);
  }, []);

  return {
    play,
    isMuted,
    toggleMute,
    setMuted,
    volume,
    setVolume,
    playBgMusic,
    stopBgMusic,
    isBgPlaying,
  };
}

// ============================================
// CONVENIENCE HOOK FOR SINGLE SOUND
// ============================================

/**
 * Hook that returns a function to play a specific sound
 *
 * @example
 * ```tsx
 * const playClick = useSoundEffect('click');
 * <button onClick={playClick}>Click me</button>
 * ```
 */
export function useSoundEffect(name: SoundName): () => void {
  return useCallback(() => {
    soundManager.play(name);
  }, [name]);
}

export default useSounds;
