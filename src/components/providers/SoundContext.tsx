import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { SOUNDS, SoundName } from "@/lib/constants";

// --- 1. Create the Sound Context ---
type SoundContextType = {
  isSoundEnabled: boolean;
  toggleSound: () => void;
  playSound: (soundOrUrl: SoundName | string) => void;
};

const SoundContext = createContext<SoundContextType | null>(null);

// --- 2. TypeScript Type Guard (The only enhancement) ---
// This helper tells TypeScript: "if this function returns true,
// then the 'sound' string is definitely a 'SoundName' type."
const isSoundName = (sound: string): sound is SoundName => {
  return sound in SOUNDS;
};

// --- 3. Create the Sound Provider ---
export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getAudio = (): HTMLAudioElement => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    return audioRef.current;
  };

  const playSound = useCallback(
    (soundOrUrl: keyof typeof SOUNDS | string) => {
      if (!isSoundEnabled) return;

      let path: string, volume: number, loop: boolean;

      // Use the type guard for cleaner, type-safe logic
      if (isSoundName(soundOrUrl)) {
        // --- Handle as SoundName ---
        // TypeScript now knows soundOrUrl is of type SoundName
        const soundKey = soundOrUrl as SoundName;
        const s = SOUNDS[soundKey];
        path = s.path;
        volume = s.volume ?? 0.5; // Good use of nullish coalescing
        loop = !!s.loop; // Good use of truthy check
      } else if (
        // --- Handle as Legacy URL ---
        // No need for 'typeof' check, as it's implied
        soundOrUrl.startsWith("/") ||
        soundOrUrl.startsWith("http")
      ) {
        path = soundOrUrl;
        volume = 0.5;
        loop = false;
      } else {
        // --- Handle invalid sound ---
        console.warn(
          `Sound "${soundOrUrl}" is not found in SOUNDS and is not a valid URL.`
        );
        return;
      }

      const audio = getAudio();

      // --- FIX ---
      // We don't need to call audio.pause(). Setting .src will
      // automatically stop the current sound.
      // The AbortError comes from the *previous* play() promise
      // being rejected, which we will now catch and ignore.

      // Create a full URL from the path for comparison
      // This handles both full URLs and relative paths
      let fullPath: string;
      try {
        fullPath = new URL(path, window.location.origin).href;
      } catch (e) {
        console.error("Invalid sound path:", e, path);
        return;
      }

      // If it's the *same* sound, just reset its time
      if (audio.src === fullPath) {
        audio.currentTime = 0;
      } else {
        // If it's a *new* sound, set the src
        audio.src = fullPath;
      }

      audio.volume = volume;
      audio.loop = loop;

      // play() returns a promise
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // This is the key: We *expect* AbortErrors
          // if a new sound is played before this one finishes.
          // We can safely ignore them and only log *real* errors.
          if (error.name === "AbortError") {
            // This is normal.
            // console.log("Sound play request interrupted. This is normal.");
          } else {
            // This is a real error.
            console.error("Error playing sound:", error);
          }
        });
      }
    },
    [isSoundEnabled]
  );

  const toggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => {
      const isNowEnabled = !prev;
      if (!isNowEnabled) {
        // Your logic to stop sound on mute is correct
        const audio = getAudio();
        audio.pause();
        audio.currentTime = 0;
      }
      return isNowEnabled;
    });
  }, []); // Empty dep array is correct

  // Using useMemo for the context value is a key performance optimization.
  const value = useMemo(
    () => ({
      isSoundEnabled,
      toggleSound,
      playSound,
    }),
    [isSoundEnabled, toggleSound, playSound]
  );

  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
}

// --- 4. Custom Hook ---
export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    // This runtime check is a best practice.
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
};
