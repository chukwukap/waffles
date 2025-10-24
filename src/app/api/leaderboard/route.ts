import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export type LeaderboardUser = {
  id: string;
  rank: number;
  name: string;
  imageUrl: string;
  points: number;
};

// GET /api/leaderboard?tab=current|allTime&page=0&gameId=&userId=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tabParam = (searchParams.get("tab") || "allTime") as
    | "current"
    | "allTime";
  const page = Number.parseInt(searchParams.get("page") ?? "0", 10);
  const gameIdParam = searchParams.get("gameId");
  const userIdParam = searchParams.get("userId");

  if (!["current", "allTime"].includes(tabParam)) {
    return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
  }
  if (!Number.isFinite(page) || page < 0) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  let users: LeaderboardUser[] = [];

  if (tabParam === "current") {
    // Determine which game is "current"
    let game = null;
    if (gameIdParam) {
      game = await prisma.game.findUnique({
        where: { id: Number(gameIdParam) },
      });
    } else {
      const now = new Date();
      game =
        (await prisma.game.findFirst({
          where: { startTime: { lte: now }, endTime: { gte: now } },
          orderBy: { startTime: "desc" },
        })) ??
        (await prisma.game.findFirst({
          where: { endTime: { lte: now } },
          orderBy: { endTime: "desc" },
        }));
    }

    if (game) {
      const scores = await prisma.score.findMany({
        where: { gameId: game.id },
        include: { user: true },
        orderBy: { points: "desc" },
      });

      users = scores.map((s, i) => ({
        id: s.userId.toString(),
        rank: i + 1,
        name: s.user?.name || "",
        imageUrl: s.user?.imageUrl || "",
        points: s.points,
      }));
    }
  } else {
    // All-time leaderboard (sum of points per user)
    const grouped = await prisma.score.groupBy({
      by: ["userId"],
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
    });

    const userIds = grouped.map((g) => g.userId);
    const usersData = await prisma.user.findMany({
      where: { id: { in: userIds } },
    });

    users = grouped.map((g, i) => {
      const user = usersData.find((u) => u.id === g.userId);
      return {
        id: g.userId.toString(),
        rank: i + 1,
        name: user?.name || "",
        imageUrl: user?.imageUrl || "",
        points: g._sum.points || 0,
      };
    });
  }

  // pagination
  const totalPlayers = users.length;
  const totalPoints = users.reduce((sum, u) => sum + (u.points ?? 0), 0);
  const pageSize = env.nextPublicLeaderboardPageSize;
  const start = page * pageSize;
  const end = start + pageSize;
  const pageUsers = users.slice(start, end);
  const hasMore = end < users.length;

  // optional "me"
  let me = null;
  if (userIdParam) {
    const userId = Number(userIdParam);
    const found = users.find((u) => Number(u.id) === userId);
    if (found) me = found;
  }

  return NextResponse.json({
    users: pageUsers,
    hasMore,
    me,
    totalPlayers,
    totalPoints,
  });
}

export const dynamic = "force-dynamic";
