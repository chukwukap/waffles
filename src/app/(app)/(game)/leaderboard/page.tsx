import { cache } from "react";
import { prisma } from "@/lib/db";
import { LeaderboardEntry } from "@/lib/types";
import LeaderboardClientPage from "./client";
import { BottomNav } from "@/components/BottomNav";
import { env } from "@/lib/env";
import { redirect } from "next/navigation";

export type TabKey = "current" | "allTime";

export interface LeaderboardApiResponse {
  users: LeaderboardEntry[];
  hasMore: boolean;
  totalPlayers?: number;
  totalPoints?: number;
}

const PAGE_SIZE = env.nextPublicLeaderboardPageSize;

/**
 * Server-side function to fetch leaderboard data.
 * Wrapped in cache() to de-duplicate requests.
 */
export const getLeaderboardData = cache(
  async (tab: TabKey, page: number = 0): Promise<LeaderboardApiResponse> => {
    try {
      let entries: LeaderboardEntry[] = [];
      let totalCount = 0;
      let totalPoints = 0;

      if (tab === "current") {
        // --- Query for "Current Game" Tab ---
        const now = new Date();
        const currentGame = await prisma.game.findFirst({
          where: { endsAt: { gt: now }, status: "LIVE" },
          orderBy: { startsAt: "asc" },
          select: { id: true },
        });

        if (!currentGame) {
          return { users: [], hasMore: false, totalPlayers: 0, totalPoints: 0 };
        }

        const [players, total] = await prisma.$transaction([
          prisma.gamePlayer.findMany({
            where: { gameId: currentGame.id },
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
          prisma.gamePlayer.count({
            where: { gameId: currentGame.id },
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

        // Note: totalPoints for 'current' might be expensive, skipping for now
      } else {
        // --- Query for "All Time" Tab ---
        const [aggregatedScores, total] = await prisma.$transaction([
          prisma.gamePlayer.groupBy({
            by: ["userId"],
            _sum: { score: true },
            orderBy: { _sum: { score: "desc" } },
            take: PAGE_SIZE,
            skip: page * PAGE_SIZE,
          }),
          prisma.gamePlayer.groupBy({
            by: ["userId"],
            _sum: { score: true },
            orderBy: { _sum: { score: "desc" } },
            take: PAGE_SIZE,
            skip: page * PAGE_SIZE,
          }),
        ]);

        totalCount = total.length;
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
            totalPoints += points; // Summing total points for this page
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

      return {
        users: entries,
        hasMore: (page + 1) * PAGE_SIZE < totalCount,
        totalPlayers: totalCount,
        totalPoints: totalPoints, // This is page total for 'allTime'
      };
    } catch (error) {
      console.error("Failed to fetch leaderboard data:", error);
      return { users: [], hasMore: false };
    }
  }
);


/**
 * This is the main Server Component for the leaderboard page.
 */
export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ fid?: string; tab?: string }>;
}) {
  const { fid, tab } = await searchParams;
  const activeTab = (tab || "current") as TabKey;
  const userFid = fid ? Number(fid) : null;

  if (!userFid) {
    redirect("/invite");
  }

  const user = await prisma.user.findUnique({
    where: { fid: userFid },
    select: { status: true },
  });

  // Enforce access control
  if (!user || user.status !== "ACTIVE") {
    redirect("/invite");
  }

  // Start fetching Page 0 on the server.
  const initialDataPromise = getLeaderboardData(activeTab, 0);

  return (
    <>
      <LeaderboardClientPage
        initialDataPromise={initialDataPromise}
        userFid={userFid}
        activeTab={activeTab}
      />
      <BottomNav />
    </>
  );
}
