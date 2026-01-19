"use client";

import { OnchainKitProvider as OnchainKitProviderComponent } from "@coinbase/onchainkit";
import { env } from "@/lib/env";
import { minikitConfig } from "@minikit-config";
import { chain } from "@/lib/chain";

interface Props {
  children: React.ReactNode;
}

export function OnchainKitProvider({ children }: Props) {
  return (
    <OnchainKitProviderComponent
      apiKey={env.nextPublicOnchainkitApiKey}
      chain={chain}
      rpcUrl="https://sepolia.base.org"
      config={{
        appearance: {
          mode: "dark",
        },
        wallet: {
          display: "modal",
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
