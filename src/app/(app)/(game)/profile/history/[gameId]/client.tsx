"use client";

import { useState, useEffect, useActionState, startTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import sdk from "@farcaster/miniapp-sdk";
import { cn } from "@/lib/utils";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { claimPrizeAction, ClaimPrizeResult } from "@/actions/prize";
import { notify } from "@/components/ui/Toaster";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { BottomNav } from "@/components/BottomNav";
import WinningsCard from "../../../game/[gameId]/_component/WinningsCard";

interface GameDetails {
    gameId: number;
    gameTitle: string;
    gameTheme: string;
    playerScore: number;
    playerRank: number;
    playerWinnings: number;
    claimedAt: Date | null;
    userInfo: {
        username: string;
        pfpUrl: string;
    };
}

export default function GameDetailsClient({
    gameId,
}: {
    gameId: number;
}) {
    const router = useRouter();
    const { signIn } = useAuth();

    const [payload, setPayload] = useState<GameDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [clientFid, setClientFid] = useState(0);

    // Server Action State for Claiming
    const [state, action, isPending] = useActionState<ClaimPrizeResult, FormData>(
        claimPrizeAction,
        { success: false, error: "" }
    );

    // Fetch game details on mount
    useEffect(() => {
        async function fetchDetails() {
            if (isNaN(gameId)) {
                router.push("/profile");
                return;
            }

            try {
                // Fetch user profile
                const userRes = await sdk.quickAuth.fetch("/api/v1/me");
                if (!userRes.ok) {
                    if (userRes.status === 401) {
                        router.push("/invite");
                        return;
                    }
                    throw new Error("Failed to fetch user");
                }
                const userData = await userRes.json();
                setClientFid(userData.fid);

                // Fetch user's game history to find this game
                const gamesRes = await sdk.quickAuth.fetch("/api/v1/me/games");
                if (!gamesRes.ok) {
                    throw new Error("Failed to fetch games");
                }
                const gamesData = await gamesRes.json();

                // Find the specific game
                const game = gamesData.find((g: any) => g.gameId === gameId);
                if (!game) {
                    setPayload(null);
                    setIsLoading(false);
                    return;
                }

                setPayload({
                    gameId: game.gameId,
                    gameTitle: game.game?.title ?? "Game",
                    gameTheme: game.game?.theme ?? "trivia",
                    playerScore: game.score ?? 0,
                    playerRank: game.rank ?? 0,
                    playerWinnings: game.rank === 1 ? 50 : 0,
                    claimedAt: game.claimedAt,
                    userInfo: {
                        username: userData.username ?? "Player",
                        pfpUrl: userData.pfpUrl ?? "/images/avatars/a.png",
                    },
                });
            } catch (error) {
                console.error("Error fetching game details:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDetails();
    }, [gameId, router]);

    // Handle Action Responses
    useEffect(() => {
        if (state.success) {
            notify.success("Prize claimed successfully!");
        } else if (state.error) {
            notify.error(state.error);
        }
    }, [state]);

    if (isLoading) {
        return (
            <>
                <div className="flex-1 flex items-center justify-center">
                    <WaffleLoader text="LOADING DETAILS..." />
                </div>
                <BottomNav />
            </>
        );
    }

    if (!payload) {
        return (
            <>
                <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-white/60 font-display">
                    Game details not available.
                </div>
                <BottomNav />
            </>
        );
    }

    // Logic to determine if prize is claimed
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
        <>
            <main className="flex-1 overflow-y-auto px-4 pt-8 pb-24 flex flex-col items-center animate-up">
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
                            {payload.gameTitle.toUpperCase()}
                        </h1>
                        <p className="text-[#99A0AE] text-[18px] font-display font-medium capitalize tracking-tight">
                            {payload.gameTheme.replace(/_/g, " ").toLowerCase()}
                        </p>
                    </div>
                </div>

                {/* Winnings Card */}
                <WinningsCard
                    winnings={payload.playerWinnings}
                    score={payload.playerScore}
                    rank={payload.playerRank}
                    pfpUrl={payload.userInfo.pfpUrl}
                    username={payload.userInfo.username}
                    className="mb-8"
                />

                {/* Interaction Area */}
                <div className="w-full max-w-lg flex flex-col items-center gap-4">
                    {isClaimed ? (
                        <div className="flex items-center gap-2 py-4 animate-in fade-in zoom-in duration-300">
                            <div className="text-[#FFC931]">
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
                        <FancyBorderButton
                            onClick={handleClaim}
                            disabled={isPending}
                            className={cn(
                                "h-[64px] text-[24px]",
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
                        <p className="font-display text-sm text-muted mt-4">
                            Better luck next time!
                        </p>
                    )}
                </div>
            </main>
            <BottomNav />
        </>
    );
}