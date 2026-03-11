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
 * Key timing issue: When opened from Farcaster, MiniKit context (FID)
 * loads asynchronously. We must call setMiniAppReady() for Farcaster to
 * dismiss its loading screen, AND we must not leave a blank screen if
 * the context is slow or never arrives.
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

  // Whether we've given up waiting for MiniKit context to provide FID
  const [contextTimedOut, setContextTimedOut] = useState(false);

  // Signal ready to Farcaster as soon as we know user status.
  useEffect(() => {
    if (hasSignaledReadyRef.current) return;

    // Happy path: FID arrived, user fetch completed
    if (!isLoading) {
      hasSignaledReadyRef.current = true;
      setMiniAppReady();
      hideSplash();
      return;
    }

    // Fallback: after 3s, signal ready regardless.
    // Without this, Farcaster shows its own loading screen forever,
    // and after our splash dismisses the user sees a blank screen.
    const timeout = setTimeout(() => {
      if (!hasSignaledReadyRef.current) {
        hasSignaledReadyRef.current = true;
        setMiniAppReady();
        hideSplash();
        setContextTimedOut(true);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isLoading, setMiniAppReady, hideSplash]);

  // If FID arrives after timeout, clear timeout state so normal flow resumes
  useEffect(() => {
    if (contextTimedOut && fid) {
      setContextTimedOut(false);
    }
  }, [contextTimedOut, fid]);

  // Prompt to add miniapp on first visit (once per session)
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

  // Still waiting for MiniKit context AND haven't timed out — splash covers this
  if (isLoading && !contextTimedOut) return null;

  // Context timed out or no FID — show onboarding so user isn't stuck on blank
  if (!fid) {
    return <OnboardingOverlay onComplete={handleOnboardingComplete} />;
  }

  // FID available but still fetching user
  if (isLoading) return null;

  // Error fetching user — show onboarding rather than hanging
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
