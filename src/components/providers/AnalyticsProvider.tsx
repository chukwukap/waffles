"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initAnalytics, trackPageView, identifyUser } from "@/lib/analytics";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

export function AnalyticsProvider() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { context } = useMiniKit();

    // Initialize PostHog on mount
    useEffect(() => {
        initAnalytics();
    }, []);

    // Identify user when FID is available
    useEffect(() => {
        const fid = context?.user?.fid;
        if (fid) {
            identifyUser(fid, {
                fid,
                username: context.user?.username,
            });
        }
    }, [context?.user]);

    // Track page views on route change
    useEffect(() => {
        trackPageView();
    }, [pathname, searchParams]);

    return null;
}
