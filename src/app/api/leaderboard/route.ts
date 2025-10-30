import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { z } from "zod";

export interface LeaderboardUserData {
  id: string;
  fid: number; // <-- ADDED
  rank: number;
  name: string | null;
  imageUrl: string | null;
  points: number;
}

interface LeaderboardApiResponse {
  users: LeaderboardUserData[];
  hasMore: boolean;
  // me: LeaderboardUserData | null; // <-- REMOVED
  totalPlayers: number;
  totalPoints: number;
}
// FIX: Added .nullable() to all fields to correctly handle
// the output of searchParams.get() which returns string | null.
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
      userId: searchParams.get("userId"), // This will be the FID
    });

    if (!queryValidation.success) {
      const firstError =
        queryValidation.error.message || "Invalid query parameters";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }
    const {
      tab,
      page,
      gameId: requestedGameId,
      userId: requestedUserFid, // <-- Renamed for clarity
    } = queryValidation.data;

    let allUsersSorted: LeaderboardUserData[] = [];
    let totalPointsInScope = 0;

    if (tab === "current") {
      let gameIdToQuery: number | undefined = requestedGameId;

      if (!gameIdToQuery) {
        const now = new Date();
        const activeGame = await prisma.game.findFirst({
          where: { startTime: { lte: now }, endTime: { gt: now } },
          orderBy: { startTime: "desc" },
          select: { id: true },
        });
        if (activeGame) {
          gameIdToQuery = activeGame.id;
        } else {
          const lastEndedGame = await prisma.game.findFirst({
            where: { endTime: { lte: now } },
            orderBy: { endTime: "desc" },
            select: { id: true },
          });
          gameIdToQuery = lastEndedGame?.id;
        }
      }

      if (gameIdToQuery) {
        // Fetch scores for the determined game, including user details
        const scores = await prisma.score.findMany({
          where: { gameId: gameIdToQuery },
          include: {
            user: {
              select: { id: true, name: true, imageUrl: true, fid: true }, // <-- ADDED FID
            },
          },
          orderBy: { points: "desc" },
        });

        allUsersSorted = scores.map((s, i) => {
          totalPointsInScope += s.points;
          return {
            id: s.userId.toString(),
            fid: s.user?.fid ?? 0, // <-- ADDED FID
            rank: i + 1,
            name: s.user?.name ?? null,
            imageUrl: s.user?.imageUrl ?? null,
            points: s.points,
          };
        });
      }
    } else {
      const groupedScores = await prisma.score.groupBy({
        by: ["userId"],
        _sum: { points: true },
        orderBy: { _sum: { points: "desc" } },
      });

      const userIds = groupedScores.map((g) => g.userId);
      if (userIds.length > 0) {
        const usersData = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, imageUrl: true, fid: true }, // <-- ADDED FID
        });
        const usersDataMap = new Map(usersData.map((u) => [u.id, u]));

        allUsersSorted = groupedScores.map((g, i) => {
          const user = usersDataMap.get(g.userId);
          const points = g._sum.points ?? 0;
          totalPointsInScope += points;
          return {
            id: g.userId.toString(),
            fid: user?.fid ?? 0, // <-- ADDED FID
            rank: i + 1,
            name: user?.name ?? null,
            imageUrl: user?.imageUrl ?? null,
            points: points,
          };
        });
      }
    }

    const totalPlayers = allUsersSorted.length;
    const pageSize = env.nextPublicLeaderboardPageSize;
    const start = page * pageSize;
    const end = start + pageSize;
    const pageUsers = allUsersSorted.slice(start, end);
    const hasMore = end < totalPlayers;

    // We no longer need to find 'me' for the response
    // let me: LeaderboardUserData | null = null;
    // if (requestedUserFid) {
    //   const found = allUsersSorted.find(
    //     (u) => u.fid === requestedUserFid // <-- Check against FID
    //   );
    //   if (found) me = found;
    // }

    const responseData: LeaderboardApiResponse = {
      users: pageUsers,
      hasMore,
      // me, // <-- REMOVED
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

// Ensure dynamic execution for fresh leaderboard data
export const dynamic = "force-dynamic";
