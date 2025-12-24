"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useAccount, useConnect } from "wagmi";
import { farcasterFrame } from "@farcaster/miniapp-wagmi-connector";

import { useTicketPurchase, getPurchaseButtonText } from "@/hooks/useTicketPurchase";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { CHAIN_CONFIG } from "@/lib/contracts/config";

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
    onchainId,
    onPurchaseSuccess,
}: {
    spots: number;
    prizePool: number;
    price: number;
    maxPlayers: number;
    gameId: number;
    onchainId: `0x${string}` | null;
    onPurchaseSuccess?: () => void;
}) => {
    const { isConnected } = useAccount();
    const { connect } = useConnect();

    // Use consolidated hook
    const {
        state,
        step,
        purchase,
        isLoading,
        hasTicket,
    } = useTicketPurchase(gameId, onchainId, price, onPurchaseSuccess);

    // Derived state
    const isSoldOut = spots <= 0;

    // Auto-connect with Farcaster connector
    useEffect(() => {
        if (!isConnected) {
            connect({
                connector: farcasterFrame(),
                chainId: CHAIN_CONFIG.chain.id
            });
        }
    }, [isConnected, connect]);

    // Determine button state
    const getButtonText = () => {
        if (isSoldOut) return "SOLD OUT";
        if (hasTicket || state.step === "success") return "ALREADY PURCHASED";
        return getPurchaseButtonText(step, price);
    };

    const isDisabled =
        isSoldOut ||
        hasTicket ||
        state.step === "success" ||
        isLoading ||
        !onchainId;

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

            {/* Buy Button */}
            <div className="w-full">
                <FancyBorderButton
                    onClick={purchase}
                    disabled={Boolean(isDisabled)}
                    className="w-full"
                >
                    {getButtonText()}
                </FancyBorderButton>
            </div>

            {/* Error message */}
            {state.step === "error" && state.error && (
                <p className="text-red-400 text-sm text-center">{state.error}</p>
            )}
        </div>
    );
};
