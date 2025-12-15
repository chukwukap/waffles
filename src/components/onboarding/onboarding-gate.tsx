"use client";

import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingOverlay } from "./onboarding-overlay";
import type { ReactNode } from "react";

interface OnboardingGateProps {
  children: ReactNode;
}

/**
 * Client-side gate for the onboarding process.
 * Blocks the main app until onboarding is complete to prevent
 * API calls before the user exists in the database.
 * 
 * Note: No custom splash screen - Farcaster already handles that.
 */
export function OnboardingGate({ children }: OnboardingGateProps) {
  const { isReady, shouldShowOnboarding, completeOnboarding } = useOnboarding();

  // Still checking status - render nothing (Farcaster splash is visible)
  if (!isReady) {
    return null;
  }

  // Show onboarding if needed
  if (shouldShowOnboarding) {
    return <OnboardingOverlay onComplete={completeOnboarding} />;
  }

  // Ready - render the app
  return <>{children}</>;
}
