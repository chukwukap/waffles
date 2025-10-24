"use client";

import { useEffect } from "react";
import { useMiniUser } from "@/hooks/useMiniUser";
import { useLobbyStore } from "@/stores/lobbyStore";

export function useSyncUser() {
  const { fid, username, pfpUrl, wallet } = useMiniUser();
  const setReferralData = useLobbyStore((s) => s.setReferralData);
  const fetchReferralStatus = useLobbyStore((s) => s.fetchReferralStatus);

  useEffect(() => {
    if (!fid || !username) return;

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
          setReferralData({
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
  }, [fid, wallet, username, pfpUrl, setReferralData, fetchReferralStatus]);
}
