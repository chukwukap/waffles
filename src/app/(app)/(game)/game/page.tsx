import { Metadata } from "next";
import { cache } from "react";

import { prisma, Prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { minikitConfig } from "../../../../../minikit.config";

import { BottomNav } from "@/components/BottomNav";
import { GameCard } from "./_components/GameCard";

export const metadata: Metadata = {
  title: minikitConfig.miniapp.name,
  description: minikitConfig.miniapp.description,
  other: {
    "fc:frame": JSON.stringify({
      version: minikitConfig.miniapp.version,
      imageUrl: minikitConfig.miniapp.heroImageUrl,
      button: {
        title: "Play Waffles",
        action: {
          name: "Play now",
          type: "launch_frame",
          url: `${env.rootUrl}/game`,
          splashImageUrl: minikitConfig.miniapp.splashImageUrl,
          splashBackgroundColor: minikitConfig.miniapp.splashBackgroundColor,
        },
      },
    }),
  },
};

// Game type for the lobby
export type LobbyGame = Prisma.GameGetPayload<{
  select: {
    id: true;
    title: true;
    theme: true;
    status: true;
    startsAt: true;
    endsAt: true;
    entryFee: true;
    prizePool: true;
    _count: { select: { tickets: true; players: true } };
  };
}>;

const selectFields = {
  id: true,
  title: true,
  theme: true,
  status: true,
  startsAt: true,
  endsAt: true,
  entryFee: true,
  prizePool: true,
  _count: { select: { tickets: true, players: true } },
};

// Fetch all relevant games
const getGames = cache(async () => {
  const [liveGames, scheduledGames, endedGames] = await Promise.all([
    prisma.game.findMany({
      where: { status: "LIVE" },
      orderBy: { startsAt: "desc" },
      select: selectFields,
    }),
    prisma.game.findMany({
      where: { status: "SCHEDULED" },
      orderBy: { startsAt: "asc" },
      select: selectFields,
    }),
    prisma.game.findMany({
      where: { status: "ENDED" },
      orderBy: { endsAt: "desc" },
      take: 5,
      select: selectFields,
    }),
  ]);

  return { liveGames, scheduledGames, endedGames };
});

export default async function GameLobbyPage() {
  const { liveGames, scheduledGames, endedGames } = await getGames();

  const hasLive = liveGames.length > 0;
  const hasScheduled = scheduledGames.length > 0;
  const hasEnded = endedGames.length > 0;
  const isEmpty = !hasLive && !hasScheduled && !hasEnded;

  return (
    <>
      <section className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Live Games */}
        {hasLive && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-white font-body text-lg uppercase tracking-wide">
                Live Now
              </h2>
            </div>
            <div className="space-y-3">
              {liveGames.map((game) => (
                <GameCard key={game.id} game={game} featured />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Games */}
        {hasScheduled && (
          <div className="space-y-3">
            <h2 className="text-white/70 font-body text-lg uppercase tracking-wide">
              Upcoming
            </h2>
            <div className="space-y-3">
              {scheduledGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </div>
        )}

        {/* Past Games */}
        {hasEnded && (
          <div className="space-y-3">
            <h2 className="text-white/50 font-body text-lg uppercase tracking-wide">
              Recent Games
            </h2>
            <div className="space-y-3">
              {endedGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {isEmpty && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <p className="text-white/60 font-display text-lg mb-2">
              No games available
            </p>
            <p className="text-white/40 font-display text-sm">
              Check back soon for upcoming trivia games!
            </p>
          </div>
        )}
      </section>

      <BottomNav />
    </>
  );
}

export const revalidate = 3;
