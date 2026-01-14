/**
 * Game Layout
 *
 * Provides the real-time WebSocket connection for all game pages.
 * Game data is NOT stored in React state - each page fetches its own
 * game data and passes it as props to client components.
 *
 * The layout only fetches the current game ID for WebSocket room connection
 * and recent players for the initial avatar stack display.
 */

import { getCurrentOrNextGame } from "@/lib/game";
import { GameHeader } from "./game/_components/GameHeader";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch current game - only for WebSocket room ID and recent players
  // This is deduplicated with page-level fetches via React's cache()
  const { game, recentPlayers } = await getCurrentOrNextGame();

  return (
    <RealtimeProvider gameId={game?.id ?? null} initialRecentPlayers={recentPlayers}>
      <GameHeader />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </div>
    </RealtimeProvider>
  );
}

// Force dynamic rendering for real-time data
export const dynamic = "force-dynamic";
