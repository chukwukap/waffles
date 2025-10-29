"use client";

import { WaffleIcon, ZapIcon } from "@/components/icons";

import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";
import { GameHistoryEntry } from "@/state/types";

interface GameHistoryProps {
  gameHistory: GameHistoryEntry[];
}

interface GameHistoryItemProps {
  game: GameHistoryEntry;
}

export const GameHistoryItem = ({ game }: GameHistoryItemProps) => {
  const formattedWinnings = `$${game.winnings.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <div
      className={cn(
        "flex items-center justify-between",
        "noise rounded-2xl border border-white/20",
        "p-3 sm:p-4"
      )}
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="size-10 grid shrink-0 place-items-center rounded-full bg-white/10">
          <WaffleIcon aria-hidden className="text-waffle-yellow" />
        </div>
        <div className="min-w-0 flex flex-col gap-1">
          <p
            className="truncate font-body"
            title={game.name}
            style={{
              fontSize: "clamp(1.125rem, 2.2vw, 1.25rem)",
              lineHeight: "100%",
              letterSpacing: "-0.03em",
            }}
          >
            {game.name}
          </p>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-waffle-yellow" aria-hidden>
              <ZapIcon />
            </span>
            <span
              className="font-display font-medium text-white/90 tracking-[-0.03em]"
              style={{
                fontSize: "clamp(0.75rem, 1.1vw, 0.875rem)",
                lineHeight: "1rem",
              }}
            >
              {game.score.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <p
        className={cn(
          "ml-3 shrink-0 whitespace-nowrap font-display font-medium",
          game.winningsColor === "green" ? "text-success" : "text-muted"
        )}
        style={{
          fontSize: "clamp(1rem, 1.8vw, 1rem)",
          lineHeight: "1.2rem",
          letterSpacing: "-0.03em",
        }}
      >
        {formattedWinnings}
      </p>
    </div>
  );
};

export function GameHistory({ gameHistory }: GameHistoryProps) {
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
