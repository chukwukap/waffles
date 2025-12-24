"use client";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import { env } from "@/lib/env";
import { CHAIN_CONFIG } from "@/lib/contracts/config";
import { minikitConfig } from "../../../minikit.config";

interface Props {
  children: React.ReactNode;
}

export function MinikitProvider({ children }: Props) {
  return (
    <OnchainKitProvider
      apiKey={env.nextPublicOnchainkitApiKey}
      chain={CHAIN_CONFIG.chain}
      config={{
        appearance: {
          mode: "dark",
        },
        wallet: {
          display: "modal",
          preference: "all",
          supportedWallets: {
            frame: true,
          }
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
