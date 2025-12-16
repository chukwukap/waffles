import { cache } from "react";
import { Metadata } from "next";
import { prisma } from "@/lib/db";
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
// DATA TYPES
// ==========================================

export interface GamePageData {
  id: number;
  title: string;
  theme: string;
  coverUrl: string | null;
  startsAt: Date;
  endsAt: Date;
  ticketPrice: number;
  prizePool: number;
  playerCount: number;
  maxPlayers: number;
  questionCount: number;
}

export interface PastGameData {
  id: number;
  title: string;
  theme: string;
  playerCount: number;
  prizePool: number;
  endsAt: Date;
}

// ==========================================
// DATA FETCHING
// ==========================================

/**
 * Fetch active game (live or next scheduled).
 * Uses pre-computed counters - no COUNT queries.
 */
const getActiveGame = cache(async (): Promise<GamePageData | null> => {
  const game = await prisma.game.findFirst({
    where: getActiveGameWhere(),
    orderBy: getActiveGameOrderBy(),
    select: {
      id: true,
      title: true,
      theme: true,
      coverUrl: true,
      startsAt: true,
      endsAt: true,
      ticketPrice: true,
      prizePool: true,
      playerCount: true,
      maxPlayers: true,
      _count: { select: { questions: true } },
    },
  });

  if (!game) return null;

  return {
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
    questionCount: game._count.questions,
  };
});

/**
 * Fetch recent past games.
 */
const getPastGames = cache(async (): Promise<PastGameData[]> => {
  const now = new Date();

  const games = await prisma.game.findMany({
    where: { endsAt: { lt: now } },
    orderBy: { endsAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      theme: true,
      playerCount: true,
      prizePool: true,
      endsAt: true,
    },
  });

  return games;
});

/**
 * Generate PartyKit auth token for the user.
 * This is called server-side so user doesn't need another fetch.
 */
async function generatePartyToken(gameId: number): Promise<string> {
  // For now, return a simple token
  // In production, this should be a signed JWT
  return Buffer.from(JSON.stringify({
    gameId,
    exp: Date.now() + 1000 * 60 * 60, // 1 hour
  })).toString("base64");
}

// ==========================================
// PAGE COMPONENT
// ==========================================

export default async function GamePage() {
  // Parallel fetches for speed
  const [game, pastGames] = await Promise.all([
    getActiveGame(),
    getPastGames(),
  ]);

  // Generate PartyKit token if there's an active game
  const partyToken = game ? await generatePartyToken(game.id) : null;

  return (
    <GameHub
      game={game}
      pastGames={pastGames}
      partyToken={partyToken}
    />
  );
}

// Force dynamic rendering for real-time data
export const dynamic = "force-dynamic";
