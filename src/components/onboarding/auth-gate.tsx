"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import sdk from "@farcaster/miniapp-sdk";
import { syncUserAction } from "@/actions/onboarding";
import { OnboardingOverlay } from "./onboarding-overlay";

type AuthStatus = "checking" | "new_user" | "authenticated";

// Onboarding images to preload
const ONBOARDING_IMAGES = [
  "/logo-onboarding.png",
  "/images/illustrations/waffle-ticket.png",
  "/images/illustrations/money-bag.png",
  "/images/illustrations/crown.png",
];

/** Preload images in parallel */
function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Don't block on errors
          img.src = url;
        })
    )
  );
}

/**
 * AuthGate - Handles auth check and onboarding BEFORE showing app.
 *
 * Flow:
 * 1. Farcaster splash is visible (we haven't called ready)
 * 2. We get context → check user + preload onboarding images
 * 3. Call setMiniAppReady() → Farcaster hides splash
 * 4. Show app or onboarding overlay (images already cached)
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const { context, setMiniAppReady } = useMiniKit();
  const fid = context?.user?.fid;
  const username = context?.user?.username;
  const pfpUrl = context?.user?.pfpUrl;

  const [status, setStatus] = useState<AuthStatus>("checking");
  const [mountKey, setMountKey] = useState(0);

  // Check user status + preload images, THEN signal ready
  useEffect(() => {
    if (!fid) return;

    (async () => {
      // Run auth check and image preload in parallel
      const [authResult] = await Promise.all([
        sdk.quickAuth
          .fetch("/api/v1/me", { cache: "no-store" })
          .then((res) => res.ok)
          .catch(() => false),
        preloadImages(ONBOARDING_IMAGES),
      ]);

      setStatus(authResult ? "authenticated" : "new_user");

      // NOW we're ready - hide Farcaster splash
      setMiniAppReady();
    })();
  }, [fid, setMiniAppReady]);

  // Complete onboarding
  const handleOnboardingComplete = useCallback(async () => {
    if (!fid) throw new Error("Missing FID");

    const result = await syncUserAction({
      fid,
      username,
      pfpUrl,
      wallet: address,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to create user");
    }

    setStatus("authenticated");
    setMountKey((k) => k + 1);
  }, [fid, username, pfpUrl, address]);

  // While checking, render nothing (Farcaster splash is visible)
  if (status === "checking") {
    return null;
  }

  return (
    <>
      <div key={mountKey} className="contents">
        {children}
      </div>
      {status === "new_user" && (
        <OnboardingOverlay onComplete={handleOnboardingComplete} />
      )}
    </>
  );
}
