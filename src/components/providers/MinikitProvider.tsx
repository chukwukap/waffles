"use client";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import { base } from "viem/chains";
import { env } from "@/lib/env";
import { minikitConfig } from "../../../minikit.config";

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
        notificationProxyUrl: minikitConfig.miniapp.webhookUrl,
      }}
    >
      {children}
    </OnchainKitProvider>
  );
}
