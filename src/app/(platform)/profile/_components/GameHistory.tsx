"use client";
import Link from "next/link";

import { GameHistoryEntry } from "@/lib/types";
import GameHistoryItem from "./GameHistoryItem";

interface GameHistoryProps {
  gameHistory: GameHistoryEntry[];
}

export default function GameHistory({ gameHistory }: GameHistoryProps) {
  const displayedGames = gameHistory.slice(0, 2);

  return (
    <section aria-labelledby="past-games-heading" className="w-full">
      <div className="mb-3.5 flex items-center justify-between font-semibold">
        <h2
          id="past-games-heading"
          className="font-display font-medium text-muted tracking-[-0.03em]"
          style={{
            fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
            lineHeight: "130%",
          }}
        >
          Past games
        </h2>
        <Link
          href="/profile/history"
          className="font-display font-medium text-waffle-gold tracking-[-0.03em] hover:underline"
          style={{
            fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
            lineHeight: "130%",
          }}
        >
          View all
        </Link>
      </div>
      {displayedGames.length > 0 ? (
        <ul className="space-y-2">
          {displayedGames.map((game) => (
            <li key={game.id}>
              <GameHistoryItem game={game} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="panel rounded-2xl p-4 text-center text-sm text-muted">
          No past games played yet.
        </div>
      )}
    </section>
  );
}
