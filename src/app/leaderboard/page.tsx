import { Suspense, cache } from "react";
import { prisma } from "@/lib/db";
import { LeaderboardEntry } from "@/state/types";
import Header from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

import { Spinner } from "@/components/ui/spinner";
import LeaderboardClientPage from "./_components/leaderboardClientPage";

// --- MOCK DATA ---
// Easy on/off switch for development
const USE_MOCK_DATA = true; // <-- SET TO false TO DISABLE

// Define your mock users here. They will be combined with real data.
// Omit 'rank' as it will be auto-calculated.
const NUM_MOCKS = 5; // Change this to easily set the total number of mock entries

const BASE_MOCKS: Omit<LeaderboardEntry, "rank" | "id">[] = [
  {
    fid: 999001,
    username: "dev_user_one",
    points: 1500.5,
    pfpUrl: "/images/avatars/a.png",
  },
  {
    fid: 999002,
    username: "dev_user_two",
    points: 950.22,
    pfpUrl: "/images/avatars/b.png",
  },
  {
    fid: 999003,
    username: "dev_user_three",
    points: 50.1,
    pfpUrl: "/images/avatars/c.png",
  },
  {
    fid: 755074,
    username: "chukwukauba (MOCK)",
    points: 1234.56,
    pfpUrl: "/images/avatars/d.png",
  },
];

const MOCK_LEADERBOARD_ENTRIES: Omit<LeaderboardEntry, "rank" | "id">[] =
  Array.from({ length: NUM_MOCKS }, (_, i) => {
    const base = BASE_MOCKS[i % BASE_MOCKS.length];
    return {
      ...base,
      fid: base.fid + Math.floor(i / BASE_MOCKS.length) * 10000, // Ensure unique fid for each duplicate
      username: `${base.username} #${i + 1}`,
      points: base.points + i * 5.17, // Slightly increasing points for variety
      pfpUrl: base.pfpUrl,
    };
  });
// --- END MOCK DATA ---

export type TabKey = "current" | "allTime";

export interface LeaderboardApiResponse {
  users: LeaderboardEntry[];
  hasMore: boolean;
  totalPlayers?: number;
  totalPoints?: number;
}

const PAGE_SIZE = 30;

/**
 * Server-side function to fetch leaderboard data.
 * Wrapped in cache() to de-duplicate requests if needed.
 */
export const getLeaderboardData = cache(
  async (tab: TabKey, page: number = 0): Promise<LeaderboardApiResponse> => {
    // If using mock data, only ever return data for page 0
    if (USE_MOCK_DATA && page > 0) {
      return { users: [], hasMore: false };
    }

    try {
      let realEntries: LeaderboardEntry[] = [];
      let hasMoreReal = false;

      if (tab === "current") {
        // --- Query for "Current Game" Tab ---
        const now = new Date();
        const currentGame = await prisma.game.findFirst({
          where: { endTime: { gt: now } },
          orderBy: { startTime: "asc" },
          select: { id: true },
        });

        if (!currentGame) {
          realEntries = [];
          hasMoreReal = false;
        } else {
          const totalScores = await prisma.score.count({
            where: { gameId: currentGame.id },
          });

          const scores = await prisma.score.findMany({
            where: { gameId: currentGame.id },
            select: {
              points: true,
              user: {
                select: { id: true, fid: true, name: true, imageUrl: true },
              },
            },
            orderBy: { points: "desc" },
            take: PAGE_SIZE,
            skip: page * PAGE_SIZE,
          });

          realEntries = scores.map((s, index) => ({
            id: s.user.id,
            fid: s.user.fid,
            rank: page * PAGE_SIZE + index + 1,
            username: s.user.name,
            points: s.points,
            pfpUrl: s.user.imageUrl,
          }));

          hasMoreReal = (page + 1) * PAGE_SIZE < totalScores;
        }
      } else {
        // --- Query for "All Time" Tab ---
        // Only one groupBy: get totalCount from aggregatedScores.length if you want only the current page, or use a separate count query if your Prisma version does not support 'distinct'
        const aggregatedScores = await prisma.score.groupBy({
          by: ["userId"],
          _sum: { points: true },
          orderBy: { _sum: { points: "desc" } },
          take: PAGE_SIZE,
          skip: page * PAGE_SIZE,
        });

        // Get the total number of unique userIds in Score table; this is for paginating the entire leaderboard.
        // If Prisma supported 'distinct: ["userId"]' on count, that would be ideal, but since it's not, we do:
        const totalCount = await prisma.score
          .findMany({
            select: { userId: true },
            distinct: ["userId"],
          })
          .then((rows) => rows.length);

        const userIds = aggregatedScores.map((s) => s.userId);
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, fid: true, name: true, imageUrl: true },
        });

        const usersMap = new Map(users.map((u) => [u.id, u]));

        realEntries = aggregatedScores.map((s, index) => {
          const user = usersMap.get(s.userId);
          return {
            id: user?.id ?? 0,
            fid: user?.fid ?? 0,
            rank: page * PAGE_SIZE + index + 1,
            username: user?.name ?? "Unknown",
            points: s._sum.points ?? 0,
            pfpUrl: user?.imageUrl ?? null,
          };
        });

        hasMoreReal = (page + 1) * PAGE_SIZE < totalCount;
      }

      // --- MOCK DATA INJECTION ---
      if (USE_MOCK_DATA) {
        // Combine real and mock data using a Map to de-duplicate by FID
        const allUsersMap = new Map<number, Omit<LeaderboardEntry, "rank">>();

        // Add real users first
        for (const entry of realEntries) {
          allUsersMap.set(entry.fid, entry);
        }

        // Add/overwrite with mock users
        for (const mockEntry of MOCK_LEADERBOARD_ENTRIES) {
          allUsersMap.set(mockEntry.fid, {
            ...mockEntry,
            id: `mock-${mockEntry.fid}`, // Give mock users a unique ID
          });
        }

        // Sort by points (descending)
        const combinedSorted = Array.from(allUsersMap.values()).sort(
          (a, b) => b.points - a.points
        );

        // Re-assign ranks
        const finalEntries = combinedSorted.map((user, index) => ({
          ...user,
          rank: index + 1, // Re-calculate rank
        }));

        return {
          users: finalEntries,
          hasMore: false, // Disable infinite scroll when using mock data
        };
      }
      // --- END MOCK DATA INJECTION ---

      // If not using mock data, return real entries as-is
      return {
        users: realEntries,
        hasMore: hasMoreReal,
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

  // Start fetching Page 0 on the server.
  // If USE_MOCK_DATA is true, this promise will resolve with
  // the combined, sorted, and ranked mock data.
  const initialDataPromise = getLeaderboardData(activeTab, 0);

  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <main className="flex-1 overflow-y-auto flex flex-col mx-auto max-w-sm px-4">
          <LeaderboardClientPage
            initialDataPromise={initialDataPromise}
            userFid={userFid}
            activeTab={activeTab}
          />
        </main>
      </Suspense>
      <BottomNav />
    </>
  );
}
