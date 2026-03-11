"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useMiniKit, useAddFrame } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import { upsertUser } from "@/actions/users";
import { saveNotificationTokenAction } from "@/actions/notifications";
import { OnboardingOverlay } from "../OnboardingOverlay";
import { useUser } from "@/hooks/useUser";
import { useSplash } from "./SplashProvider";

/**
 * AppInitializer - Handles user initialization and app-wide setup.
 *
 * Responsibilities:
 * 1. Signal MiniApp ready to Farcaster SDK as early as possible
 * 2. Check if user exists, show onboarding if not
 * 3. Prompt to add miniapp (once per session) for notifications
 */
export function AppInitializer({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const { context, setMiniAppReady } = useMiniKit();
  const addFrame = useAddFrame();
  const { hideSplash } = useSplash();

  const fid = context?.user?.fid;
  const username = context?.user?.username;
  const pfpUrl = context?.user?.pfpUrl;

  const { user, isLoading, error, refetch } = useUser();
  const hasPromptedAddFrameRef = useRef(false);
  const hasSignaledReadyRef = useRef(false);

  // Signal ready to Farcaster as soon as we have context OR after a timeout.
  // This MUST happen for the Farcaster client to dismiss its own loading state.
  useEffect(() => {
    if (hasSignaledReadyRef.current) return;

    // Signal ready once we know the user status
    if (!isLoading) {
      hasSignaledReadyRef.current = true;
      setMiniAppReady();
      hideSplash();
      return;
    }

    // Fallback: signal ready after 3s even if still loading,
    // so the Farcaster client doesn't get stuck on its loading screen.
    const timeout = setTimeout(() => {
      if (!hasSignaledReadyRef.current) {
        hasSignaledReadyRef.current = true;
        setMiniAppReady();
        hideSplash();
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isLoading, setMiniAppReady, hideSplash]);

  // Prompt to add miniapp on first visit (once per session)
  // This enables push notifications via Farcaster
  useEffect(() => {
    if (hasPromptedAddFrameRef.current) return;
    if (isLoading || !user) return;
    if (!fid) return;
    if (context?.client?.added) return;

    hasPromptedAddFrameRef.current = true;

    (async () => {
      try {
        const result = await addFrame();
        if (result && context?.client.clientFid) {
          await saveNotificationTokenAction(
            fid,
            context.client.clientFid,
            result
          );
        }
      } catch (err) {
        console.log("User declined addFrame:", err);
      }
    })();
  }, [isLoading, user, fid, context?.client?.added, context?.client?.clientFid, addFrame]);

  // Create user after onboarding
  const handleOnboardingComplete = useCallback(async () => {
    if (!fid) throw new Error("Missing FID");

    const result = await upsertUser({ fid, username, pfpUrl, wallet: address });
    if (!result.success)
      throw new Error(result.error || "Failed to create user");

    await refetch();
  }, [fid, username, pfpUrl, address, refetch]);

  // Still loading — show nothing (splash screen covers this)
  if (isLoading) return null;

  // Error fetching user — treat as new user rather than hanging forever
  if (error && !user) {
    return <OnboardingOverlay onComplete={handleOnboardingComplete} />;
  }

  // New user → show onboarding
  if (!user) {
    return <OnboardingOverlay onComplete={handleOnboardingComplete} />;
  }

  // User exists → show app
  return <>{children}</>;
}
