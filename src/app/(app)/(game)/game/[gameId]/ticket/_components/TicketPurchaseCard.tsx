"use client";

import { useCallback, useMemo, useEffect, useState } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { parseUnits, encodeFunctionData } from "viem";
import {
    Transaction,
    TransactionButton,
    TransactionStatus,
    TransactionStatusLabel,
    TransactionStatusAction,
} from "@coinbase/onchainkit/transaction";
import type { LifecycleStatus } from "@coinbase/onchainkit/transaction";
import sdk from "@farcaster/miniapp-sdk";

import { useTokenBalance, useTokenAllowance, useHasTicket } from "@/hooks/useWaffleGame";
import { TOKEN_CONFIG, WAFFLE_GAME_CONFIG, CHAIN_CONFIG } from "@/lib/contracts/config";
import { notify } from "@/components/ui/Toaster";
import waffleGameAbi from "@/lib/contracts/WaffleGameAbi.json";

// ERC20 ABI for approve
const erc20Abi = [
    {
        type: "function",
        name: "approve",
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
    },
] as const;

// --- InfoBox Helper Component ---
const InfoBox = ({
    iconUrl,
    label,
    value,
}: {
    iconUrl: string;
    label: string;
    value: string;
}) => (
    <div
        className="flex flex-col justify-center items-center gap-1 w-[156px]"
        style={{ height: "clamp(60px, 12dvh, 89px)" }}
    >
        <Image
            src={iconUrl}
            width={40}
            height={40}
            alt={label}
            className="h-[40px]"
            onError={(e) => {
                e.currentTarget.style.display = "none";
            }}
        />
        <div className="flex flex-col justify-center items-center">
            <span className="font-display text-[16px] font-medium leading-[130%] tracking-[-0.03em] text-[#99A0AE]">
                {label}
            </span>
            <span className="font-body text-[24px] font-normal leading-[100%] text-white">
                {value}
            </span>
        </div>
    </div>
);

