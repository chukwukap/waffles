"use client";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import { base } from "wagmi/chains";
import { env } from "@/lib/env";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect } from "react";

interface Props {
  children: React.ReactNode;
}

export function MinikitProvider({ children }: Props) {
  return (
    <OnchainKitProvider
      apiKey={env.nextPublicOnchainkitApiKey}
      chain={base}
      config={{
        appearance: {
          mode: "dark",
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

export function IsMiniAppReady({ children }: { children: React.ReactNode }) {
  const { isFrameReady, setFrameReady } = useMiniKit();
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);
  return <>{children}</>;
}
