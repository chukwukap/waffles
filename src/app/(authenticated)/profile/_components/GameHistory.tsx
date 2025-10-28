"use client"; // Required for Next.js Link component

import { WaffleIcon, ZapIcon } from "@/components/icons"; //

import Link from "next/link"; //
import React from "react"; //
import { cn } from "@/lib/utils"; // Import cn utility
import { GameHistoryEntry } from "@/state/types";

// Props for the main GameHistory section component
interface GameHistoryProps {
  gameHistory: GameHistoryEntry[]; // Expects an array of game history items
}

// Props for the individual GameHistoryItem component
interface GameHistoryItemProps {
  game: GameHistoryEntry; // Expects a single game history item
}

/**
 * Renders a single item representing a past game's results.
 * Purely presentational.
 */
export const GameHistoryItem = ({ game }: GameHistoryItemProps) => {
  // Export if used elsewhere, use interface
  // Format winnings with a dollar sign
  const formattedWinnings = `$${game.winnings.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`; // Format winnings

  return (
    //
    <div
      className={cn(
        // Base styles merged with cn
        "flex items-center justify-between", // Flex layout
        "noise rounded-2xl border border-white/20", // Background, border, radius
        "p-3 sm:p-4" // Padding
      )}
    >
      {/* Left side: Icon, Game Name, Score */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {" "}
        {/* Added min-w-0 */}
        {/* Waffle Icon Container */}
        <div className="size-10 grid shrink-0 place-items-center rounded-full bg-white/10">
          {" "}
          {/* */}
          <WaffleIcon aria-hidden className="text-waffle-yellow" />{" "}
          {/* Use theme color */}
        </div>
        {/* Game Name and Score */}
        <div className="min-w-0 flex flex-col gap-1">
          {" "}
          {/* Added min-w-0 */}
          {/* Game Name (truncated) */}
          <p
            className="truncate font-body" // Use font-body, add truncate
            title={game.name} // Add title for full name on hover
            style={{
              fontSize: "clamp(1.125rem, 2.2vw, 1.25rem)", // Responsive font size
              lineHeight: "100%", //
              letterSpacing: "-0.03em", //
            }}
          >
            {game.name} {/* */}
          </p>
          {/* Score */}
          <div className="mt-1 flex items-center gap-1">
            {" "}
            {/* */}
            <span className="text-waffle-yellow" aria-hidden>
              {" "}
              {/* */}
              <ZapIcon /> {/* */}
            </span>{" "}
            {/* */}
            <span
              className="font-display font-medium text-white/90 tracking-[-0.03em]" //
              style={{
                fontSize: "clamp(0.75rem, 1.1vw, 0.875rem)", // Responsive font size
                lineHeight: "1rem", //
              }}
            >
              {game.score.toLocaleString()} {/* Format score with commas */}
            </span>{" "}
            {/* */}
          </div>
        </div>
      </div>

      {/* Right side: Winnings */}
      <p
        className={cn(
          // Use cn for conditional styling
          "ml-3 shrink-0 whitespace-nowrap font-display font-medium", // Base styles
          game.winningsColor === "green" ? "text-success" : "text-muted" // Conditional text color
        )}
        style={{
          fontSize: "clamp(1rem, 1.8vw, 1rem)", // Responsive font size
          lineHeight: "1.2rem", //
          letterSpacing: "-0.03em", //
        }}
      >
        {formattedWinnings} {/* Display formatted winnings */}
      </p>
    </div>
  );
};

/**
 * Renders the "Past games" section on the profile page,
 * displaying a limited number of recent games and a link to the full history.
 */
export function GameHistory({ gameHistory }: GameHistoryProps) {
  // Use interface
  // Show only the first 2 games, or fewer if the history is short
  const displayedGames = gameHistory.slice(0, 2); //

  return (
    <section aria-labelledby="past-games-heading" className="w-full">
      {" "}
      {/* */}
      {/* Section Header */}
      <div className="mb-3.5 flex items-center justify-between font-semibold">
        {" "}
        {/* */}
        <h2
          id="past-games-heading" // ID for aria-labelledby
          className="font-display font-medium text-muted tracking-[-0.03em]" //
          style={{
            fontSize: "clamp(0.875rem, 1.5vw, 1rem)", // Responsive font size
            lineHeight: "130%", //
          }}
        >
          Past games {/* */}
        </h2>
        {/* Link to full history page */}
        <Link
          href="/profile/history" //
          className="font-display font-medium text-waffle-gold tracking-[-0.03em] hover:underline" //
          style={{
            fontSize: "clamp(0.875rem, 1.5vw, 1rem)", // Responsive font size
            lineHeight: "130%", //
          }}
        >
          View all {/* */}
        </Link>
      </div>
      {/* List of Game Items */}
      {displayedGames.length > 0 ? (
        <ul className="space-y-2">
          {" "}
          {/* Use ul for list */}
          {displayedGames.map(
            (
              game //
            ) => (
              <li key={game.id}>
                {" "}
                {/* Use game.id as key */}
                <GameHistoryItem game={game} /> {/* Render item component */}
              </li>
            )
          )}
        </ul>
      ) : (
        // Optional: Add a message if there's no game history yet
        <div className="panel rounded-2xl p-4 text-center text-sm text-muted">
          No past games played yet.
        </div>
      )}
    </section>
  );
} //
