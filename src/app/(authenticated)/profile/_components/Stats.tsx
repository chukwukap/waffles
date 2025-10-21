// Stats Section
import { GamePadIcon, WinningsIcon, WinsIcon } from "@/components/icons";
import Link from "next/link";
import React from "react";

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: number | string;
};

export function Stats({
  stats,
}: {
  stats: { games: number; wins: number; winnings: number };
}) {
  return (
    <section aria-labelledby="stats-heading" className="w-full ">
      <div className="flex items-center justify-between mb-3.5 font-semibold">
        <h2
          id="stats-heading"
          className="font-display text-muted tracking-[-0.03em]"
          style={{
            // ~14–16px depending on width, 130% line-height
            fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
            lineHeight: "130%",
          }}
        >
          Stats
        </h2>
        <Link
          href="/profile/stats"
          className="font-display text-waffle-gold tracking-[-0.03em] hover:underline"
          style={{
            fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
            lineHeight: "130%",
          }}
        >
          View all
        </Link>
      </div>

      {/* Always 3 cards like the design, but fluid widths & spacing */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={<GamePadIcon />} label="Games" value={stats.games} />
        <StatCard icon={<WinsIcon />} label="Wins" value={stats.wins} />
        <StatCard
          icon={<WinningsIcon />}
          label="Winnings"
          value={stats.winnings}
        />
      </div>
    </section>
  );
}

export const StatCard = ({ icon, label, value }: StatCardProps) => (
  <div
    className={[
      "flex-1",
      "flex flex-col justify-between",

      "noise ",
      "rounded-2xl border border-white/20 ",
      "p-3 sm:p-4 gap-5",
      // keep heights visually consistent without hardcoding 74px
      "min-h-[3.75rem] sm:min-h-[4.25rem]",
    ].join(" ")}
  >
    <p
      className="font-display font-medium text-muted tracking-[-0.03em]"
      style={{
        // ~13–14px fluid label, 130% line-height
        fontSize: "clamp(0.8125rem, 1.3vw, 0.875rem)",
        lineHeight: "130%",
      }}
    >
      {label}
    </p>

    <div className="flex items-center gap-1">
      {/* icon inherits the yellow from the design */}
      <span className="shrink-0 text-waffle-yellow" aria-hidden>
        {icon}
      </span>
      <p
        className="font-body leading-none"
        style={{
          // ~20px value on small, scales up slightly; 100% line-height like Figma
          fontSize: "clamp(1.125rem, 2.2vw, 1.25rem)",
          lineHeight: "100%",
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </p>
    </div>
  </div>
);
