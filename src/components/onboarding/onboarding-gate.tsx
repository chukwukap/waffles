"use client";

import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingOverlay } from "./onboarding-overlay";
import { SplashScreen } from "@/components/ui/SplashScreen";
import type { ReactNode } from "react";

interface OnboardingGateProps {
  children: ReactNode;
}

/**
 * A client-side component that acts as a gate for the onboarding process.
 * It uses the `useOnboarding` hook to determine if the onboarding overlay
 * should be displayed based on localStorage status. It renders a loading state
 * until the status is checked, then either shows the overlay or the main app content.
 */
export function OnboardingGate({ children }: OnboardingGateProps) {
  const { isReady, shouldShowOnboarding, completeOnboarding } = useOnboarding();

  if (!isReady) {
    return null;
    return <SplashScreen />;
  }

  return (
    <>
      {children}
      {shouldShowOnboarding && (
        <OnboardingOverlay onComplete={completeOnboarding} />
      )}
    </>
  );
}
