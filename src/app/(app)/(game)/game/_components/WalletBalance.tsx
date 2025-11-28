"use client";

import { WalletIcon } from "lucide-react";
import { useAccount, useChainId, } from "wagmi";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";

import { USDC_ADDRESS_BASE_MAINNET } from "@/lib/constants";

export function WalletBalance() {
    const { address } = useAccount();
    const chainId = useChainId();
    const { roundedBalance, refetch, status, convertedBalance, error, response } = useGetTokenBalance(address as `0x${string}`, {
        address: USDC_ADDRESS_BASE_MAINNET as `0x${string}`,
        decimals: 6,
        name: "USDC",
        symbol: "USDC",
        image: "/images/tokens/usdc.png",
        chainId: chainId,
    });

    console.log("[GAME Header] useGetTokenBalance result:", {
        roundedBalance,
        convertedBalance,
        status,
        error,
        responseKeys: response ? Object.keys(response) : [],
        responseData: response?.data,
        responseError: response?.error,
        responseIsLoading: response?.isLoading,
        responseStatus: response?.status,
        hasRefetch: !!refetch
    });

    // If stuck pending, try manual refetch after a delay
    // if (status === 'pending' && refetch) {
    //     setTimeout(() => {
    //         refetch();
    //     }, 5000); // 5 seconds
    //     console.log("[GAME Header] Status stuck on pending, manual refetch available");
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
