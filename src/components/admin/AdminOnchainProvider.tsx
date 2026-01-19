"use client";

import { OnchainKitProvider as OnchainKitProviderComponent } from "@coinbase/onchainkit";
import { env } from "@/lib/env";
import { CHAIN_CONFIG } from "@/lib/chain";

interface Props {
    children: React.ReactNode;
}

/**
 * AdminOnchainProvider
 * 
 * Lightweight OnchainKit wrapper for admin dashboard.
 * Enables wallet connection for on-chain operations (sponsoring, etc.)
 * without the full minikit config used in the main app.
 */
export function AdminOnchainProvider({ children }: Props) {
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
                },
            }}
        >
            {children}
        </OnchainKitProviderComponent>
    );
}
