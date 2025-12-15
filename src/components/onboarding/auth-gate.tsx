"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import sdk from "@farcaster/miniapp-sdk";
import { syncUserAction } from "@/actions/onboarding";
import { OnboardingOverlay } from "./onboarding-overlay";

type AuthStatus = "checking" | "new_user" | "authenticated";

/**
 * AuthGate - Protects the app and handles new user onboarding.
 *
 * Flow:
 * 1. Check if user exists in DB
 * 2. New user → show onboarding overlay
 * 3. Existing user → render app
 * 4. After onboarding complete → render app
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const { context } = useMiniKit();
  const fid = context?.user?.fid;
  const username = context?.user?.username;
  const pfpUrl = context?.user?.pfpUrl;

  const [status, setStatus] = useState<AuthStatus>("checking");
  const [mountKey, setMountKey] = useState(0);

  // Check if user exists
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
      }
    })();
  }, [fid]);

  // Create user and finish onboarding
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
    setMountKey((k) => k + 1); // Remount children to fetch fresh data
  }, [fid, username, pfpUrl, address]);

  // Render
  return (
    <>
      {/* App renders behind overlay, remounts after onboarding */}
      <div key={mountKey} className="contents">
        {children}
      </div>

      {/* Onboarding overlay for new users */}
      {status === "new_user" && (
        <OnboardingOverlay onComplete={handleOnboardingComplete} />
      )}
    </>
  );
}

