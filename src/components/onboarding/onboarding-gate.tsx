"use client";

import { useState, useCallback } from "react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingOverlay } from "./onboarding-overlay";
import type { ReactNode } from "react";

/**
 * Simple onboarding gate.
 * Shows overlay on top when needed, remounts children after completion.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const { needsOnboarding, completeOnboarding } = useOnboarding();
  const [remountKey, setRemountKey] = useState(0);

  const handleComplete = useCallback(async () => {
    await completeOnboarding();
    // Remount children so useUser refetches fresh data
    setRemountKey((k) => k + 1);
  }, [completeOnboarding]);

  return (
    <>
      <div key={remountKey} className="contents">
        {children}
      </div>
      {needsOnboarding && <OnboardingOverlay onComplete={handleComplete} />}
    </>
  );
}
