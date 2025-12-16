"use client";

import { useRef, useMemo } from "react";
import Image from "next/image";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

import { calculatePrizePool, formatTime } from "@/lib/utils";
import { useCountdown } from "@/hooks/useCountdown";
import { usePartyGame } from "@/hooks/usePartyGame";
import { useGameData } from "@/hooks/useGameData";
import { useUser } from "@/hooks/useUser";

import { BottomNav } from "@/components/BottomNav";
import { Clock } from "@/components/icons";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { Chat } from "./chat/Chat";
import { GameActionButton } from "./GameActionButton";
import { PlayerCountDisplay } from "./PlayerCountDisplay";
import LiveEventFeed from "./LiveEventFeed";
import { StatsRow } from "./StatsRow";
import { PastGamesCard } from "./PastGamesCard";
import InvitePageClient from "@/app/(app)/invite/client";

import type { LobbyGame } from "../page";

interface LobbyClientProps {
    nextGame: LobbyGame | null;
    pastGames: LobbyGame[];
}

/**
 * Client component for the game lobby
 * Handles auth check + real-time features: countdown, live events, chat
 */
export default function LobbyClient({ nextGame, pastGames }: LobbyClientProps) {
    // All hooks must be called unconditionally at the top
    const { user, isLoading, refetch } = useUser();
    const { context } = useMiniKit();
    const fid = context?.user?.fid;

    const { ticket, mutuals } = useGameData(fid, nextGame?.id ?? undefined);

    const { onlineCount, messages, events, sendChat } = usePartyGame({
        gameId: nextGame?.id?.toString() ?? "",
        enabled: !!nextGame && user?.hasGameAccess === true,
    });

    const startMs = nextGame?.startsAt.getTime() ?? 0;
    const endMs = nextGame?.endsAt.getTime() ?? 0;

    const initialSeconds = useMemo(() => {
        if (!nextGame) return 0;
        const sec = (startMs - Date.now()) / 1000;
        return Math.max(0, sec);
    }, [startMs, nextGame]);

    const hasFired = useRef(false);
    const countdown = useCountdown(initialSeconds, () => {
        if (!hasFired.current) hasFired.current = true;
    });

    // Derived state
    const now = Date.now();
    const hasStarted = nextGame && now >= startMs && now < endMs;
    const hasEnded = nextGame && now >= endMs;

    const prizePool = nextGame
        ? calculatePrizePool({
            ticketsNum: nextGame._count.tickets,
            ticketPrice: nextGame.entryFee,
            additionPrizePool: nextGame.prizePool,
        })
        : 0;

    const formattedPrize = `$${prizePool.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;

    const formattedPastGames = pastGames.map((game) => ({
        id: game.id,
        title: game.title,
        playerCount: game._count.players,
        prizePool: calculatePrizePool({
            ticketsNum: game._count.tickets,
            ticketPrice: game.entryFee,
            additionPrizePool: game.prizePool,
        }),
    }));

    const getStatusText = () => {
        if (!nextGame) return "NO UPCOMING GAMES";
        if (hasEnded) return "GAME ENDED";
        if (hasStarted) return "GAME IS LIVE";
        return "NEXT GAME STARTS IN";
    };

    const entryFee = nextGame?.entryFee ?? 0;
    const buyButtonText = `BUY WAFFLE $${entryFee.toFixed(0)}`;
    const isEmpty = !nextGame || hasEnded;

    // Auth check - show invite form if no game access (after all hooks)
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <WaffleLoader text="LOADING..." />
            </div>
        );
    }

    if (!user?.hasGameAccess || user?.isBanned) {
        return <InvitePageClient onSuccess={refetch} />;
    }

    return (
        <>
            <section className="flex-1 overflow-y-auto px-4 py-2">
                {isEmpty ? (
                    /* Clean Empty State */
                    <div className="flex flex-col items-center justify-center gap-6 py-16">
                        <div className="text-center space-y-2">
                            <h2 className="text-white font-body text-2xl">
                                NO GAMES YET
                            </h2>
                            <p className="text-white/50 font-display text-sm max-w-[280px]">
                                New games are coming soon. Check back later!
                            </p>
                        </div>

                        {/* Past Games - show if available */}
                        {formattedPastGames.length > 0 && (
                            <div className="w-full mt-4">
                                <PastGamesCard games={formattedPastGames} />
                            </div>
                        )}
                    </div>
                ) : (
                    /* Active Game State */
                    <div className="space-y-4">
                        {/* Hero Waffle Image */}
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
                                    {getStatusText()}
                                </span>
                            </div>

                            {/* Countdown pill */}
                            {!hasStarted && (
                                <div className="border-2 border-(--color-neon-pink) rounded-full px-6 py-2">
                                    <span className="text-(--color-neon-pink) font-body text-xl tracking-wide">
                                        {formatTime(countdown.remaining)}
                                    </span>
                                </div>
                            )}

                            {/* Live action button */}
                            {hasStarted && (
                                <GameActionButton
                                    href={ticket ? `/game/${nextGame.id}/live` : `/game/${nextGame.id}/ticket`}
                                    backgroundColor="var(--color-neon-pink)"
                                    variant="wide"
                                    textColor="dark"
                                >
                                    {ticket ? "START" : "GET TICKET"}
                                </GameActionButton>
                            )}
                        </div>

                        {/* Stats Row */}
                        <StatsRow
                            spots={nextGame._count.players}
                            maxSpots={100}
                            prizePool={formattedPrize}
                        />

                        {/* Past Games */}
                        <PastGamesCard games={formattedPastGames} />

                        {/* Buy Button */}
                        <div className="flex justify-center py-4">
                            <a
                                href={`/game/${nextGame.id}/ticket`}
                                className="relative px-8 py-3 text-black font-body text-lg tracking-wide bg-white rounded-full 
                           shadow-lg hover:shadow-xl transition-shadow
                           after:absolute after:bottom-[-4px] after:left-0 after:right-0 
                           after:h-1 after:bg-(--color-neon-cyan) after:rounded-full"
                            >
                                {buyButtonText}
                            </a>
                        </div>

                        {/* Player Count Display */}
                        <PlayerCountDisplay
                            mutualsCount={mutuals?.totalCount ?? 0}
                            playerCount={nextGame._count.players}
                            avatars={mutuals?.mutuals ?? []}
                        />

                        {/* Live Event Feed */}
                        <LiveEventFeed
                            maxEvents={5}
                            gameId={nextGame.id}
                            initialEvents={events}
                        />
                    </div>
                )}
            </section>

            {/* Chat - only show when there's an active game */}
            {!isEmpty && (
                <Chat
                    gameId={nextGame?.id ?? null}
                    activeCount={onlineCount}
                    messages={messages}
                    onSendMessage={sendChat}
                />
            )}

            <BottomNav />
        </>
    );
}
