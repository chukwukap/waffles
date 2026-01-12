"use client";

import { OnchainKitProvider as OnchainKitProviderComponent } from "@coinbase/onchainkit";
import { env } from "@/lib/env";
import { CHAIN_CONFIG } from "@/lib/chain";
import { minikitConfig } from "@minikit-config";

interface Props {
  children: React.ReactNode;
}

export function OnchainKitProvider({ children }: Props) {
  return (
    <OnchainKitProviderComponent
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
          },
        },
      }}
      miniKit={{
        enabled: true,
        autoConnect: true,
        notificationProxyUrl: minikitConfig.miniapp.webhookUrl,
      }}
    >
      {children}
    </OnchainKitProviderComponent>
  );
}
