"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import sdk from "@farcaster/miniapp-sdk";
import { syncUserAction } from "@/actions/onboarding";
import { OnboardingOverlay } from "./onboarding-overlay";

type AuthStatus = "checking" | "new_user" | "authenticated";

/**
 * AuthGate - Handles auth check and onboarding BEFORE showing app.
 *
 * Flow:
 * 1. Farcaster splash is visible (we haven't called ready)
 * 2. We get context → check if user exists in DB
 * 3. Call setMiniAppReady() → Farcaster hides splash
 * 4. New user → show onboarding (children don't render yet)
 * 5. After onboarding → render children
 *
 * Note: Onboarding images are preloaded via <link rel="preload"> in layout.tsx
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const { context, setMiniAppReady } = useMiniKit();
  const fid = context?.user?.fid;
  const username = context?.user?.username;
  const pfpUrl = context?.user?.pfpUrl;

  const [status, setStatus] = useState<AuthStatus>("checking");

  // Check user status, THEN signal ready
  useEffect(() => {
    if (!fid) return;

    (async () => {
      try {
        const res = await sdk.quickAuth.fetch("/api/v1/me", {
          cache: "no-store",
        });
        setStatus(res.ok ? "authenticated" : "new_user");
      } catch {
        setStatus("new_user");
      } finally {
        setMiniAppReady();
      }
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
  }, [fid, username, pfpUrl, address]);

  // While checking → Farcaster splash is visible
  if (status === "checking") {
    return null;
  }

  // New user → show onboarding only (no children = no wasted API calls)
  if (status === "new_user") {
    return <OnboardingOverlay onComplete={handleOnboardingComplete} />;
  }

  // Authenticated → render app
  return <>{children}</>;
}
