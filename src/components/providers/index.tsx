"use client";

import { useEffect } from "react";
import { MinikitProvider } from "./MinikitProvider";
import GlobalToaster from "../ui/Toaster";
import { OnboardingGate } from "../onboarding/onboarding-gate";
import { AppStateProvider, useGame, useLobby } from "@/state";
import { useSyncUser } from "@/hooks/useSyncUser";
import { FlowGuard } from "./FlowGuard";

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const { loadActiveGame } = useGame();
  const { refreshStats } = useLobby();
  useSyncUser();

  useEffect(() => {
    loadActiveGame().catch((error) =>
      console.error("Failed to preload game", error)
    );
    refreshStats().catch((error) =>
      console.error("Failed to preload lobby stats", error)
    );
  }, [loadActiveGame, refreshStats]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MinikitProvider>
      <AppStateProvider>
        <OnboardingGate>
          <FlowGuard>
            <AppBootstrap>
              {children}
              <GlobalToaster />
            </AppBootstrap>
          </FlowGuard>
        </OnboardingGate>
      </AppStateProvider>
    </MinikitProvider>
  );
}
