// Past Games Section
import { WaffleIcon, ZapIcon } from "@/components/icons";
import Link from "next/link";
import React from "react";

type Game = {
  id: string;
  name: string;
  score: number | string;
  winnings: number;
  winningsColor?: "green" | "gray";
};

export function PastGames({ pastGames }: { pastGames: Game[] }) {
  return (
    <section aria-labelledby="past-games-heading" className="w-full">
      <div className="flex items-center justify-between mb-3.5 font-semibold">
        <h2
          id="past-games-heading"
          className="font-display font-medium text-muted tracking-[-0.03em]"
          style={{
            fontSize: "clamp(0.875rem, 1.5vw, 1rem)", // ~14–16
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

      {/* Show two items like the design; spacing scales with screen */}
      <ul className="space-y-2">
        {pastGames.slice(0, 2).map((game) => (
          <li key={game.id}>
            <GameHistoryItem game={game} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export const GameHistoryItem = ({ game }: { game: Game }) => {
  const amount = "$" + game.winnings;

  return (
    <div
      className={[
        "flex items-center justify-between",
        "noise rounded-2xl border border-white/20 ",
        "p-3 sm:p-4",
      ].join(" ")}
    >
      {/* Left block: avatar-ish icon + name + score */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="size-10 rounded-full bg-white/10 grid place-items-center shrink-0">
          <WaffleIcon aria-hidden className="text-waffle-yellow" />
        </div>

        <div className="min-w-0 flex flex-col gap-1">
          <p
            className="font-body truncate"
            style={{
              fontSize: "clamp(1.125rem, 2.2vw, 1.25rem)", // ~18–20
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
                fontSize: "clamp(0.75rem, 1.1vw, 0.875rem)", // ~12–14
                lineHeight: "1rem",
              }}
            >
              {game.score}
            </span>
          </div>
        </div>
      </div>

      {/* Right block: winnings */}
      <p
        className={[
          "font-display font-medium whitespace-nowrap ml-3",
          game.winningsColor === "green" ? "text-success" : "text-muted",
        ].join(" ")}
        style={{
          fontSize: "clamp(1rem, 1.8vw, 1rem)", // ~16
          lineHeight: "1.2rem",
          letterSpacing: "-0.03em",
        }}
      >
        {amount}
      </p>
    </div>
  );
};
