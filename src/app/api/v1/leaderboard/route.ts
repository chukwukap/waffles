import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { z } from "zod";

const PAGE_SIZE = env.nextPublicLeaderboardPageSize;

const querySchema = z.object({
  tab: z.enum(["current", "allTime", "game"]).default("current"),
  page: z.coerce.number().int().nonnegative().default(0),
  gameId: z.string().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .default(env.nextPublicLeaderboardPageSize),
});

interface LeaderboardEntry {
  id: string;
  fid: number;
  rank: number;
  username: string | null;
  winnings: number; // USDC winnings, not points
  pfpUrl: string | null;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  hasMore: boolean;
  totalPlayers?: number;
  totalWinnings?: number; // Total USDC winnings
  gameTitle?: string;
}

/**
 * GET /api/v1/leaderboard
 * Public endpoint for leaderboard data with pagination
 *
 * Query params:
 * - tab: "current" | "allTime" | "game" (default: "current")
 * - page: number (default: 0)
 * - gameId: string (required when tab=game, used for current tab to specify game)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validation = querySchema.safeParse({
      tab: searchParams.get("tab") || "current",
      page: searchParams.get("page") || "0",
      gameId: searchParams.get("gameId") || undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { tab, page, gameId } = validation.data;

    let entries: LeaderboardEntry[] = [];
    let totalCount = 0;
    let totalWinnings = 0;
    let gameTitle: string | undefined;

    // Handle "game" tab - fetch specific game's leaderboard
    if (tab === "game" && gameId) {
      // Fetch game title
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: { title: true },
      });
      gameTitle = game?.title ?? "Game";

      const [players, total] = await prisma.$transaction([
        prisma.gameEntry.findMany({
          where: { gameId, paidAt: { not: null } },
          select: {
            prize: true,
            rank: true,
            user: {
              select: { id: true, fid: true, username: true, pfpUrl: true },
            },
          },
          orderBy: { prize: "desc" },
          take: PAGE_SIZE,
          skip: page * PAGE_SIZE,
        }),
        prisma.gameEntry.count({
          where: { gameId, paidAt: { not: null } },
        }),
      ]);

      totalCount = total;
      entries = players.map((p, index) => ({
        id: p.user.id,
        fid: p.user.fid,
        rank: p.rank ?? page * PAGE_SIZE + index + 1,
        username: p.user.username,
        winnings: p.prize ?? 0,
        pfpUrl: p.user.pfpUrl,
      }));
    } else if (tab === "current") {
      // --- Query for "Current Game" Tab ---
      // Find a live game (startsAt <= now < endsAt)
      const now = new Date();
      const currentGame = await prisma.game.findFirst({
        where: {
          startsAt: { lte: now },
          endsAt: { gt: now },
        },
        orderBy: { startsAt: "asc" },
        select: { id: true, title: true },
      });

      if (!currentGame) {
        return NextResponse.json<LeaderboardResponse>({
          entries: [],
          hasMore: false,
          totalPlayers: 0,
          totalWinnings: 0,
        });
      }

      gameTitle = currentGame.title;

      const [players, total] = await prisma.$transaction([
        prisma.gameEntry.findMany({
          where: { gameId: currentGame.id, paidAt: { not: null } },
          select: {
            prize: true,
            rank: true,
            user: {
              select: { id: true, fid: true, username: true, pfpUrl: true },
            },
          },
          orderBy: { prize: "desc" },
          take: PAGE_SIZE,
          skip: page * PAGE_SIZE,
        }),
        prisma.gameEntry.count({
          where: { gameId: currentGame.id, paidAt: { not: null } },
        }),
      ]);

      totalCount = total;
      entries = players.map((p, index) => ({
        id: p.user.id,
        fid: p.user.fid,
        rank: p.rank ?? page * PAGE_SIZE + index + 1,
        username: p.user.username,
        winnings: p.prize ?? 0,
        pfpUrl: p.user.pfpUrl,
      }));
    } else {
      // --- Query for "All Time" Tab ---
      const [aggregatedPrizes, totalCountResult] = await prisma.$transaction([
        prisma.gameEntry.groupBy({
          by: ["userId"],
          where: { paidAt: { not: null } },
          _sum: { prize: true },
          orderBy: { _sum: { prize: "desc" } },
          take: PAGE_SIZE,
          skip: page * PAGE_SIZE,
        }),
        prisma.gameEntry.groupBy({
          by: ["userId"],
          where: { paidAt: { not: null } },
          orderBy: { userId: "asc" },
        }),
      ]);

      totalCount = totalCountResult.length;
      const userIds = aggregatedPrizes.map((s) => s.userId);

      if (userIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, fid: true, username: true, pfpUrl: true },
        });
        const usersMap = new Map(users.map((u) => [u.id, u]));

        entries = aggregatedPrizes.map((s, index) => {
          const user = usersMap.get(s.userId);
          const winnings = s._sum?.prize ?? 0;
          totalWinnings += winnings;
          return {
            id: user?.id ?? "",
            fid: user?.fid ?? 0,
            rank: page * PAGE_SIZE + index + 1,
            username: user?.username ?? "Unknown",
            winnings: winnings,
            pfpUrl: user?.pfpUrl ?? null,
          };
        });
      }
    }

    return NextResponse.json<LeaderboardResponse>({
      entries,
      hasMore: (page + 1) * PAGE_SIZE < totalCount,
      totalPlayers: totalCount,
      totalWinnings: totalWinnings,
      gameTitle,
    });
  } catch (error) {
    console.error("GET /api/v1/leaderboard Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
