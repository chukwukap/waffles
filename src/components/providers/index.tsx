"use client";

import { MinikitProvider } from "./MinikitProvider";
import { SoundProvider } from "./SoundProvider";
import GlobalToaster from "../ui/Toaster";
import { AuthGate } from "../onboarding/auth-gate";

/**
 * Root Providers - Wraps entire app with necessary providers.
 * 
 * Provider order matters:
 * 1. MinikitProvider (Farcaster context)
 * 2. AuthGate (Auth check)
 * 3. SoundProvider (Audio)
 * 
 * Note: GameProvider is now at the game layout level, not root.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MinikitProvider>
      <AuthGate>
        <SoundProvider>
          {children}
          <GlobalToaster />
        </SoundProvider>
      </AuthGate>
    </MinikitProvider>
  );
}
