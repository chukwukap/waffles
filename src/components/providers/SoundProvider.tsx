"use client";

/**
 * Sound Provider - Provides sound functionality via context
 */

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { soundManager, type SoundName } from "@/lib/sounds";

// ============================================
// TYPES
// ============================================

interface SoundContextValue {
  play: (name: SoundName) => void;
  isMuted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  playBgMusic: () => void;
  stopBgMusic: () => void;
  isBgPlaying: boolean;
}

// ============================================
// CONTEXT
// ============================================

const SoundContext = createContext<SoundContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMutedState] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [isBgPlaying, setIsBgPlaying] = useState(false);

  // Sync with soundManager on mount
  useEffect(() => {
    setIsMutedState(soundManager.isMuted);
    setVolumeState(soundManager.volume);
    soundManager.preload(["click", "chatSend", "answerSubmit"]);
  }, []);

  const play = useCallback((name: SoundName) => {
    soundManager.play(name);
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = soundManager.toggleMute();
    setIsMutedState(newMuted);
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    soundManager.isMuted = muted;
    setIsMutedState(muted);
  }, []);

  const setVolume = useCallback((vol: number) => {
    soundManager.volume = vol;
    setVolumeState(vol);
  }, []);

  const playBgMusic = useCallback(() => {
    soundManager.playBgMusic();
    setIsBgPlaying(true);
  }, []);

  const stopBgMusic = useCallback(() => {
    soundManager.stopBgMusic();
    setIsBgPlaying(false);
  }, []);

  return (
    <SoundContext.Provider
      value={{
        play,
        isMuted,
        toggleMute,
        setMuted,
        volume,
        setVolume,
        playBgMusic,
        stopBgMusic,
        isBgPlaying,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useSounds(): SoundContextValue {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSounds must be used within SoundProvider");
  }
  return context;
}
