"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";

// Import Farcaster Mini-App SDK
import { MiniAppSDK } from "@farcaster/miniapp-sdk";

export const useFarcaster = () => {
  const [sdk, setSdk] = useState<MiniAppSDK | null>(null);
  const setUser = useAuthStore((s) => s.setUser);
  const setSafeArea = useAuthStore((s) => s.setSafeArea);

  useEffect(() => {
    async function init() {
      const instance = new MiniAppSDK();
      await instance.actions.ready();

      const context = await instance.context.get();
      setSdk(instance);

      if (context?.user) {
        setUser({
          fid: context.user.fid,
          username: context.user.username,
          pfpUrl: context.user.pfp_url,
        });

        await fetch("/api/user/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fid: context.user.fid,
            username: context.user.username,
            pfpUrl: context.user.pfp_url,
            walletAddress: useAuthStore.getState().walletAddress,
          }),
        });
      }

      if (context?.client?.safeAreaInsets) {
        setSafeArea(context.client.safeAreaInsets);
      }
    }

    init();
  }, [setUser, setSafeArea]);

  return sdk;
};
