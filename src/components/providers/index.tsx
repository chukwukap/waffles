"use client";

import { MinikitProvider } from "./MinikitProvider";
import { SoundProvider } from "./SoundProvider";
import { GameStoreProvider } from "./GameStoreProvider";
import GlobalToaster from "../ui/Toaster";
import { AuthGate } from "../onboarding/auth-gate";

/**
 * Root Providers - Wraps entire app with necessary providers.
 * 
 * Provider order matters:
 * 1. MinikitProvider (Farcaster context)
 * 2. AuthGate (Auth check)
 * 3. GameStoreProvider (Zustand store - SSR-safe per-request)
 * 4. SoundProvider (Audio)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MinikitProvider>
      <AuthGate>
        <GameStoreProvider>
          <SoundProvider>
            {children}
            <GlobalToaster />
          </SoundProvider>
        </GameStoreProvider>
      </AuthGate>
    </MinikitProvider>
  );
}
