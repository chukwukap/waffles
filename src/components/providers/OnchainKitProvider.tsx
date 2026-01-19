"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { OnchainKitProvider as OnchainKitProviderComponent } from "@coinbase/onchainkit";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { env } from "@/lib/env";
import { minikitConfig } from "@minikit-config";
import { chain } from "@/lib/chain";

/**
 * Custom wagmi config with chain order control
 * 
 * IMPORTANT: The first chain in the array is the default chain
 * that Farcaster wallet will use. OnchainKit's default config
 * places Base mainnet first, causing issues for testnet apps.
 */
const wagmiConfig = createConfig({
  // CRITICAL: Put your preferred chain FIRST
  chains: [chain],
  connectors: [farcasterMiniApp()],
  ssr: true,
  transports: {
    [chain.id]: env.nextPublicOnchainkitApiKey
      ? http(`https://api.developer.coinbase.com/rpc/v1/${chain.name.toLowerCase().replace(" ", "-")}/${env.nextPublicOnchainkitApiKey}`)
      : http(),
  },
});

const queryClient = new QueryClient();

interface Props {
  children: React.ReactNode;
}

export function OnchainKitProvider({ children }: Props) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProviderComponent
          apiKey={env.nextPublicOnchainkitApiKey}
          chain={chain}
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
      </QueryClientProvider>
    </WagmiProvider>
  );
}
