"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import sdk from "@farcaster/miniapp-sdk";

import { useGameStore, selectPhase, selectEntry, selectOnlineCount } from "@/lib/game-store";
import { getGamePhase } from "@/lib/game-utils";
import { useTimer } from "@/hooks/useTimer";
import { useLive } from "@/hooks/useLive";
import { BottomNav } from "@/components/BottomNav";
import { WaffleLoader } from "@/components/ui/WaffleLoader";

import { GameChat } from "./_components/chat/GameChat";
import { LiveEventFeed } from "./_components/LiveEventFeed";
import { PastGamesCard } from "./_components/PastGamesCard";
import { NextGameCard } from "./_components/NextGameCard";
import { CheerOverlay } from "./_components/CheerOverlay";

import type { GamePageData, PastGameData } from "./page";

// ==========================================
// PROPS
// ==========================================

interface GameHubProps {
    game: GamePageData | null;
    pastGames: PastGameData[];
}

// ==========================================
// COMPONENT
// ==========================================

export function GameHub({ game, pastGames }: GameHubProps) {
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
                        router.replace("/redeem");
                        return;
                    }
                    setHasAccess(true);
                } else if (res.status === 401 || res.status === 404) {
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
                tierPrices: game.tierPrices,
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

    // Real-time connection (token fetched internally by useLive)
    useLive({
        gameId: game?.id ?? 0,
        enabled: !!game && hasAccess,
    });

    // Selectors
    const phase = useGameStore(selectPhase);
    const entry = useGameStore(selectEntry);

    // Countdown - uses target timestamp
    const targetMs = game?.startsAt.getTime() ?? 0;
    const countdown = useTimer(targetMs);

    // Derived state from phase (no need to calculate manually)
    const isLive = phase === "LIVE";
    const hasEnded = phase === "ENDED";
    const isEmpty = !game;

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
    // RENDER: Active Game (Original UI)
    // ==========================================

    return (
        <>
            <section className="flex-1 flex flex-col justify-center items-center overflow-hidden px-4 py-4">
                <NextGameCard
                    gameId={game.id}
                    theme={game.theme}
                    themeIcon={game.coverUrl ?? undefined}
                    tierPrices={game.tierPrices}
                    countdown={countdown}
                    hasTicket={!!entry}
                    isLive={isLive}
                    hasEnded={hasEnded}
                    prizePool={game.prizePool ?? 0}
                    spotsTotal={game.maxPlayers ?? 100}
                    spotsTaken={game.playerCount ?? 0}
                />
            </section>

            {/* Live Event Feed */}
            <div className="shrink-0 w-full px-4">
                <LiveEventFeed />
            </div>

            {/* GameChat */}
            <div className="shrink-0 w-full bg-[#0E0E0E] border-t border-white/10 px-4 py-3">
                <div className="w-full max-w-lg mx-auto">
                    <GameChat />
                </div>
            </div>

            <BottomNav />
            <CheerOverlay />
        </>
    );
}
