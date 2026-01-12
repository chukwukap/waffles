"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useMiniKit, useAddFrame } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import { upsertUser } from "@/actions/users";
import { saveNotificationTokenAction } from "@/actions/notifications";
import { OnboardingOverlay } from "../OnboardingOverlay";

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

    const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
    const hasPromptedAddFrameRef = useRef(false);

    // Check if user exists in DB
    useEffect(() => {
        if (!fid) return;
        fetch(`/api/v1/me?fid=${fid}`, { cache: "no-store" })
            .then((res) => res.json())
            .then((data) => setShowOnboarding(data.code === "NOT_FOUND"))
            .catch(() => setShowOnboarding(false))
            .finally(() => setMiniAppReady());
    }, [fid, setMiniAppReady]);

    // Prompt to add miniapp on first visit (once per session)
    // This enables push notifications via Farcaster
    useEffect(() => {
        if (hasPromptedAddFrameRef.current) return;
        if (showOnboarding !== false) return; // Wait until user is authenticated
        if (!fid) return;
        if (context?.client?.added) return; // Already added

        hasPromptedAddFrameRef.current = true;

        (async () => {
            try {
                const result = await addFrame();
                if (result && context?.client.clientFid && fid) {
                    await saveNotificationTokenAction(fid, context.client.clientFid, result);
                }
            } catch (err) {
                // User may decline - that's ok
                console.log("User declined addFrame:", err);
            }
        })();
    }, [showOnboarding, fid, context?.client?.added, context?.client?.clientFid, addFrame]);

    // Create user after onboarding
    const handleOnboardingComplete = useCallback(async () => {
        if (!fid) throw new Error("Missing FID");

        const result = await upsertUser({ fid, username, pfpUrl, wallet: address });
        if (!result.success) throw new Error(result.error || "Failed to create user");

        setShowOnboarding(false);
    }, [fid, username, pfpUrl, address]);

    // Still checking
    if (showOnboarding === null) return null;

    // Show onboarding for new users
    if (showOnboarding) {
        return <OnboardingOverlay onComplete={handleOnboardingComplete} />;
    }

    // User exists → show app
    return <>{children}</>;
}
