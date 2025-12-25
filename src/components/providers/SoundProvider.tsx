"use client";

/**
 * Sound Provider & Mute Toggle
 *
 * Provides sound context and a floating mute toggle button.
 * Preloads common sounds on mount.
 */

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useSounds, type UseSoundsReturn } from "@/hooks/useSounds";
import { soundManager } from "@/lib/sounds";

// ============================================
// CONTEXT
// ============================================

const SoundContext = createContext<UseSoundsReturn | null>(null);

/**
 * Hook to access sound context
 * Must be used within SoundProvider
 */
export function useSoundContext(): UseSoundsReturn {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSoundContext must be used within SoundProvider");
  }
  return context;
}

// ============================================
// MUTE TOGGLE BUTTON
// ============================================

function MuteToggle() {
  const { isMuted, toggleMute } = useSounds();

  return (
    <button
      onClick={toggleMute}
      className="fixed bottom-0 right-0 z-40 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition-all active:scale-95"
      aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
    >
      {isMuted ? (
        // Muted icon
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white/60"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        // Unmuted icon
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
}

// ============================================
// PROVIDER
// ============================================

interface SoundProviderProps {
  children: ReactNode;
  /** Show floating mute toggle button */
  showMuteToggle?: boolean;
}

/**
 * Sound Provider Component
 *
 * Wrap your app with this to enable sound functionality.
 * Preloads common sounds for instant playback.
 *
 * @example
 * ```tsx
 * <SoundProvider showMuteToggle>
 *   <App />
 * </SoundProvider>
 * ```
 */
export function SoundProvider({
  children,
  showMuteToggle = true,
}: SoundProviderProps) {
  const sounds = useSounds();

  // Preload common sounds on mount
  useEffect(() => {
    soundManager.preload(["click", "chatSend", "answerSubmit"]);
  }, []);

  return (
    <SoundContext.Provider value={sounds}>
      {children}
      {/* {showMuteToggle && <MuteToggle />} */}
    </SoundContext.Provider>
  );
}

export default SoundProvider;
