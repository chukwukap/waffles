"use client"; // Required for Next.js Link component

import { GamePadIcon, WinningsIcon, WinsIcon } from "@/components/icons"; //
import Link from "next/link"; //
import React from "react"; //
import { cn } from "@/lib/utils"; // Import cn utility

// Define props for the StatCard sub-component
interface StatCardProps {
  icon: React.ReactNode; // Icon element
  label: string; // Label text (e.g., "Games")
  value: number | string; // Value to display
}

// Define props for the main Stats section component
interface StatsProps {
  stats: {
    // Expects an object with these stats
    games: number;
    wins: number;
    winnings: number; // Assume winnings is a raw number (e.g., total cents or dollars)
  };
}

/**
 * Renders a single statistic card with an icon, label, and value.
 * Purely presentational.
 */
export const StatCard = (
  { icon, label, value }: StatCardProps // Export if used elsewhere
) => (
  <div
    className={cn(
      // Base styles merged with cn
      "flex flex-1 flex-col justify-between", // Flex layout, takes available space
      "noise rounded-2xl border border-white/20", // Background, border, radius
      "p-3 sm:p-4 gap-4 sm:gap-5", // Responsive padding and gap - adjusted gap
      "min-h-[3.75rem] sm:min-h-[4.25rem]" // Minimum height for consistency
    )}
  >
    {/* Label */}
    <p
      className="font-display font-medium text-muted tracking-[-0.03em]" //
      style={{
        fontSize: "clamp(0.8125rem, 1.3vw, 0.875rem)", // Responsive font size
        lineHeight: "130%", //
      }}
    >
      {label} {/* */}
    </p>

    {/* Icon + Value */}
    <div className="flex items-center gap-1 sm:gap-1.5">
      {" "}
      {/* Adjusted gap */}
      {/* Icon Container */}
      <span className="shrink-0 text-waffle-yellow" aria-hidden>
        {" "}
        {/* */}
        {icon} {/* */}
      </span>
      {/* Value */}
      <p
        className="truncate font-body leading-none" // Use font-body, add truncate
        style={{
          fontSize: "clamp(1.1rem, 2.1vw, 1.2rem)", // Slightly adjusted responsive font size
          lineHeight: "100%", //
          letterSpacing: "-0.03em", //
        }}
        // Add title attribute if value might be truncated (unlikely here)
        // title={typeof value === 'number' ? value.toLocaleString() : value}
      >
        {/* Format number values with commas */}
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>{" "}
      {/* */}
    </div>
  </div>
);

/**
 * Renders the statistics section on the profile page, including cards for
 * total games, wins, and winnings, plus a link to view all stats.
 */
export function Stats({ stats }: StatsProps) {
  // Use interface
  // Format winnings value with '$' sign and appropriate decimals
  const formattedWinnings = `$${(stats?.winnings ?? 0).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2, // Always show 2 decimal places
      maximumFractionDigits: 2,
    }
  )}`;

  return (
    //
    <section aria-labelledby="stats-heading" className="w-full">
      {" "}
      {/* */}
      {/* Section Header */}
      <div className="mb-3.5 flex items-center justify-between font-semibold">
        {" "}
        {/* */}
        <h2
          id="stats-heading" // ID for aria-labelledby
          className="font-display font-medium text-muted tracking-[-0.03em]" // Style heading
          style={{
            fontSize: "clamp(0.875rem, 1.5vw, 1rem)", // Responsive font size
            lineHeight: "130%", //
          }}
        >
          Stats {/* */}
        </h2>
        {/* Link to full stats page */}
        <Link
          href="/profile/stats" //
          className="font-display font-medium text-waffle-gold tracking-[-0.03em] hover:underline" // Style link
          style={{
            fontSize: "clamp(0.875rem, 1.5vw, 1rem)", // Responsive font size
            lineHeight: "130%", //
          }}
        >
          View all {/* */}
        </Link>
      </div>
      {/* Grid of Stat Cards */}
      <div className="grid grid-cols-3 gap-2">
        {" "}
        {/* Use 3-column grid with gap */}
        <StatCard
          icon={<GamePadIcon />}
          label="Games"
          value={stats?.games ?? 0}
        />{" "}
        {/* Pass games stat */}
        <StatCard
          icon={<WinsIcon />}
          label="Wins"
          value={stats?.wins ?? 0}
        />{" "}
        {/* Pass wins stat */}
        <StatCard
          icon={<WinningsIcon />} //
          label="Winnings" //
          // Pass the pre-formatted winnings string
          value={formattedWinnings}
        />
      </div>
    </section>
  );
} //
