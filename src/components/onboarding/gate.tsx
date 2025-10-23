"use client";

import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingOverlay } from "./onboardingOverlay";

interface Props {
  children: React.ReactNode;
}

/**
 * Wraps the app to present the onboarding overlay to first-time users.
 * Blocks interaction until onboarding is completed to ensure key concepts are seen.
 */
export function OnboardingGate({ children }: Props) {
  const { isReady, shouldShowOnboarding, completeOnboarding } = useOnboarding();

  if (!isReady) return null;

  return (
    <>
      {children}
      {shouldShowOnboarding && (
        <OnboardingOverlay onComplete={completeOnboarding} />
      )}
    </>
  );
}


