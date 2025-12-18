"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { encodeFunctionData, formatUnits } from "viem";
import {
    Transaction,
    TransactionButton,
    TransactionStatus,
    TransactionStatusLabel,
    TransactionStatusAction,
} from "@coinbase/onchainkit/transaction";
import type { LifecycleStatus } from "@coinbase/onchainkit/transaction";

import { useTokenBalance } from "@/hooks/waffleContractHooks";
import { TOKEN_CONFIG, CHAIN_CONFIG } from "@/lib/contracts/config";
import { notify } from "@/components/ui/Toaster";
import { MinikitProvider } from "@/components/providers/MinikitProvider";
import GlobalToaster from "@/components/ui/Toaster";

// TestUSDC ABI for faucet function
const testUsdcAbi = [
    {
        type: "function",
        name: "faucet",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable",
    },
] as const;

function FaucetContent() {
    const { address, isConnected } = useAccount();
    const { data: balance, refetch: refetchBalance } = useTokenBalance(address);

    // Format balance for display
    const formattedBalance = useMemo(() => {
        if (balance === undefined) return "0.00";
        return formatUnits(balance, TOKEN_CONFIG.decimals);
    }, [balance]);

    // Build faucet call
    const calls = useMemo(() => {
        if (!address) return [];
        return [
            {
                to: TOKEN_CONFIG.address as `0x${string}`,
                data: encodeFunctionData({
                    abi: testUsdcAbi,
                    functionName: "faucet",
                }),
            },
        ];
    }, [address]);

    // Handle transaction lifecycle
    const handleOnStatus = useCallback(
        (status: LifecycleStatus) => {
            console.log("[Faucet] Status:", status.statusName);

            if (status.statusName === "success") {
                notify.success("Claimed 10 USDC! 🎉");
                setTimeout(() => refetchBalance(), 2000);
            }

            if (status.statusName === "error") {
                notify.error("Transaction failed. Please try again.");
            }
        },
        [refetchBalance]
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">
                    🧇 TEST USDC FAUCET
                </h1>
                <p className="text-gray-400 text-sm">
                    Claim free test USDC to play Waffles on Base Sepolia
                </p>
            </div>

            {/* Balance Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-sm mb-6 text-center">
                <p className="text-gray-400 text-sm mb-1">Your Balance</p>
                <p className="text-3xl font-bold text-white">
                    ${formattedBalance} USDC
                </p>
            </div>

            {/* Faucet Button */}
            <div className="w-full max-w-sm mb-6">
                {!isConnected ? (
                    <button
                        className="w-full h-14 px-6 bg-gray-600 text-white font-bold text-lg rounded-xl cursor-not-allowed opacity-60"
                        disabled
                    >
                        CONNECT WALLET FIRST
                    </button>
                ) : (
                    <Transaction
                        chainId={CHAIN_CONFIG.chainId}
                        calls={calls}
                        onStatus={handleOnStatus}
                    >
                        <TransactionButton
                            text="CLAIM 10 USDC"
                            className="w-full h-14 px-6 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg rounded-xl transition-colors"
                        />
                        <TransactionStatus>
                            <TransactionStatusLabel className="text-white text-sm mt-2 text-center" />
                            <TransactionStatusAction className="text-cyan-400 text-sm text-center" />
                        </TransactionStatus>
                    </Transaction>
                )}
            </div>

            {/* Info */}
            <p className="text-gray-500 text-xs text-center max-w-xs mb-6">
                This is testnet USDC on Base Sepolia. Claim as many times as you want for testing.
            </p>

            {/* Contract Info */}
            <div className="text-gray-600 text-xs text-center">
                <p>Token: {TOKEN_CONFIG.address}</p>
                <p>Network: {CHAIN_CONFIG.name}</p>
            </div>

            {/* Back Link */}
            <Link
                href="/"
                className="mt-8 text-cyan-400 text-sm hover:underline"
            >
                ← Back to Waffles
            </Link>
        </div>
    );
}

// Wrapper component that provides the context
function FaucetPageWrapper() {
    return (
        <MinikitProvider>
            <FaucetContent />
            <GlobalToaster />
        </MinikitProvider>
    );
}

export default FaucetPageWrapper;

