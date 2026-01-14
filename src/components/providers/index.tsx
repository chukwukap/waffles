"use client";

import { OnchainKitProvider } from "./OnchainKitProvider";
import { SoundProvider } from "./SoundProvider";
import GlobalToaster from "../ui/Toaster";
import { AppInitializer } from "./AppInitializer";
import { SplashProvider } from "./SplashProvider";

/**
 * Root Providers - Wraps entire app with necessary providers.
 *
 * Provider order matters:
 * 1. OnchainKitProvider (OnchainKit context)
 * 2. AppInitializer (handles onboarding for new users)
 * 3. SoundProvider (Audio)
 *
 * Note: RealtimeProvider is at the game layout level, not root.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <OnchainKitProvider>
      <AppInitializer>
        <SoundProvider>
          <SplashProvider>
            {children}
            <GlobalToaster />
          </SplashProvider>
        </SoundProvider>
      </AppInitializer>
    </OnchainKitProvider>
  );
}
