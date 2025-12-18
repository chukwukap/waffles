"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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

// Tier gradient configs (index -> gradient)
const TIER_GRADIENTS = [
    {
        gradientSelected: "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(211, 77, 25, 0.52) 100%)",
        gradientUnselected: "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(211, 77, 25, 0.2) 100%)",
    },
    {
        gradientSelected: "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.52) 100%)",
        gradientUnselected: "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.12) 100%)",
    },
    {
        gradientSelected: "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 201, 49, 0.52) 100%)",
        gradientUnselected: "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 201, 49, 0.12) 100%)",
    },
];

interface BuyTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameId: number;
    theme: string;
    themeIcon?: string;
    tierPrices: number[];
    prizePool?: number;
    username?: string;
    userAvatar?: string;
    onPurchaseSuccess?: () => void;
}

// ========== SUB-COMPONENTS ==========

// Tier Card
function TierCard({
    price,
    gradientSelected,
    gradientUnselected,
    isSelected,
    onSelect,
}: {
    price: number;
    gradientSelected: string;
    gradientUnselected: string;
    isSelected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            onClick={onSelect}
            className="flex flex-col justify-center items-start rounded-3xl flex-1 transition-all duration-200"
            style={{
                background: isSelected ? gradientSelected : gradientUnselected,
                width: "111px",
                height: "100px",
                padding: "12px",
                gap: "10px",
                borderRadius: "24px",
            }}
        >
            {/* Waffle icon container */}
            <div
                className="flex justify-center items-center rounded-full"
                style={{
                    width: "40px",
                    height: "40px",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "200px",
                }}
            >
                <Image
                    src="/images/icons/waffle-small.png"
                    alt="waffle"
                    width={16}
                    height={12}
                    className="object-contain"
                />
            </div>
            {/* Price */}
            <span
                className="font-body text-white"
                style={{ fontSize: "28px", lineHeight: "100%" }}
            >
                ${price}
            </span>
        </button>
    );
}

// Purchase Content (tier selection UI)
function PurchaseContent({
    theme,
    themeIcon,
    tiers,
    selectedTier,
    setSelectedTier,
    potentialPayout,
    isDisabled,
    getButtonText,
    calls,
    handleOnStatus,
}: {
    theme: string;
    themeIcon?: string;
    tiers: { price: number; gradientSelected: string; gradientUnselected: string }[];
    selectedTier: number;
    setSelectedTier: (index: number) => void;
    potentialPayout: number;
    isDisabled: boolean;
    getButtonText: () => string;
    calls: { to: `0x${string}`; data: `0x${string}` }[];
    handleOnStatus: (status: LifecycleStatus) => void;
}) {
    return (
        <>
            {/* Theme Section */}
            <div
                className="flex flex-col items-center w-full"
                style={{ gap: "clamp(8px, 2vh, 12px)", paddingTop: "clamp(12px, 3vh, 20px)" }}
            >
                <span
                    className="font-display text-white text-center"
                    style={{ fontSize: "clamp(12px, 2vw, 14px)", opacity: 0.6, letterSpacing: "-0.03em" }}
                >
                    Next game theme
                </span>
                <div className="flex items-center gap-2.5">
                    <span className="font-body text-white" style={{ fontSize: "clamp(24px, 5vw, 32px)" }}>
                        {theme.toUpperCase()}
                    </span>
                    {themeIcon && (
                        <Image
                            src={themeIcon}
                            alt={theme}
                            width={41}
                            height={40}
                            className="object-contain"
                            style={{ width: "clamp(32px, 6vw, 41px)", height: "auto" }}
                        />
                    )}
                </div>
            </div>

            {/* Choose Tier Title */}
            <h2
                className="font-body text-white text-center w-full"
                style={{ fontSize: "clamp(18px, 4vw, 22px)", lineHeight: "92%", letterSpacing: "-0.03em" }}
            >
                CHOOSE YOUR TICKET TIER
            </h2>

            {/* Tier Cards */}
            <div className="flex w-full max-w-[361px]" style={{ gap: "clamp(8px, 2vw, 14px)" }}>
                {tiers.map((tier, index) => (
                    <TierCard
                        key={tier.price}
                        price={tier.price}
                        gradientSelected={tier.gradientSelected}
                        gradientUnselected={tier.gradientUnselected}
                        isSelected={selectedTier === index}
                        onSelect={() => setSelectedTier(index)}
                    />
                ))}
            </div>

            {/* Buy Button */}
            <div className="w-full max-w-[361px]">
                {isDisabled ? (
                    <button
                        className="relative flex items-center justify-center px-6 bg-white/60 text-[#191919] font-body font-normal uppercase tracking-[-0.02em] text-center leading-[115%] w-full rounded-[12px] border-[5px] border-t-0 border-l-0 border-(--brand-cyan) cursor-not-allowed opacity-60"
                        style={{ height: "clamp(44px, 8vh, 54px)", fontSize: "clamp(20px, 4vw, 26px)" }}
                        disabled
                    >
                        {getButtonText()}
                    </button>
                ) : (
                    <Transaction chainId={CHAIN_CONFIG.chainId} calls={calls} onStatus={handleOnStatus}>
                        <TransactionButton
                            text={getButtonText()}
                            className="relative flex items-center justify-center px-6 bg-white text-[#191919] font-body font-normal uppercase tracking-[-0.02em] text-center leading-[115%] w-full rounded-[12px] border-[5px] border-t-0 border-l-0 border-(--brand-cyan)"
                        />
                        <TransactionStatus>
                            <TransactionStatusLabel className="text-white text-sm mt-2" />
                            <TransactionStatusAction className="text-cyan-400 text-sm" />
                        </TransactionStatus>
                    </Transaction>
                )}
            </div>

            {/* Potential Payout */}
            <div
                className="flex justify-between items-center w-full max-w-[361px] rounded-2xl"
                style={{
                    background: "linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(27, 245, 176, 0.12) 100%)",
                    padding: "clamp(8px, 2vh, 12px) clamp(12px, 3vw, 16px)",
                }}
            >
                <span className="font-display text-white" style={{ fontSize: "clamp(10px, 2vw, 12px)", opacity: 0.5 }}>
                    Potential payout
                </span>
                <span className="font-body" style={{ fontSize: "clamp(18px, 4vw, 22px)", color: "#14B985" }}>
                    ${potentialPayout}
                </span>
            </div>
        </>
    );
}

