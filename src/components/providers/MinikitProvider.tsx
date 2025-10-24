"use client";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import { baseSepolia } from "wagmi/chains";
import { env } from "@/lib/env";
import { useSyncUser } from "@/hooks/useSyncUser";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

import { useEffect } from "react";

interface Props {
  children: React.ReactNode;
}

export function MinikitProvider({ children }: Props) {
  return (
    <OnchainKitProvider
      apiKey={env.nextPublicOnchainkitApiKey}
      chain={baseSepolia}
      config={{
        appearance: {
          mode: "auto",
        },
        wallet: {
          display: "modal",
          preference: "all",
        },
      }}
      miniKit={{
        enabled: true,
        autoConnect: true,
        notificationProxyUrl: undefined,
      }}
    >
      <IsMiniAppReady>{children}</IsMiniAppReady>
    </OnchainKitProvider>
  );
}

function IsMiniAppReady({ children }: { children: React.ReactNode }) {
  const { isFrameReady, setFrameReady } = useMiniKit();
  // Initialize the  miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);
  useSyncUser();

  return <>{children}</>;
}