// --- Ticket Purchase Card Component ---
export const TicketPurchaseCard = ({
    spots,
    prizePool,
    price,
    maxPlayers,
    gameId,
    onPurchaseSuccess,
}: {
    spots: number;
    prizePool: number;
    price: number;
    maxPlayers: number;
    gameId: number;
    onPurchaseSuccess?: () => void;
}) => {
    const { address, isConnected } = useAccount();
    const [txHash, setTxHash] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Contract reads
    const { data: balance } = useTokenBalance(address);
    const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(address);
    const { data: hasTicket, refetch: refetchHasTicket } = useHasTicket(
        gameId ? BigInt(gameId) : undefined,
        address
    );

    // Derived state
    const priceInUnits = parseUnits(price.toString(), TOKEN_CONFIG.decimals);
    const hasEnoughBalance = balance !== undefined && balance >= priceInUnits;
    const needsApproval = allowance === undefined || allowance < priceInUnits;
    const isSoldOut = spots <= 0;

    // Track if purchase was completed (to prevent showing Transaction again)
    const [purchaseComplete, setPurchaseComplete] = useState(false);

    // Check if we have all data needed to build transaction
    const isDataReady = address && balance !== undefined && allowance !== undefined && hasTicket !== undefined;

    // Build transaction calls - approve + buy (batched into single confirmation)
    // Returns empty if user already has ticket to prevent duplicate purchases
    const calls = useMemo(() => {
        // Don't build calls if user already has ticket or purchase completed
        if (!address || !isDataReady || hasTicket || purchaseComplete) return [];

        const buyCall = {
            to: WAFFLE_GAME_CONFIG.address as `0x${string}`,
            data: encodeFunctionData({
                abi: waffleGameAbi,
                functionName: "buyTicket",
                args: [BigInt(gameId), priceInUnits],
            }),
        };

        // If approval needed, include approve call first
        if (needsApproval) {
            const approveCall = {
                to: TOKEN_CONFIG.address as `0x${string}`,
                data: encodeFunctionData({
                    abi: erc20Abi,
                    functionName: "approve",
                    args: [WAFFLE_GAME_CONFIG.address, priceInUnits],
                }),
            };
            return [approveCall, buyCall];
        }

        return [buyCall];
    }, [address, gameId, priceInUnits, needsApproval, isDataReady, hasTicket, purchaseComplete]);

    // Handle transaction lifecycle
    const handleOnStatus = useCallback(
        async (status: LifecycleStatus) => {
            console.log("[TicketPurchase] Status:", status.statusName, status);

            if (status.statusName === "success") {
                const receipts = status.statusData?.transactionReceipts;
                const hash = receipts?.[receipts.length - 1]?.transactionHash;
                if (hash) {
                    setTxHash(hash);
                    setPurchaseComplete(true); // Mark as complete to prevent re-purchase
                }
            }

            if (status.statusName === "error") {
                console.error("[TicketPurchase] Transaction error");
                notify.error("Transaction failed. Please try again.");
            }
        },
        []
    );

    // Sync with backend after successful transaction (runs once)
    useEffect(() => {
        if (!txHash || isSyncing) return;

        async function syncWithBackend() {
            setIsSyncing(true);
            try {
                // Quick poll for on-chain confirmation (max 5 attempts)
                for (let i = 0; i < 5; i++) {
                    const { data: hasTicketNow } = await refetchHasTicket();
                    if (hasTicketNow) {
                        break;
                    }
                    await new Promise((r) => setTimeout(r, 1500));
                }

                // Sync with backend
                const res = await sdk.quickAuth.fetch(
                    `/api/v1/games/${gameId}/entry`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ txHash }),
                    }
                );

                if (res.ok) {
                    notify.success("Ticket purchased successfully!");
                } else {
                    notify.info("Ticket purchased! Refresh to see it.");
                }
                // Notify parent component to show success card
                onPurchaseSuccess?.();
            } catch (error) {
                console.error("[TicketPurchase] Sync failed:", error);
                notify.success("Ticket purchased!");
                // Still notify even on sync failure - purchase was successful on-chain
                onPurchaseSuccess?.();
            } finally {
                setIsSyncing(false);
                refetchAllowance();
                refetchHasTicket();
            }
        }

        syncWithBackend();
    }, [txHash, gameId, refetchHasTicket, refetchAllowance, isSyncing]);

    // Determine button text
    const getButtonText = () => {
        if (isSoldOut) return "SOLD OUT";
        if (hasTicket || purchaseComplete) return "ALREADY PURCHASED";
        if (!isConnected) return "CONNECT WALLET";
        if (!isDataReady) return "LOADING...";
        if (!hasEnoughBalance) return "INSUFFICIENT USDC";
        if (isSyncing) return "SYNCING...";
        return `BUY WAFFLE $${price}`;
    };

    // Prevent transaction when user has ticket or purchase is complete
    const isDisabled = isSoldOut || hasTicket || purchaseComplete || !isConnected || !hasEnoughBalance || isSyncing || !isDataReady || calls.length === 0;

    return (
        <div
            className="box-border flex flex-col justify-center items-center p-4 px-3 border border-white/10 rounded-2xl w-full max-w-[361px]"
            style={{ gap: "clamp(12px, 3dvh, 24px)" }}
        >
            {/* Top section with Spots and Prize pool */}
            <div className="flex flex-row justify-center items-center gap-4 sm:gap-6 w-full">
                <div className="flex-1 flex justify-center">
                    <InfoBox
                        iconUrl="/images/illustrations/seats.svg"
                        label="Spots"
                        value={`${spots}/${maxPlayers}`}
                    />
                </div>
                <div className="flex-1 flex justify-center">
                    <InfoBox
                        iconUrl="/images/illustrations/money-stack.svg"
                        label="Prize pool"
                        value={`$${prizePool}`}
                    />
                </div>
            </div>

            {/* Transaction Button */}
            <div className="w-full max-w-[337px]">
                {isDisabled ? (
                    <button
                        className="relative flex items-center justify-center h-[54px] px-6 bg-white/60 text-[#191919] font-body font-normal uppercase tracking-[-0.02em] text-center text-[26px] leading-[115%] w-full max-w-[361px] mx-auto rounded-[12px] border-[5px] border-t-0 border-l-0 border-(--brand-cyan) cursor-not-allowed opacity-60"
                        disabled
                    >
                        {getButtonText()}
                    </button>
                ) : (
                    <Transaction
                        chainId={CHAIN_CONFIG.chainId}
                        calls={calls}
                        onStatus={handleOnStatus}
                    >
                        <TransactionButton
                            text={getButtonText()}
                            className="relative flex items-center justify-center h-[54px] px-6 bg-white text-[#191919] font-body font-normal uppercase tracking-[-0.02em] text-center text-[26px] leading-[115%] w-full max-w-[361px] mx-auto rounded-[12px] border-[5px] border-t-0 border-l-0 border-(--brand-cyan)"
                        />
                        <TransactionStatus>
                            <TransactionStatusLabel className="text-white text-sm mt-2" />
                            <TransactionStatusAction className="text-cyan-400 text-sm" />
                        </TransactionStatus>
                    </Transaction>
                )}
            </div>
        </div>
    );
};
