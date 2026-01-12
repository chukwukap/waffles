import { BottomNav } from "@/components/BottomNav";
import LeaderboardClient from "./client";

// ============================================
// TYPES (exported for use in client and API)
// ============================================
export type TabKey = "current" | "allTime" | "game";

export interface LeaderboardData {
  entries: {
    id: string | number;
    fid: number;
    rank: number;
    username: string;
    winnings: number;
    pfpUrl: string | null;
  }[];
  hasMore: boolean;
  totalPlayers: number;
  gameTitle?: string;
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

  // No server-side data fetching - client will fetch using gameId from context
  return (
    <>
      <LeaderboardClient
        activeTab={activeTab}
        gameIdOverride={gameId}
      />
      <BottomNav />
    </>
  );
}