// Success Content (after purchase)
function SuccessContent({
    username,
    userAvatar,
    prizePool,
    theme,
    themeIcon,
    onClose,
}: {
    username: string;
    userAvatar?: string;
    prizePool: number;
    theme: string;
    themeIcon?: string;
    onClose: () => void;
}) {
    return (
        <>
            {/* Title */}
            <div className="flex flex-col items-center w-full pt-4" style={{ gap: "8px" }}>
                <h2
                    className="font-body text-white text-center"
                    style={{ fontSize: "clamp(18px, 4vw, 22px)", lineHeight: "92%", letterSpacing: "-0.03em" }}
                >
                    WAFFLE SECURED!
                </h2>
                <p
                    className="font-display text-center"
                    style={{ fontSize: "16px", color: "#99A0AE", letterSpacing: "-0.03em" }}
                >
                    You're in!
                </p>
            </div>

            {/* Golden Card */}
            <div
                className="relative w-full max-w-[361px] rounded-2xl p-4"
                style={{
                    background: "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 201, 49, 0.12) 100%)",
                    border: "1px solid rgba(255, 201, 49, 0.4)",
                    minHeight: "clamp(120px, 20vh, 151px)",
                }}
            >
                {/* User Row */}
                <div className="flex items-center gap-2.5 mb-4">
                    <div
                        className="rounded-full bg-gray-400 shrink-0 overflow-hidden"
                        style={{ width: "clamp(44px, 8vw, 54px)", height: "clamp(44px, 8vw, 54px)" }}
                    >
                        {userAvatar && (
                            <Image src={userAvatar} alt={username} width={54} height={54} className="w-full h-full object-cover" />
                        )}
                    </div>
                    <div>
                        <p className="font-body text-white" style={{ fontSize: "clamp(18px, 4vw, 23px)", lineHeight: "130%" }}>
                            {username.toUpperCase()}
                        </p>
                        <p className="font-display" style={{ fontSize: "14px", color: "#99A0AE", letterSpacing: "-0.03em" }}>
                            has joined the next game
                        </p>
                    </div>
                </div>

                {/* Info Row */}
                <div className="flex items-center gap-3">
                    {/* Prize Pool */}
                    <div className="flex items-center gap-2">
                        <Image src="/images/illustrations/money-stack.svg" alt="prize" width={28} height={28} className="object-contain" />
                        <div>
                            <p className="font-display text-[11px]" style={{ color: "#99A0AE" }}>Prize pool</p>
                            <p className="font-body text-white text-[17px]">${prizePool.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Theme */}
                    <div className="flex items-center gap-2">
                        {themeIcon && <Image src={themeIcon} alt={theme} width={28} height={28} className="object-contain" />}
                        <div>
                            <p className="font-display text-[11px]" style={{ color: "#99A0AE" }}>Theme</p>
                            <p className="font-body text-white text-[17px]">{theme.toUpperCase()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Share Button */}
            <button
                className="flex items-center justify-center w-full max-w-[361px] bg-white rounded-xl"
                style={{
                    height: "clamp(44px, 8vh, 54px)",
                    borderWidth: "0px 5px 5px 0px",
                    borderStyle: "solid",
                    borderColor: "#FFC931",
                    borderRadius: "12px",
                }}
                onClick={() => notify.info("Share feature coming soon!")}
            >
                <span className="font-body uppercase" style={{ fontSize: "clamp(20px, 4vw, 26px)", color: "#EFB20A", letterSpacing: "-0.02em" }}>
                    SHARE TICKET
                </span>
            </button>

            {/* Bottom Row: SET REMINDER + BACK TO HOME */}
            <div className="flex w-full max-w-[361px] gap-3" style={{ height: "45px" }}>
                {/* Set Reminder */}
                <button
                    className="flex-1 flex items-center justify-center rounded-xl"
                    style={{
                        background: "rgba(255, 255, 255, 0.09)",
                        border: "2px solid rgba(255, 255, 255, 0.4)",
                    }}
                    onClick={() => notify.info("Reminder set!")}
                >
                    <span className="font-body uppercase text-white" style={{ fontSize: "18px", letterSpacing: "-0.02em" }}>
                        SET REMINDER
                    </span>
                </button>

                {/* Back to Home */}
                <button
                    className="flex-1 flex items-center justify-center rounded-xl"
                    style={{
                        background: "rgba(255, 255, 255, 0.09)",
                        border: "2px solid rgba(255, 255, 255, 0.4)",
                    }}
                    onClick={onClose}
                >
                    <span className="font-body uppercase text-white" style={{ fontSize: "18px", letterSpacing: "-0.02em" }}>
                        BACK TO HOME
                    </span>
                </button>
            </div>
        </>
    );
}

