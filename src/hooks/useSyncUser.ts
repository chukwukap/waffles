"use client";

import { useEffect, useRef } from "react";
import { useMiniUser } from "@/hooks/useMiniUser";
import { useLobby } from "@/state";

export function useSyncUser() {
  const { fid, username, pfpUrl, wallet } = useMiniUser();
  const { registerReferralCode, fetchReferralStatus } = useLobby();
  const lastSyncRef = useRef<{
    fid: number;
    username: string;
    pfpUrl?: string | null;
    wallet?: string | null;
  } | null>(null);

  useEffect(() => {
    if (!fid || !username) return;

    const last = lastSyncRef.current;
    if (
      last &&
      last.fid === fid &&
      last.username === username &&
      last.pfpUrl === pfpUrl &&
      last.wallet === wallet
    ) {
      return;
    }

    lastSyncRef.current = { fid, username, pfpUrl, wallet };

    const syncUser = async () => {
      console.log("syncing user", { fid, username, pfpUrl, wallet });
      try {
        const res = await fetch("/api/user/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fid,
            username,
            pfpUrl,
            wallet,
          }),
        });
        if (!res.ok) {
          throw new Error(`Sync failed with status ${res.status}`);
        }
        const data = await res.json();
        if (data?.referralCode) {
          registerReferralCode({
            code: data.referralCode,
            inviterFarcasterId: String(fid),
            inviteeId: data.referral?.inviteeId,
          });
        }

        await fetchReferralStatus(String(fid));
      } catch (err) {
        console.error("Failed to sync user:", err);
      }
    };

    syncUser();
  }, [
    fid,
    wallet,
    username,
    pfpUrl,
    registerReferralCode,
    fetchReferralStatus,
  ]);
}
