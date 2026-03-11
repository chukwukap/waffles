import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { z } from "zod";

// ============================================
// CONFIGURATION
// ============================================
const PAGE_SIZE = env.nextPublicLeaderboardPageSize;

// ============================================
// TYPES
// ============================================
interface LeaderboardEntry {
  id: string;
  fid: number;
  rank: number;
  username: string | null;
  prize: number;
  pfpUrl: string | null;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  hasMore: boolean;
  totalPlayers: number;
  gameTitle?: string;
  gameNumber?: number;
}

// ============================================
// QUERY VALIDATION
// ============================================
const querySchema = z.object({
  tab: z.enum(["allTime"]).optional(),
  page: z.coerce.number().int().nonnegative().default(0),
  gameId: z.string().optional(),
});

// ============================================
// HANDLER
// ============================================
export async function GET(request: NextRequest) {
  try {
    // 1. Parse params
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      tab: searchParams.get("tab") || undefined,
      page: searchParams.get("page") || "0",
      gameId: searchParams.get("gameId") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    const { tab, page, gameId } = parsed.data;

    // 2. Route to appropriate handler
    if (tab === "allTime") {
      return handleAllTime(page);
    }
    return handleGame(page, gameId);
  } catch (error) {
    console.error("GET /api/v1/leaderboard Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================
// ALL TIME HANDLER
// ============================================
async function handleAllTime(
  page: number
): Promise<NextResponse<LeaderboardResponse>> {
  const [aggregated, allUsers] = await prisma.$transaction([
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

  const totalPlayers = allUsers.length;

  if (aggregated.length === 0) {
    return NextResponse.json({
      entries: [],
      hasMore: false,
      totalPlayers: 0,
    });
  }

  // Fetch user details
  const userIds = aggregated.map((a) => a.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fid: true, username: true, pfpUrl: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const entries: LeaderboardEntry[] = aggregated.map((a, i) => {
    const user = userMap.get(a.userId);
    return {
      id: user?.id ?? a.userId,
      fid: user?.fid ?? 0,
      rank: page * PAGE_SIZE + i + 1,
      username: user?.username ?? "Unknown",
      prize: a._sum?.prize ?? 0,
      pfpUrl: user?.pfpUrl ?? null,
    };
  });

  return NextResponse.json({
    entries,
    hasMore: (page + 1) * PAGE_SIZE < totalPlayers,
    totalPlayers,
  });
}

// ============================================
// GAME HANDLER
// ============================================
async function handleGame(
  page: number,
  gameId?: string
): Promise<NextResponse<LeaderboardResponse>> {
  // Resolve game ID - use provided or get latest
  let targetGameId = gameId;

  if (!targetGameId) {
    const latest = await prisma.game.findFirst({
      orderBy: { endsAt: "desc" },
      select: { id: true },
    });
    targetGameId = latest?.id;
  }

  if (!targetGameId) {
    return NextResponse.json({
      entries: [],
      hasMore: false,
      totalPlayers: 0,
    });
  }

  // Fetch game info + entries in parallel
  const [game, players, total] = await prisma.$transaction([
    prisma.game.findUnique({
      where: { id: targetGameId },
      select: { title: true, gameNumber: true },
    }),
    prisma.gameEntry.findMany({
      where: { gameId: targetGameId, paidAt: { not: null } },
      select: {
        prize: true,
        rank: true,
        score: true,
        user: { select: { id: true, fid: true, username: true, pfpUrl: true } },
      },
      orderBy: [{ rank: { sort: "asc", nulls: "last" } }, { score: "desc" }],
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    }),
    prisma.gameEntry.count({
      where: { gameId: targetGameId, paidAt: { not: null } },
    }),
  ]);

  if (players.length === 0) {
    return NextResponse.json({
      entries: [],
      hasMore: false,
      totalPlayers: 0,
      gameTitle: game?.title ?? "Game",
      gameNumber: game?.gameNumber ?? 1,
    });
  }

  const entries: LeaderboardEntry[] = players.map((p, i) => ({
    id: p.user.id,
    fid: p.user.fid,
    rank: p.rank ?? page * PAGE_SIZE + i + 1,
    username: p.user.username,
    prize: p.prize ?? 0,
    pfpUrl: p.user.pfpUrl,
  }));

  return NextResponse.json({
    entries,
    hasMore: (page + 1) * PAGE_SIZE < total,
    totalPlayers: total,
    gameTitle: game?.title ?? "Game",
    gameNumber: game?.gameNumber ?? undefined,
  });
}
