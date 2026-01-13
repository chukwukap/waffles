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

/**
 * AppInitializer - Handles user initialization and app-wide setup.
 *
 * Responsibilities:
 * 1. Check if user exists, show onboarding if not
 * 2. Prompt to add miniapp (once per session) for notifications
 */
export function AppInitializer({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const { context, setMiniAppReady } = useMiniKit();
  const addFrame = useAddFrame();

  const fid = context?.user?.fid;
  const username = context?.user?.username;
  const pfpUrl = context?.user?.pfpUrl;

  const { user, isLoading, refetch } = useUser();
  const hasPromptedAddFrameRef = useRef(false);

  // Signal ready when we know user status
  useEffect(() => {
    if (!isLoading) {
      setMiniAppReady();
    }
  }, [isLoading, setMiniAppReady]);

  // Prompt to add miniapp on first visit (once per session)
  // This enables push notifications via Farcaster
  useEffect(() => {
    if (hasPromptedAddFrameRef.current) return;
    if (isLoading || !user) return; // Wait until authenticated
    if (!fid) return;
    if (context?.client?.added) return; // Already added

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

    // Refetch user data to update SWR cache and proceed to app
    await refetch();
  }, [fid, username, pfpUrl, address, refetch]);

  // Still checking
  if (isLoading) return null;

  // New user (user is null but not loading) → show onboarding
  if (!user) {
    return <OnboardingOverlay onComplete={handleOnboardingComplete} />;
  }

  // User exists → show app
  return <>{children}</>;
}
