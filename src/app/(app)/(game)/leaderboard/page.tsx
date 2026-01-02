import { BottomNav } from "@/components/BottomNav";
import LeaderboardClient from "./client";

// ==========================================
// TYPES
// ==========================================
export type TabKey = "current" | "allTime" | "game";

// ==========================================
// PAGE COMPONENT
// ==========================================
export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; gameId?: string }>;
}) {
  const { tab, gameId: gameIdParam } = await searchParams;

  // Determine which tab to show
  const gameId = gameIdParam ? parseInt(gameIdParam, 10) : undefined;
  const activeTab: TabKey = gameId ? "game" : (tab === "allTime" ? "allTime" : "current");

  return (
    <>
      <LeaderboardClient
        activeTab={activeTab}
        gameId={gameId}
      />
      <BottomNav />
    </>
  );
}
