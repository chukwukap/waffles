"use client";

import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingOverlay } from "./onboarding-overlay";
import type { ReactNode } from "react";

interface OnboardingGateProps {
  children: ReactNode;
}

/**
 * Handles onboarding flow without blocking app render.
 * 
 * The overlay is a fixed full-screen element that covers the app,
 * so we can safely render both. This avoids blank screens and lets
 * the app start loading in the background.
 */
export function OnboardingGate({ children }: OnboardingGateProps) {
  const { shouldShowOnboarding, completeOnboarding } = useOnboarding();

  return (
    <>
      {/* Always render children - they handle their own loading states */}
      {children}
      
      {/* Overlay shows on top when onboarding is needed */}
      {shouldShowOnboarding && (
        <OnboardingOverlay onComplete={completeOnboarding} />
      )}
    </>
  );
}
