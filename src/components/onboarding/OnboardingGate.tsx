"use client";

import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingOverlay } from "./OnboardingOverlay";
import { useMiniUser } from "@/hooks/useMiniUser";
import { useCallback, useState } from "react";

interface Props {
  children: React.ReactNode;
}

/**
 * Wraps the app to present the onboarding overlay to first-time users.
 * Blocks interaction until onboarding is completed to ensure key concepts are seen.
 */
export function OnboardingGate({ children }: Props) {
  const { isReady, shouldShowOnboarding, completeOnboarding } = useOnboarding();
  const { fid, username, pfpUrl, wallet } = useMiniUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Best-effort user creation during onboarding
      if (fid) {
        await fetch("/api/user/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fid,
            username,
            pfpUrl,
            wallet,
          }),
        });
      }
    } catch (_err) {
      // Non-fatal: proceed to finish onboarding; fallback sync will run later
    } finally {
      completeOnboarding();
      setIsSubmitting(false);
    }
  }, [fid, username, pfpUrl, wallet, completeOnboarding, isSubmitting]);

  if (!isReady) return null;

  return (
    <>
      {children}
      {shouldShowOnboarding && (
        <OnboardingOverlay onComplete={handleComplete} />
      )}
    </>
  );
}
