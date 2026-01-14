/**
 * Game Queries
 *
 * Server-side cached queries for fetching game data.
 * Uses React's cache() for request deduplication - multiple calls
 * in the same request will only hit the database once.
 */

import { cache } from "react";
import { prisma } from "@/lib/db";
import type { Game } from "@prisma";

// ============================================================================
// Types
// ============================================================================

export interface RecentPlayer {
  username: string;
  pfpUrl: string | null;
  timestamp: number;
}

export type GameWithQuestionCount = Game & { questionCount: number };

export interface GameQueryResult {
  game: GameWithQuestionCount | null;
  recentPlayers: RecentPlayer[];
}

// ============================================================================
// Include Config
// ============================================================================

/**
 * Prisma include config for fetching recent players and question count
 */
const gameInclude = {
  entries: {
    where: { paidAt: { not: null } },
    select: { user: { select: { pfpUrl: true, username: true } } },
    take: 10,
    orderBy: { createdAt: "desc" as const },
  },
  _count: {
    select: { questions: true },
  },
};

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch current live game, next scheduled game, or most recent ended game.
 * Priority: Live > Scheduled > Last Ended
 *
 * This function is cached per-request using React's cache().
 * Multiple components calling this in the same render will only
 * trigger one database query.
 *
 * @returns Game with question count and recent players for avatar display
 */
export const getCurrentOrNextGame = cache(
  async (): Promise<GameQueryResult> => {
    const now = new Date();

    // First try to get current live or upcoming game
    const activeGame = await prisma.game.findFirst({
      where: {
        OR: [
          { startsAt: { lte: now }, endsAt: { gt: now } }, // Live
          { startsAt: { gt: now } }, // Scheduled
        ],
      },
      orderBy: [{ startsAt: "asc" }],
      include: gameInclude,
    });

    if (activeGame) {
      const { entries, _count, ...gameData } = activeGame;
      return {
        game: { ...gameData, questionCount: _count.questions },
        recentPlayers: entries.map((e) => ({
          username: e.user.username || "Player",
          pfpUrl: e.user.pfpUrl,
          timestamp: Date.now(),
        })),
      };
    }

    // Fallback: get most recent ended game
    const endedGame = await prisma.game.findFirst({
      where: { endsAt: { lte: now } },
      orderBy: [{ endsAt: "desc" }],
      include: gameInclude,
    });

    if (endedGame) {
      const { entries, _count, ...gameData } = endedGame;
      return {
        game: { ...gameData, questionCount: _count.questions },
        recentPlayers: entries.map((e) => ({
          username: e.user.username || "Player",
          pfpUrl: e.user.pfpUrl,
          timestamp: Date.now(),
        })),
      };
    }

    return { game: null, recentPlayers: [] };
  }
);

/**
 * Fetch a specific game by ID with question count.
 * Cached per-request for deduplication.
 *
 * @param gameId - The game ID to fetch
 * @returns Game with question count and recent players, or null if not found
 */
export const getGameById = cache(
  async (gameId: string): Promise<GameQueryResult> => {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: gameInclude,
    });

    if (!game) {
      return { game: null, recentPlayers: [] };
    }

    const { entries, _count, ...gameData } = game;
    return {
      game: { ...gameData, questionCount: _count.questions },
      recentPlayers: entries.map((e) => ({
        username: e.user.username || "Player",
        pfpUrl: e.user.pfpUrl,
        timestamp: Date.now(),
      })),
    };
  }
);
