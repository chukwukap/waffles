"use client";

import { useEffect } from "react";
import { useMiniUser } from "@/hooks/useMiniUser";

export function useSyncUser() {
  const { fid, username, pfpUrl, wallet, isMiniAppReady } = useMiniUser();

  useEffect(() => {
    if (!isMiniAppReady || !fid || !wallet) return;

    const syncUser = async () => {
      try {
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
      } catch (err) {
        console.error("Failed to sync user:", err);
      }
    };

    syncUser();
  }, [fid, wallet, username, pfpUrl, isMiniAppReady]);
}
