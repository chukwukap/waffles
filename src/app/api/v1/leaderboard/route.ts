import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { z } from "zod";

const PAGE_SIZE = env.nextPublicLeaderboardPageSize;

const querySchema = z.object({
  tab: z.enum(["current", "allTime", "game"]).optional(),
  gameId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .default(env.nextPublicLeaderboardPageSize),
});

interface LeaderboardEntry {
  id: number;
  fid: number;
  rank: number;
  username: string | null;
  points: number;
  pfpUrl: string | null;
}

interface LeaderboardResponse {
  users: LeaderboardEntry[];
  hasMore: boolean;
  totalPlayers?: number;
  totalPoints?: number;
}

/**
 * GET /api/v1/leaderboard
 * Public endpoint for leaderboard data with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validation = querySchema.safeParse({
      tab: searchParams.get("tab"),
      gameId: searchParams.get("gameId"),
      page: searchParams.get("page") || "0",
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { tab, gameId, page } = validation.data;

    let entries: LeaderboardEntry[] = [];
    let totalCount = 0;
    let totalPoints = 0;

    // If gameId is provided, fetch that specific game
    if (gameId) {
      const [players, total] = await prisma.$transaction([
        prisma.gameEntry.findMany({
          where: { gameId, paidAt: { not: null } },
          select: {
            score: true,
            rank: true,
            user: {
              select: { id: true, fid: true, username: true, pfpUrl: true },
            },
          },
          orderBy: { score: "desc" },
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
        points: p.score,
        pfpUrl: p.user.pfpUrl,
      }));
    } else if (!tab || tab === "current") {
      // --- Query for "Current Game" Tab ---
      const now = new Date();
      const currentGame = await prisma.game.findFirst({
        where: {
          startsAt: { lte: now },
          endsAt: { gt: now },
        },
        orderBy: { startsAt: "asc" },
        select: { id: true },
      });

      if (!currentGame) {
        return NextResponse.json<LeaderboardResponse>({
          users: [],
          hasMore: false,
          totalPlayers: 0,
          totalPoints: 0,
        });
      }

      const [players, total] = await prisma.$transaction([
        prisma.gameEntry.findMany({
          where: { gameId: currentGame.id, paidAt: { not: null } },
          select: {
            score: true,
            user: {
              select: { id: true, fid: true, username: true, pfpUrl: true },
            },
          },
          orderBy: { score: "desc" },
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
        rank: page * PAGE_SIZE + index + 1,
        username: p.user.username,
        points: p.score,
        pfpUrl: p.user.pfpUrl,
      }));
    } else {
      // --- Query for "All Time" Tab ---
      const [aggregatedScores, totalCountResult] = await prisma.$transaction([
        prisma.gameEntry.groupBy({
          by: ["userId"],
          where: { paidAt: { not: null } },
          _sum: { score: true },
          orderBy: { _sum: { score: "desc" } },
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
      const userIds = aggregatedScores.map((s) => s.userId);

      if (userIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, fid: true, username: true, pfpUrl: true },
        });
        const usersMap = new Map(users.map((u) => [u.id, u]));

        entries = aggregatedScores.map((s, index) => {
          const user = usersMap.get(s.userId);
          const points = s._sum?.score ?? 0;
          totalPoints += points;
          return {
            id: user?.id ?? 0,
            fid: user?.fid ?? 0,
            rank: page * PAGE_SIZE + index + 1,
            username: user?.username ?? "Unknown",
            points: points,
            pfpUrl: user?.pfpUrl ?? null,
          };
        });
      }
    }

    return NextResponse.json<LeaderboardResponse>({
      users: entries,
      hasMore: (page + 1) * PAGE_SIZE < totalCount,
      totalPlayers: totalCount,
      totalPoints: totalPoints,
    });
  } catch (error) {
    console.error("GET /api/v1/leaderboard Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
