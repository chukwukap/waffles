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
 * should be displayed based on localStorage status. It blocks the main app
 * from rendering until onboarding is complete to prevent API calls before
 * the user exists in the database.
 */
export function OnboardingGate({ children }: OnboardingGateProps) {
  const { isReady, shouldShowOnboarding, completeOnboarding } = useOnboarding();

  // Show splash screen while checking onboarding status
  if (!isReady) {
    return <SplashScreen />;
  }

  // Block the app from rendering until onboarding is complete
  // This prevents /api/user and other API calls from happening before user exists
  if (shouldShowOnboarding) {
    return <OnboardingOverlay onComplete={completeOnboarding} />;
  }

  // Only render the app after onboarding is complete
  return <>{children}</>;
}