"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import sdk from "@farcaster/miniapp-sdk";

import { useGameStore, selectGame, selectEntry, selectPhase, selectOnlineCount } from "@/lib/game-store";
import { getGamePhase, formatCountdown, formatPrizePool, formatPlayerCount } from "@/lib/game-utils";
import { useCountdown } from "@/hooks/useCountdown";
import { useLive } from "@/hooks/useLive";

import { BottomNav } from "@/components/BottomNav";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { Clock } from "@/components/icons";

import { GameChat } from "./_components/GameChat";
import { LiveEventFeed } from "./_components/LiveEventFeed";
import { PastGamesCard } from "./_components/PastGamesCard";
import { GameActionButton } from "./_components/GameActionButton";

import type { GamePageData, PastGameData } from "./page";

// ==========================================
// PROPS
// ==========================================

interface GameHubProps {
    game: GamePageData | null;
    pastGames: PastGameData[];
    partyToken: string | null;
}

// ==========================================
// COMPONENT
// ==========================================

export function GameHub({ game, pastGames, partyToken }: GameHubProps) {
    const { context } = useMiniKit();
    const router = useRouter();
    const fid = context?.user?.fid;

    // Access control state
    const [isCheckingAccess, setIsCheckingAccess] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);

    // Initialize store with server data
    const { setGame, setPhase, setEntry } = useGameStore.getState();

    // Check user access on mount
    useEffect(() => {
        async function checkAccess() {
            if (!fid) {
                // No FID yet, wait for context
                return;
            }

            try {
                const res = await sdk.quickAuth.fetch("/api/v1/me");
                if (res.ok) {
                    const userData = await res.json();
                    if (!userData.hasGameAccess || userData.isBanned) {
                        // User does not have access, redirect to redeem
                        router.replace("/redeem");
                        return;
                    }
                    setHasAccess(true);
                } else if (res.status === 401 || res.status === 404) {
                    // User not found or not authenticated, redirect to redeem
                    router.replace("/redeem");
                    return;
                }
            } catch (error) {
                console.error("Error checking access:", error);
                router.replace("/redeem");
                return;
            } finally {
                setIsCheckingAccess(false);
            }
        }

        checkAccess();
    }, [fid, router]);


    useEffect(() => {
        if (game) {
            setGame({
                id: game.id,
                title: game.title,
                theme: game.theme,
                coverUrl: game.coverUrl,
                startsAt: game.startsAt,
                endsAt: game.endsAt,
                ticketPrice: game.ticketPrice,
                prizePool: game.prizePool,
                playerCount: game.playerCount,
                maxPlayers: game.maxPlayers,
            });
            setPhase(getGamePhase(game));
        }
    }, [game, setGame, setPhase]);

    // Fetch user's entry
    useEffect(() => {
        if (!fid || !game) return;

        async function fetchEntry() {
            try {
                const res = await sdk.quickAuth.fetch(`/api/v1/games/${game!.id}/entry`);
                if (res.ok) {
                    const data = await res.json();
                    setEntry({
                        id: data.id,
                        score: data.score,
                        answered: data.answered,
                        paidAt: data.paidAt ? new Date(data.paidAt) : null,
                        rank: data.rank,
                        prize: data.prize,
                    });
                } else {
                    setEntry(null);
                }
            } catch {
                setEntry(null);
            }
        }

        fetchEntry();
    }, [fid, game, setEntry]);

    // Real-time connection
    useLive({
        gameId: game?.id ?? 0,
        token: partyToken ?? "",
        enabled: !!game && !!partyToken,
    });

    // Selectors
    const phase = useGameStore(selectPhase);
    const entry = useGameStore(selectEntry);
    const onlineCount = useGameStore(selectOnlineCount);

    // Countdown
    const targetMs = game?.startsAt.getTime() ?? 0;
    const { seconds: countdown, isComplete: hasStarted } = useCountdown(targetMs);

    // Derived state
    const isLive = phase === "LIVE";
    const hasEntry = entry !== null;
    const isEmpty = !game || phase === "ENDED";

    // Formatted values
    const formattedPrize = game ? formatPrizePool(game.prizePool) : "$0";
    const formattedPlayers = game ? formatPlayerCount(game.playerCount) : "0 players";

    // Status text
    const statusText = useMemo(() => {
        if (!game) return "NO UPCOMING GAMES";
        if (phase === "ENDED") return "GAME ENDED";
        if (phase === "LIVE") return "GAME IS LIVE";
        return "NEXT GAME STARTS IN";
    }, [game, phase]);

    // ==========================================
    // RENDER: Access Check Loading
    // ==========================================

    if (isCheckingAccess || !hasAccess) {
        return (
            <>
                <main className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
                    <WaffleLoader />
                    <p className="text-white/50 mt-4 text-sm">Verifying access...</p>
                </main>
                <BottomNav />
            </>
        );
    }

    // ==========================================
    // RENDER: Empty State
    // ==========================================

    if (isEmpty) {
        return (
            <>
                <section className="flex-1 overflow-y-auto px-4 py-2">
                    <div className="flex flex-col items-center justify-center gap-6 py-16">
                        <div className="text-center space-y-2">
                            <h2 className="text-white font-body text-2xl">NO GAMES YET</h2>
                            <p className="text-white/50 font-display text-sm max-w-[280px]">
                                New games are coming soon. Check back later!
                            </p>
                        </div>

                        {pastGames.length > 0 && (
                            <div className="w-full mt-4">
                                <PastGamesCard games={pastGames} />
                            </div>
                        )}
                    </div>
                </section>
                <BottomNav />
            </>
        );
    }

    // ==========================================
    // RENDER: Active Game
    // ==========================================

    return (
        <>
            <section className="flex-1 overflow-y-auto px-4 py-2">
                <div className="space-y-4">
                    {/* Hero Image */}
                    <div className="flex justify-center py-6">
                        <Image
                            src="/images/hero-image.png"
                            alt="Waffles"
                            width={180}
                            height={120}
                            className="object-contain"
                            priority
                        />
                    </div>

                    {/* Status Section */}
                    <div className="flex flex-col items-center gap-3 py-2">
                        <div className="flex items-center gap-2">
                            <Clock className="w-6 h-6" aria-label="Countdown" />
                            <span className="text-white font-body text-lg tracking-tight">
                                {statusText}
                            </span>
                        </div>

                        {/* Countdown / Live Button */}
                        {!isLive ? (
                            <div className="border-2 border-(--color-neon-pink) rounded-full px-6 py-2">
                                <span className="text-(--color-neon-pink) font-body text-xl tracking-wide">
                                    {formatCountdown(countdown)}
                                </span>
                            </div>
                        ) : (
                            <GameActionButton
                                href={hasEntry ? `/game/play` : `/game/buy`}
                                variant="wide"
                            >
                                {hasEntry ? "START" : "GET TICKET"}
                            </GameActionButton>
                        )}
                    </div>

                    {/* Stats Row */}
                    <div className="flex justify-center gap-8 py-4">
                        <div className="text-center">
                            <p className="text-white/50 font-display text-sm">PRIZE POOL</p>
                            <p className="text-white font-body text-2xl">{formattedPrize}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-white/50 font-display text-sm">PLAYERS</p>
                            <p className="text-white font-body text-2xl">{game.playerCount}/{game.maxPlayers}</p>
                        </div>
                        {onlineCount > 0 && (
                            <div className="text-center">
                                <p className="text-white/50 font-display text-sm">ONLINE</p>
                                <p className="text-white font-body text-2xl">{onlineCount}</p>
                            </div>
                        )}
                    </div>

                    {/* Buy Button (when scheduled) */}
                    {!isLive && (
                        <div className="flex justify-center py-4">
                            <Link
                                href="/game/buy"
                                className="relative px-8 py-3 text-black font-body text-lg tracking-wide bg-white rounded-full 
                         shadow-lg hover:shadow-xl transition-shadow
                         after:absolute after:bottom-[-4px] after:left-0 after:right-0 
                         after:h-1 after:bg-(--color-neon-cyan) after:rounded-full"
                            >
                                BUY WAFFLE ${game.ticketPrice.toFixed(0)}
                            </Link>
                        </div>
                    )}

                    {/* Past Games */}
                    {pastGames.length > 0 && <PastGamesCard games={pastGames} />}

                    {/* Live Event Feed */}
                    <LiveEventFeed />
                </div>
            </section>

            {/* Chat Drawer */}
            <GameChat gameId={game.id} />

            <BottomNav />
        </>
    );
}
