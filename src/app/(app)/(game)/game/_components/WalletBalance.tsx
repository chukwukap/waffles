"use client";

import { WalletIcon } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { env } from "@/lib/env";
import { base } from "viem/chains";

export function WalletBalance() {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { roundedBalance } = useGetTokenBalance(address as `0x${string}`, {
        address: env.nextPublicUsdcAddress as `0x${string}`,
        decimals: 6,
        name: "USDC",
        symbol: "USDC",
        image: "/images/tokens/usdc.png",
        chainId: base.id,
    });

    // if (!isConnected || !address) {
    //     return (
    //         <button
    //             onClick={() => connect({ connector: connectors[0] })}
    //             className="flex items-center px-3 py-1.5 rounded-full bg-[#F9F9F91A] font-body hover:bg-[#F9F9F92A] transition-colors"
    //         >
    //             <WalletIcon className="w-[12px] h-[10.8px] opacity-100 text-white mr-1" />
    //             <span className="text-center font-normal not-italic text-[16px] leading-[100%] tracking-[0px] text-white">
    //                 Connect
    //             </span>
    //         </button>
    //     );
    // }

    return (
        <div className="flex items-center px-3 py-1.5 rounded-full bg-[#F9F9F91A] font-body">
            <WalletIcon className="w-[12px] h-[10.8px] opacity-100 text-white mr-1" />
            <span className="text-center font-normal not-italic text-[16px] leading-[100%] tracking-[0px] text-white">
                {`$${Number(roundedBalance).toFixed(2)}`}
            </span>
        </div>
    );
}
