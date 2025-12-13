"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/miniapp-sdk";
import { cn } from "@/lib/utils";
import { GameHistoryEntry } from "@/lib/types";
import GameHistoryItem from "./_components/GameHistoryItem";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { BottomNav } from "@/components/BottomNav";

export default function HistoryClient() {
  const router = useRouter();
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        // Fetch user's game history
        const gamesRes = await sdk.quickAuth.fetch("/api/v1/me/games");
        if (!gamesRes.ok) {
          if (gamesRes.status === 401) {
            router.push("/invite");
            return;
          }
          throw new Error("Failed to fetch games");
        }
        const gamesData = await gamesRes.json();

        // Transform to GameHistoryEntry format
        const history: GameHistoryEntry[] = gamesData.map((g: any) => ({
          id: g.gameId,
          name: g.game?.title ?? "Game",
          score: g.score ?? 0,
          claimedAt: g.claimedAt,
          winnings: g.rank === 1 ? 50 : 0, // Winner gets $50
          winningsColor: g.rank === 1 ? "green" : "gray",
        }));

        setGameHistory(history);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, [router]);

  if (isLoading) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center">
          <WaffleLoader text="LOADING HISTORY..." />
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <main
        className={cn(
          "mx-auto w-full max-w-lg",
          "px-4",
          "pb-[calc(env(safe-area-inset-bottom)+84px)]",
          "mt-4 flex-1"
        )}
      >
        {gameHistory && gameHistory.length > 0 && (
          <ul className="flex flex-col gap-3.5 sm:gap-4">
            {gameHistory.map((g) => (
              <li key={g.id}>
                <GameHistoryItem game={g} />
              </li>
            ))}
          </ul>
        )}

        {(!gameHistory || gameHistory.length === 0) && (
          <div className="panel rounded-2xl p-6 text-center text-sm text-muted mt-6">
            You haven&apos;t played any games yet.
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
