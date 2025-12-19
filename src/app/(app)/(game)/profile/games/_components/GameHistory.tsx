"use client";
import Link from "next/link";
import { GameHistoryEntry } from "@/lib/types";
import GameHistoryItem from "./GameHistoryItem";

interface GameHistoryProps {
  gameHistory: GameHistoryEntry[];
  fid: number;
}

export default function GameHistory({ gameHistory, fid }: GameHistoryProps) {
  // If on the dashboard snippet, show 3. If on full page, show all.
  // Ideally this component handles the full list rendering logic.
  const displayedGames = gameHistory;

  return (
    <section aria-labelledby="past-games-heading" className="w-full">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2
          id="past-games-heading"
          className="font-display font-medium text-[#99A0AE] tracking-[-0.03em] text-[14px]"
        >
          Recent Activity
        </h2>
        <Link
          href="/profile/games"
          className="font-display font-medium text-waffle-gold tracking-[-0.03em] hover:underline text-[14px]"
        >
          View all
        </Link>
      </div>

      {displayedGames.length > 0 ? (
        <div className="flex flex-col w-full gap-3">
          {displayedGames.map((game) => (
            <GameHistoryItem key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-6 px-4 border border-white/10 rounded-2xl bg-white/5">
          <p className="font-display text-sm text-white/40 text-center">
            No games played yet
          </p>
        </div>
      )}
    </section>
  );
}