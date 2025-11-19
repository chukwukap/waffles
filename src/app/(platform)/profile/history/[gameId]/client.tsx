"use client";

import { use, useActionState, useEffect, startTransition } from "react";
import Image from "next/image";
import { GameDetailsPayload } from "./page"; // From your server component
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { cn } from "@/lib/utils";
import WinningsCard from "../../../game/[gameId]/_component/WinningsCard";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { claimPrizeAction, ClaimPrizeResult } from "@/actions/prize";
import { notify } from "@/components/ui/Toaster";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";

export default function GameDetailsClient({
    payloadPromise,
}: {
    payloadPromise: Promise<GameDetailsPayload | null>;
}) {
    const { context: miniKitContext } = useMiniKit();
    const payload = use(payloadPromise);
    const { signIn } = useAuth();

    // Server Action State for Claiming
    const [state, action, isPending] = useActionState<ClaimPrizeResult, FormData>(
        claimPrizeAction,
        { success: false, error: "" }
    );

    const clientFid = miniKitContext?.user?.fid ?? 0;

    // Handle Action Responses
    useEffect(() => {
        if (state.success) {
            notify.success("Prize claimed successfully!");
        } else if (state.error) {
            notify.error(state.error);
        }
    }, [state]);

    if (!payload) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-white/60 font-display">
                Game details not available.
            </div>
        );
    }

    // Logic to determine if prize is claimed (either from DB initially or from successful action)
    const isClaimed = !!payload.claimedAt || (state.success && !!state.claimedAt);
    const hasWinnings = payload.playerWinnings > 0;

    // Handler
    const handleClaim = async () => {
        const token = await signIn();
        if (!token) {
            notify.error("Please sign in to claim your prize.");
            return;
        }

        const formData = new FormData();
        formData.append("fid", String(clientFid));
        formData.append("gameId", String(payload.gameId));
        formData.append("authToken", token);

        startTransition(() => {
            action(formData);
        });
    };

    return (
        <main className="flex-1 overflow-y-auto px-4 pt-8 pb-24 flex flex-col items-center animate-up">

            {/* ─────────── 1. Game Header ─────────── */}
            <div className="flex flex-col items-center gap-6 mb-8">
                {/* Waffle Pixel Art */}
                <div className="relative w-[200px] h-[116px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                    <Image
                        src="/images/illustrations/waffles.svg"
                        alt="Waffle"
                        fill
                        priority
                        className="object-contain"
                    />
                </div>

                {/* Titles */}
                <div className="text-center space-y-2">
                    <h1 className="font-body text-[44px] leading-[0.9] text-white tracking-[-0.03em]">
                        {payload.gameTitle.toUpperCase()}
                    </h1>
                    <p className="text-[#99A0AE] text-[18px] font-display font-medium capitalize tracking-tight">
                        {payload.gameTheme.replace(/_/g, " ").toLowerCase()}
                    </p>
                </div>
            </div>

            {/* ─────────── 2. Winnings Card ─────────── */}
            <WinningsCard
                winnings={payload.playerWinnings}
                score={payload.playerScore}
                rank={payload.playerRank}
                pfpUrl={payload.userInfo.pfpUrl}
                username={payload.userInfo.username}
                className="mb-8"
            />

            {/* ─────────── 3. Interaction Area (Button or Status) ─────────── */}
            <div className="w-full max-w-[361px] flex flex-col items-center gap-4">

                {isClaimed ? (
                    /* STATE: CLAIMED */
                    <div className="flex items-center gap-2 py-4 animate-in fade-in zoom-in duration-300">
                        {/* Yellow trophy icon or checkmark as per mock */}
                        <div className="text-[#FFC931]">
                            {/* Using a Lucide icon as placeholder for the specific trophy icon in mock */}
                            <Image
                                src="/images/icons/trophy.svg"
                                width={20}
                                height={20}
                                alt="Claimed"
                                className="opacity-80"
                            />
                        </div>
                        <span className="font-display font-medium text-[16px] text-[#E0E0E0]/80 tracking-wide">
                            Prize claimed!
                        </span>
                    </div>

                ) : hasWinnings ? (
                    /* STATE: UNCLAIMED (Show Button) */
                    <FancyBorderButton
                        onClick={handleClaim}
                        disabled={isPending}
                        className={cn(
                            "h-[64px] text-[24px]", // Make button slightly taller for importance
                            isPending ? "opacity-90 cursor-wait" : ""
                        )}
                    >
                        {isPending ? (
                            <div className="flex items-center gap-3">
                                <Spinner className="w-6 h-6 text-[#1E1E1E] animate-spin" />
                                <span>CLAIMING...</span>
                            </div>
                        ) : (
                            "CLAIM PRIZE"
                        )}
                    </FancyBorderButton>
                ) : (
                    /* STATE: NO WINNINGS */
                    <p className="font-display text-sm text-muted mt-4">
                        Better luck next time!
                    </p>
                )}
            </div>
        </main>
    );
}