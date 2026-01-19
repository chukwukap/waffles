"use client";

import { OnchainKitProvider as OnchainKitProviderComponent } from "@coinbase/onchainkit";
import { env } from "@/lib/env";
import { chain } from "@/lib/chain";

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
            chain={chain}
            config={{
                appearance: {
                    mode: "dark",
                },
                wallet: {
                    display: "modal",
                },
            }}
        >
            {children}
        </OnchainKitProviderComponent>
    );
}
