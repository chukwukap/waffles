import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { z } from "zod";
import { LeaderboardEntry } from "@/lib/types"; // Import correct type

export interface LeaderboardApiResponse {
  users: LeaderboardEntry[];
  hasMore: boolean;
  totalPlayers: number;
  totalPoints: number;
}

const querySchema = z.object({
  tab: z.enum(["current", "allTime"]).nullable().default("allTime"),
  page: z
    .string()
    .regex(/^\d+$/, "Page must be a non-negative integer.")
    .nullable()
    .default("0")
    .transform(Number),
  gameId: z
    .string()
    .regex(/^\d+$/, "Game ID must be a numeric string.")
    .nullable()
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
  userId: z // This is the user's FID
    .string()
    .regex(/^\d+$/, "User ID must be a numeric string.")
    .nullable()
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const queryValidation = querySchema.safeParse({
      tab: searchParams.get("tab"),
      page: searchParams.get("page"),
      gameId: searchParams.get("gameId"),
      userId: searchParams.get("userId"),
    });

    if (!queryValidation.success) {
      const firstError =
        queryValidation.error.issues[0]?.message || "Invalid query parameters";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }
    const { tab, page, gameId: requestedGameId } = queryValidation.data;

    const PAGE_SIZE = env.nextPublicLeaderboardPageSize;
    let allUsersSorted: LeaderboardEntry[] = [];
    let totalPointsInScope = 0;
    let totalPlayers = 0;

    if (tab === "current") {
      // --- Query for "Current Game" Tab ---
      let gameIdToQuery: number | undefined = requestedGameId;

      if (!gameIdToQuery) {
        const now = new Date();
        // Find live or most recently scheduled game
        const activeGame = await prisma.game.findFirst({
          where: {
            status: { in: ["LIVE", "SCHEDULED"] },
            endsAt: { gt: now },
          },
          orderBy: { startsAt: "asc" },
          select: { id: true },
        });
        gameIdToQuery = activeGame?.id;
      }

      if (gameIdToQuery) {
        // Fetch scores for the determined game
        // CHANGED: Query GamePlayer, select correct fields
        const [players, total] = await prisma.$transaction([
          prisma.gamePlayer.findMany({
            where: { gameId: gameIdToQuery },
            include: {
              user: {
                select: { id: true, username: true, pfpUrl: true, fid: true },
              },
            },
            orderBy: { score: "desc" },
            take: PAGE_SIZE,
            skip: page * PAGE_SIZE,
          }),
          prisma.gamePlayer.count({
            where: { gameId: gameIdToQuery },
          }),
        ]);

        totalPlayers = total;
        allUsersSorted = players.map((p, i) => {
          totalPointsInScope += p.score;
          return {
            id: p.userId.toString(),
            fid: p.user.fid,
            rank: page * PAGE_SIZE + i + 1,
            username: p.user.username, // CHANGED
            pfpUrl: p.user.pfpUrl, // CHANGED
            points: p.score,
          };
        });
      }
    } else {
      // --- Query for "All Time" Tab ---
      // CHANGED: Query GamePlayer
      const [groupedScores, totalResult] = await prisma.$transaction([
        prisma.gamePlayer.groupBy({
          by: ["userId"],
          _sum: { score: true },
          orderBy: { _sum: { score: "desc" } },
          take: PAGE_SIZE,
          skip: page * PAGE_SIZE,
        }),
        prisma.gamePlayer.groupBy({
          by: ["userId"],
          orderBy: { _sum: { score: "desc" } },
        }),
      ]);

      totalPlayers = totalResult.length;
      const userIds = groupedScores.map((g) => g.userId);

      if (userIds.length > 0) {
        // CHANGED: Select correct fields
        const usersData = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true, pfpUrl: true, fid: true },
        });
        const usersDataMap = new Map(usersData.map((u) => [u.id, u]));

        allUsersSorted = groupedScores.map((g, i) => {
          const user = usersDataMap.get(g.userId);
          const points = g._sum?.score ?? 0;
          totalPointsInScope += points;
          return {
            id: g.userId.toString(),
            fid: user?.fid ?? 0,
            rank: page * PAGE_SIZE + i + 1,
            username: user?.username ?? "Unknown", // CHANGED
            pfpUrl: user?.pfpUrl ?? null, // CHANGED
            points: points,
          };
        });
      }
    }

    const hasMore = (page + 1) * PAGE_SIZE < totalPlayers;

    const responseData: LeaderboardApiResponse = {
      users: allUsersSorted,
      hasMore,
      totalPlayers,
      totalPoints: totalPointsInScope,
    };
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("GET /api/leaderboard Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
