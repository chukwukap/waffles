"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import sdk from "@farcaster/miniapp-sdk";
import { cn } from "@/lib/utils";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { notify } from "@/components/ui/Toaster";
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

    const [payload, setPayload] = useState<GameDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isClaiming, setIsClaiming] = useState(false);
    const [localClaimedAt, setLocalClaimedAt] = useState<Date | null>(null);

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
                const { fid } = userData;

                // Fetch game history for this specific game
                const gamesRes = await sdk.quickAuth.fetch("/api/v1/me/games");
                if (!gamesRes.ok) {
                    throw new Error("Failed to fetch games");
                }

                const gamesData = await gamesRes.json();
                const gameData = gamesData.games?.find((g: { id: number }) => g.id === gameId);

                if (gameData) {
                    setPayload({
                        gameId: gameData.id,
                        gameTitle: gameData.title,
                        gameTheme: gameData.theme,
                        playerScore: gameData.score,
                        playerRank: gameData.rank || 0,
                        playerWinnings: gameData.winnings || 0,
                        claimedAt: gameData.claimedAt ? new Date(gameData.claimedAt) : null,
                        userInfo: {
                            username: userData.username || `User ${fid}`,
                            pfpUrl: userData.pfpUrl || "/images/default-avatar.png",
                        },
                    });
                } else {
                    // Game not found in history
                    router.push("/profile/history");
                    return;
                }
            } catch (error) {
                console.error("Error fetching game details:", error);
                notify.error("Failed to load game details");
            } finally {
                setIsLoading(false);
            }
        }

        fetchDetails();
    }, [gameId, router]);

    if (isLoading || !payload) {
        return (
            <>
                <div className="flex-1 flex items-center justify-center">
                    <WaffleLoader text="LOADING..." />
                </div>
                <BottomNav />
            </>
        );
    }

    // Logic to determine if prize is claimed
    const isClaimed = !!payload.claimedAt || !!localClaimedAt;
    const hasWinnings = payload.playerWinnings > 0;
    const isEligibleToClaim = hasWinnings && !isClaimed;

    // Handler
    const handleClaim = async () => {
        setIsClaiming(true);
        try {
            const res = await sdk.quickAuth.fetch("/api/v1/prizes/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId: payload.gameId }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to claim prize");
            }

            const data = await res.json();
            setLocalClaimedAt(new Date(data.claimedAt));
            notify.success("Prize Claimed!");
            router.refresh();
        } catch (error) {
            console.error("Claim error:", error);
            notify.error(error instanceof Error ? error.message : "Failed to claim prize");
        } finally {
            setIsClaiming(false);
        }
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

                {/* Your Performance */}
                <section className="w-full space-y-4 mb-8">
                    <h2 className="text-[18px] font-display font-medium text-[#99A0AE] tracking-tight">
                        YOUR PERFORMANCE
                    </h2>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-4 bg-[#FFFFFF0A] border border-[#FFFFFF14] rounded-2xl">
                            <span className="text-[#99A0AE] font-display font-medium">Score</span>
                            <span className="text-white font-body text-[24px]">
                                {payload.playerScore.toLocaleString()}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[#FFFFFF0A] border border-[#FFFFFF14] rounded-2xl">
                            <span className="text-[#99A0AE] font-display font-medium">Rank</span>
                            <span className="text-white font-body text-[24px]">
                                #{payload.playerRank}
                            </span>
                        </div>

                        {hasWinnings && (
                            <WinningsCard
                                winnings={payload.playerWinnings}
                                score={payload.playerScore}
                                rank={payload.playerRank}
                                username={payload.userInfo.username}
                                pfpUrl={payload.userInfo.pfpUrl}
                            />
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
                            className={cn(
                                "h-[52px]",
                                isClaiming && "opacity-70"
                            )}
                        >
                            {isClaiming ? (
                                <Spinner className="w-5 h-5" />
                            ) : (
                                "CLAIM PRIZE"
                            )}
                        </FancyBorderButton>
                    </div>
                )}
            </main>
            <BottomNav />
        </>
    );
}