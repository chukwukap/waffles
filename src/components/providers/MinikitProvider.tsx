"use client";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import { base } from "viem/chains";
import { env } from "@/lib/env";
import { useMiniKitInit } from "@/hooks/useMiniKitInit";
import { minikitConfig } from "../../../minikit.config";

interface Props {
  children: React.ReactNode;
}

function MiniKitInitializer({ children }: { children: React.ReactNode }) {
  // This ensures MiniKit is initialized globally
  useMiniKitInit();
  return <>{children}</>;
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
        notificationProxyUrl: minikitConfig.miniapp.webhookUrl,
      }}
    >
      <MiniKitInitializer>{children}</MiniKitInitializer>
    </OnchainKitProvider>
  );
}
