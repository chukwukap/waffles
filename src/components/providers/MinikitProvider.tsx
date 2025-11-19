"use client";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import { base } from "wagmi/chains";
import { env } from "@/lib/env";

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
        notificationProxyUrl: env.rootUrl + "/api/webhook",
      }}
    >
      {children}
    </OnchainKitProvider>
  );
}
