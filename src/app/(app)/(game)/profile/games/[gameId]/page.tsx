"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useProfile } from "../../ProfileProvider";
import { cn } from "@/lib/utils";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { notify } from "@/components/ui/Toaster";
import { Spinner } from "@/components/ui/spinner";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { BottomNav } from "@/components/BottomNav";
import { SubHeader } from "@/components/ui/SubHeader";
import { useState } from "react";

// ==========================================
// COMPONENT
// ==========================================

export default function GameDetailsPage() {
    const params = useParams<{ gameId: string }>();
    const router = useRouter();
    const { games, user, isLoading, claimPrize } = useProfile();
    const [isClaiming, setIsClaiming] = useState(false);

    const gameId = Number(params.gameId);

    if (isLoading) {
        return (
            <>
                <div className="flex-1 flex items-center justify-center">
                    <WaffleLoader text="LOADING..." />
                </div>
                <BottomNav />
            </>
        );
    }

    // Find game in context
    const game = games.find((g) => g.id === gameId);

    if (!game) {
        return (
            <>
                <SubHeader title="GAME DETAILS" />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-white/40 font-display">Game not found</p>
                </div>
                <BottomNav />
            </>
        );
    }

    const isClaimed = !!game.claimedAt;
    const hasWinnings = game.winnings > 0;
    const isEligibleToClaim = hasWinnings && !isClaimed;

    const handleClaim = async () => {
        setIsClaiming(true);
        const success = await claimPrize(gameId);
        if (success) {
            notify.success("Prize Claimed!");
        } else {
            notify.error("Failed to claim prize");
        }
        setIsClaiming(false);
    };

    return (
        <>
            <SubHeader title="GAME DETAILS" />
            <main className="flex-1 overflow-hidden px-4 pt-8 pb-24 flex flex-col items-center">
                {/* Game Header */}
                <div className="flex flex-col items-center gap-6 mb-8">
                    <div className="relative w-[200px] h-[116px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                        <Image
                            src="/images/illustrations/waffles.svg"
                            alt="Waffle"
                            fill
                            priority
                            className="object-contain"
                        />
                    </div>

                    <div className="text-center space-y-2">
                        <h1 className="font-body text-[44px] leading-[0.9] text-white tracking-[-0.03em]">
                            {game.title.toUpperCase()}
                        </h1>
                        <p className="text-[#99A0AE] text-[18px] font-display font-medium capitalize tracking-tight">
                            {game.theme.replace(/_/g, " ").toLowerCase()}
                        </p>
                    </div>
                </div>

                {/* Performance Stats */}
                <section className="w-full space-y-4 mb-8">
                    <h2 className="text-[18px] font-display font-medium text-[#99A0AE] tracking-tight">
                        YOUR PERFORMANCE
                    </h2>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-4 bg-[#FFFFFF0A] border border-[#FFFFFF14] rounded-2xl">
                            <span className="text-[#99A0AE] font-display font-medium">
                                Score
                            </span>
                            <span className="text-white font-body text-[24px]">
                                {game.score.toLocaleString()}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[#FFFFFF0A] border border-[#FFFFFF14] rounded-2xl">
                            <span className="text-[#99A0AE] font-display font-medium">
                                Rank
                            </span>
                            <span className="text-white font-body text-[24px]">
                                #{game.rank ?? "-"}
                            </span>
                        </div>

                        {hasWinnings && (
                            <div className="flex items-center justify-between p-4 bg-[#FFFFFF0A] border border-[#FFFFFF14] rounded-2xl">
                                <span className="text-[#99A0AE] font-display font-medium">
                                    Winnings
                                </span>
                                <span className="text-green-400 font-body text-[24px]">
                                    ${game.winnings}
                                </span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Claim Button */}
                {isEligibleToClaim && (
                    <div className="w-full mt-auto">
                        <FancyBorderButton
                            onClick={handleClaim}
                            disabled={isClaiming}
                            fullWidth
                            className={cn("h-[52px]", isClaiming && "opacity-70")}
                        >
                            {isClaiming ? <Spinner className="w-5 h-5" /> : "CLAIM PRIZE"}
                        </FancyBorderButton>
                    </div>
                )}

                {isClaimed && (
                    <div className="w-full mt-auto">
                        <div className="h-[52px] flex items-center justify-center bg-white/10 rounded-2xl text-white/60 font-display">
                            Prize Claimed ✓
                        </div>
                    </div>
                )}
            </main>
            <BottomNav />
        </>
    );
}