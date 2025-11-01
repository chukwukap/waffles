"use client";

import { GamePadIcon, WinningsIcon, WinsIcon } from "@/components/icons";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";
import { ProfileStatsData } from "@/state/types";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}

interface StatsProps {
  stats: ProfileStatsData | null;
}

export const StatCard = ({ icon, label, value }: StatCardProps) => (
  <div
    className={cn(
      // Base styles merged with cn
      "flex flex-1 flex-col justify-between", // Flex layout, takes available space
      "noise rounded-2xl border border-white/20", // Background, border, radius
      "p-3 sm:p-4 gap-4 sm:gap-5", // Responsive padding and gap - adjusted gap
      "min-h-15 sm:min-h-17" // Minimum height for consistency
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

export function Stats({ stats }: StatsProps) {
  const formattedWinnings = `$${(stats?.totalWon ?? 0).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;

  return (
    <section aria-labelledby="stats-heading" className="w-full">
      <div className="mb-3.5 flex items-center justify-between font-semibold">
        <h2
          id="stats-heading"
          className="font-display font-medium text-muted tracking-[-0.03em]"
          style={{
            fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
            lineHeight: "130%",
          }}
        >
          Stats
        </h2>
        <Link
          href="/profile/stats"
          className="font-display font-medium text-waffle-gold tracking-[-0.03em] hover:underline"
          style={{
            fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
            lineHeight: "130%",
          }}
        >
          View all
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          icon={<GamePadIcon />}
          label="Games"
          value={stats?.totalGames ?? 0}
        />{" "}
        <StatCard icon={<WinsIcon />} label="Wins" value={stats?.wins ?? 0} />{" "}
        <StatCard
          icon={<WinningsIcon />}
          label="Winnings"
          value={formattedWinnings}
        />
      </div>
    </section>
  );
}
