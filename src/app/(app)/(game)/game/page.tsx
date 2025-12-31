import { cache } from "react";
import { Metadata } from "next";
import { prisma, Prisma } from "@/lib/db";
import { minikitConfig } from "../../../../../minikit.config";
import { env } from "@/lib/env";
import { getActiveGameWhere, getActiveGameOrderBy } from "@/lib/game-utils";

import { GameHub } from "./client";

// ==========================================
// METADATA
// ==========================================

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

// ==========================================
// DATA TYPES - Inferred from Prisma Query
// ==========================================

const gameSelect = {
  id: true,
  onchainId: true,
  title: true,
  theme: true,
  coverUrl: true,
  startsAt: true,
  endsAt: true,
  tierPrices: true,
  prizePool: true,
  playerCount: true,
  maxPlayers: true,
  _count: { select: { questions: true } },
  entries: {
    where: { paidAt: { not: null } },
    take: 4,
    orderBy: { paidAt: "desc" as const },
    select: {
      user: {
        select: {
          username: true,
          pfpUrl: true,
        },
      },
    },
  },
} satisfies Prisma.GameSelect;

type GameQueryResult = Prisma.GameGetPayload<{ select: typeof gameSelect }>;

// Transformed type for component props
export interface GamePageData {
  id: number;
  onchainId: string | null;
  title: string;
  theme: string;
  coverUrl: string | null;
  startsAt: Date;
  endsAt: Date;
  tierPrices: number[];
  prizePool: number;
  playerCount: number;
  maxPlayers: number;
  questionCount: number;
  recentPlayers: { avatar?: string; name: string }[];
}

// ==========================================
// DATA FETCHING
// ==========================================

/**
 * Fetch active game (live or next scheduled).
 */
const getActiveGame = cache(async (): Promise<GamePageData | null> => {
  const game = await prisma.game.findFirst({
    where: getActiveGameWhere(),
    orderBy: getActiveGameOrderBy(),
    select: gameSelect,
  });

  if (!game) return null;

  return {
    id: game.id,
    onchainId: game.onchainId,
    title: game.title,
    theme: game.theme,
    coverUrl: game.coverUrl,
    startsAt: game.startsAt,
    endsAt: game.endsAt,
    tierPrices: game.tierPrices,
    prizePool: game.prizePool,
    playerCount: game.playerCount,
    maxPlayers: game.maxPlayers,
    questionCount: game._count.questions,
    recentPlayers: game.entries.map((e) => ({
      avatar: e.user.pfpUrl ?? undefined,
      name: e.user.username ?? "Player",
    })),
  };
});

// ==========================================
// PAGE COMPONENT
// ==========================================

export default async function GamePage() {
  const game = await getActiveGame();

  return <GameHub game={game} />;
}

// Force dynamic rendering for real-time data
export const dynamic = "force-dynamic";
