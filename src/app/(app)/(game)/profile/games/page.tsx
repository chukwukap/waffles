"use client";

import { useProfile } from "../ProfileProvider";
import { cn } from "@/lib/utils";
import GameHistoryItem from "./_components/GameHistoryItem";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { BottomNav } from "@/components/BottomNav";
import { SubHeader } from "@/components/ui/SubHeader";

// ==========================================
// COMPONENT
// ==========================================

export default function GamesPage() {
  const { games, isLoading, user } = useProfile();

  if (isLoading) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center">
          <WaffleLoader text="LOADING GAMES..." />
        </div>
        <BottomNav />
      </>
    );
  }

  // Transform games to expected format
  const gameHistory = games.map((g) => ({
    id: g.id,
    onchainId: g.onchainId,
    name: g.title,
    score: g.score,
    claimedAt: g.claimedAt,
    winnings: g.winnings,
    winningsColor: g.winnings > 0 ? ("green" as const) : ("gray" as const),
  }));

  return (
    <>
      <SubHeader title="GAME HISTORY" />
      <main
        className={cn(
          "mx-auto w-full max-w-lg flex-1",
          "px-4",
          "pb-[calc(env(safe-area-inset-bottom)+84px)]",
          "mt-4"
        )}
      >
        {gameHistory.length > 0 ? (
          <ul className="flex flex-col gap-3.5">
            {gameHistory.map((g) => (
              <li key={g.id}>
                <GameHistoryItem game={g} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center justify-center py-6 px-4 border border-white/10 rounded-2xl bg-white/5">
            <p className="font-display text-sm text-white/40 text-center">
              No games played yet
            </p>
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}