import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export type LeaderboardUser = {
  id: string;
  rank: number;
  name: string;
  imageUrl: string;
  points: number;
};

const PAGE_SIZE = 25;

// GET /api/leaderboard?tab=current|allTime&page=0
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tabParam = (searchParams.get("tab") || "allTime") as
    | "current"
    | "allTime";
  const pageParam = searchParams.get("page") ?? "0";

  if (tabParam !== "current" && tabParam !== "allTime") {
    return NextResponse.json(
      { error: "Invalid `tab`. Use `current` or `allTime`." },
      { status: 400 }
    );
  }
  const page = Number(pageParam);
  if (!Number.isFinite(page) || page < 0) {
    return NextResponse.json(
      { error: "Invalid `page` (>= 0)." },
      { status: 400 }
    );
  }

  // Determine dataset
  let users: LeaderboardUser[] = [];
  if (tabParam === "current") {
    // Find current active game (ongoing or latest)
    const now = new Date();
    let game = await prisma.game.findFirst({
      where: { startTime: { lte: now }, endTime: { gte: now } },
      orderBy: { startTime: "desc" },
    });
    if (!game) {
      // fallback to latest finished game
      game = await prisma.game.findFirst({
        where: { endTime: { lte: now } },
        orderBy: { endTime: "desc" },
      });
    }
    if (game) {
      const scores = await prisma.score.findMany({
        where: { gameId: game.id },
        include: { user: true },
        orderBy: { points: "desc" },
      });
      users = scores.map((s, idx) => ({
        id: s.userId.toString(),
        rank: idx + 1,
        name: s.user?.name || "",
        imageUrl: s.user?.imageUrl || "",
        points: s.points,
      }));
    }
  } else {
    // All-time: sum scores for each user
    const groups = await prisma.score.groupBy({
      by: ["userId"],
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
    });
    const userIds = groups.map((g) => g.userId);
    const usersData = await prisma.user.findMany({
      where: { id: { in: userIds } },
    });
    users = groups.map((g, idx) => {
      const user = usersData.find((u) => u.id === g.userId);
      return {
        id: g.userId.toString(),
        rank: idx + 1,
        name: user?.name || "",
        imageUrl: user?.imageUrl || "",
        points: g._sum?.points || 0,
      };
    });
  }

  // Paginate
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageUsers = users.slice(start, end);
  const hasMore = end < users.length;
  return NextResponse.json({ users: pageUsers, hasMore });
}

export const dynamic = "force-dynamic";