// ========== MAIN MODAL ==========

export function BuyTicketModal({
    isOpen,
    onClose,
    gameId,
    theme,
    themeIcon,
    tierPrices,
    prizePool = 0,
    username = "Player",
    userAvatar,
    onPurchaseSuccess,
}: BuyTicketModalProps) {
    const { address, isConnected } = useAccount();
    const [selectedTier, setSelectedTier] = useState(0);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [purchaseComplete, setPurchaseComplete] = useState(false);

    // Generate tiers from tierPrices prop with gradients
    const tiers = tierPrices.map((price, index) => ({
        price,
        ...TIER_GRADIENTS[index % TIER_GRADIENTS.length],
    }));

    const selectedPrice = tiers[selectedTier]?.price ?? tierPrices[0] ?? 0;
    const potentialPayout = Math.round(selectedPrice * 21.1);

    // Contract reads
    const { data: balance } = useTokenBalance(address);
    const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(address);
    const { data: hasTicket, refetch: refetchHasTicket } = useHasTicket(
        gameId ? BigInt(gameId) : undefined,
        address
    );

    // Derived state
    const priceInUnits = parseUnits(selectedPrice.toString(), TOKEN_CONFIG.decimals);
    const hasEnoughBalance = balance !== undefined && balance >= priceInUnits;
    const needsApproval = allowance === undefined || allowance < priceInUnits;
    const isDataReady = !!address && balance !== undefined && allowance !== undefined && hasTicket !== undefined;

    // Build transaction calls
    const calls = useMemo(() => {
        if (!address || !isDataReady || hasTicket || purchaseComplete) return [];

        const buyCall = {
            to: WAFFLE_GAME_CONFIG.address as `0x${string}`,
            data: encodeFunctionData({
                abi: waffleGameAbi,
                functionName: "buyTicket",
                args: [BigInt(gameId), priceInUnits],
            }),
        };

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
    const handleOnStatus = useCallback(async (status: LifecycleStatus) => {
        if (status.statusName === "success") {
            const receipts = status.statusData?.transactionReceipts;
            const hash = receipts?.[receipts.length - 1]?.transactionHash;
            if (hash) {
                setTxHash(hash);
                setPurchaseComplete(true);
            }
        }
        if (status.statusName === "error") {
            notify.error("Transaction failed. Please try again.");
        }
    }, []);

    // Sync with backend after successful transaction
    useEffect(() => {
        if (!txHash || isSyncing) return;

        async function syncWithBackend() {
            setIsSyncing(true);
            try {
                for (let i = 0; i < 5; i++) {
                    const { data: hasTicketNow } = await refetchHasTicket();
                    if (hasTicketNow) break;
                    await new Promise((r) => setTimeout(r, 1500));
                }

                const res = await sdk.quickAuth.fetch(`/api/v1/games/${gameId}/entry`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ txHash }),
                });

                if (res.ok) {
                    notify.success("Ticket purchased successfully!");
                } else {
                    notify.info("Ticket purchased! Refresh to see it.");
                }
                onPurchaseSuccess?.();
            } catch {
                notify.success("Ticket purchased!");
                onPurchaseSuccess?.();
            } finally {
                setIsSyncing(false);
                refetchAllowance();
                refetchHasTicket();
            }
        }

        syncWithBackend();
    }, [txHash, gameId, refetchHasTicket, refetchAllowance, isSyncing, onPurchaseSuccess]);

    const getButtonText = useCallback(() => {
        if (hasTicket || purchaseComplete) return "ALREADY PURCHASED";
        if (!isConnected) return "CONNECT WALLET";
        if (!isDataReady) return "LOADING...";
        if (!hasEnoughBalance) return "INSUFFICIENT USDC";
        if (isSyncing) return "SYNCING...";
        return "BUY WAFFLE";
    }, [hasTicket, purchaseComplete, isConnected, isDataReady, hasEnoughBalance, isSyncing]);

    const isDisabled = Boolean(hasTicket || purchaseComplete || !isConnected || !hasEnoughBalance || isSyncing || !isDataReady || calls.length === 0);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

            {/* Modal */}
            <div
                className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[20px] overflow-hidden"
                style={{ background: "linear-gradient(180deg, #1E1E1E 0%, #000000 100%)", maxHeight: "85dvh" }}
            >
                {/* Header with Grabber */}
                <div
                    className="flex justify-center items-center shrink-0 w-full"
                    style={{
                        height: "clamp(48px, 8vh, 60px)",
                        padding: "2px 2px 12px",
                        background: "#191919",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                    }}
                >
                    <div
                        className="w-9 h-[5px] rounded-full cursor-pointer"
                        style={{ background: "rgba(255, 255, 255, 0.4)" }}
                        onClick={onClose}
                    />
                </div>

                {/* Content */}
                <div
                    className="flex-1 flex flex-col items-center px-4 overflow-y-auto"
                    style={{ paddingBottom: "clamp(16px, 4vh, 32px)", gap: "clamp(12px, 3vh, 20px)" }}
                >
                    {purchaseComplete ? (
                        <SuccessContent
                            username={username}
                            userAvatar={userAvatar}
                            prizePool={prizePool}
                            theme={theme}
                            themeIcon={themeIcon}
                            onClose={onClose}
                        />
                    ) : (
                        <PurchaseContent
                            theme={theme}
                            themeIcon={themeIcon}
                            tiers={tiers}
                            selectedTier={selectedTier}
                            setSelectedTier={setSelectedTier}
                            potentialPayout={potentialPayout}
                            isDisabled={isDisabled}
                            getButtonText={getButtonText}
                            calls={calls}
                            handleOnStatus={handleOnStatus}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
