import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { LeaderboardEntry } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import LeaderboardClient from "./client";

// ============================================
// TYPES
// ============================================
export type TabKey = "current" | "allTime" | "game";

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  hasMore: boolean;
  totalPlayers: number;
  gameTitle?: string;
}

// ============================================
// CONSTANTS
// ============================================
const PAGE_SIZE = env.nextPublicLeaderboardPageSize;

// ============================================
// DATA FETCHING (Updated for GameEntry)
// ============================================

async function getCurrentGameLeaderboard(page: number): Promise<LeaderboardData> {
  const now = new Date();

  // Find the current live game (phase derived from time, not status)
  const currentGame = await prisma.game.findFirst({
    where: {
      startsAt: { lte: now },
      endsAt: { gt: now },
    },
    orderBy: { startsAt: "asc" },
    select: { id: true, title: true },
  });

  if (!currentGame) {
    return { entries: [], hasMore: false, totalPlayers: 0 };
  }

  return getGameLeaderboardById(currentGame.id, page, currentGame.title);
}

async function getGameLeaderboardById(
  gameId: string,
  page: number,
  gameTitle?: string
): Promise<LeaderboardData> {
  // Fetch game title if not provided
  let title = gameTitle;
  if (!title) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { title: true },
    });
    title = game?.title ?? "Game";
  }

  // Fetch entries and count in parallel (using GameEntry instead of GamePlayer)
  const [entries, total] = await Promise.all([
    prisma.gameEntry.findMany({
      where: { gameId, paidAt: { not: null } }, // Only paid entries
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
    prisma.gameEntry.count({ where: { gameId, paidAt: { not: null } } }),
  ]);

  const formattedEntries: LeaderboardEntry[] = entries.map((e, index) => ({
    id: e.user.id,
    fid: e.user.fid,
    rank: e.rank ?? (page * PAGE_SIZE + index + 1),
    username: e.user.username,
    points: e.score,
    pfpUrl: e.user.pfpUrl,
  }));

  return {
    entries: formattedEntries,
    hasMore: (page + 1) * PAGE_SIZE < total,
    totalPlayers: total,
    gameTitle: title,
  };
}

async function getAllTimeLeaderboard(page: number): Promise<LeaderboardData> {
  // Get aggregated scores grouped by user (using GameEntry)
  const aggregatedScores = await prisma.gameEntry.groupBy({
    by: ["userId"],
    where: { paidAt: { not: null } }, // Only count paid entries
    _sum: { score: true },
    orderBy: { _sum: { score: "desc" } },
    take: PAGE_SIZE,
    skip: page * PAGE_SIZE,
  });

  // Get total unique players count
  const totalResult = await prisma.gameEntry.groupBy({
    by: ["userId"],
    where: { paidAt: { not: null } },
    _count: true,
  });
  const total = totalResult.length;

  if (aggregatedScores.length === 0) {
    return { entries: [], hasMore: false, totalPlayers: total };
  }

  // Fetch user details
  const userIds = aggregatedScores.map((s) => s.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fid: true, username: true, pfpUrl: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  const entries: LeaderboardEntry[] = aggregatedScores.map((s, index) => {
    const user = userMap.get(s.userId);
    return {
      id: user?.id ?? 0,
      fid: user?.fid ?? 0,
      rank: page * PAGE_SIZE + index + 1,
      username: user?.username ?? "Unknown",
      points: s._sum?.score ?? 0,
      pfpUrl: user?.pfpUrl ?? null,
    };
  });

  return {
    entries,
    hasMore: (page + 1) * PAGE_SIZE < total,
    totalPlayers: total,
  };
}

export async function getLeaderboardData(
  tab: TabKey,
  page: number = 0,
  gameId?: string
): Promise<LeaderboardData> {
  try {
    if (tab === "game" && gameId) {
      return await getGameLeaderboardById(gameId, page);
    }
    return tab === "current"
      ? await getCurrentGameLeaderboard(page)
      : await getAllTimeLeaderboard(page);
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return { entries: [], hasMore: false, totalPlayers: 0 };
  }
}

// ============================================
// PAGE COMPONENT
// ============================================
export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; gameId?: string }>;
}) {
  const { tab, gameId: gameIdParam } = await searchParams;

  // Determine which tab to show
  const gameId = gameIdParam ? gameIdParam : undefined;
  const activeTab: TabKey = gameId ? "game" : (tab === "allTime" ? "allTime" : "current");

  // Fetch initial data on the server
  const initialData = await getLeaderboardData(activeTab, 0, gameId);

  return (
    <>
      <LeaderboardClient
        initialData={initialData}
        activeTab={activeTab}
        gameId={gameId}
      />
      <BottomNav />
    </>
  );
}
