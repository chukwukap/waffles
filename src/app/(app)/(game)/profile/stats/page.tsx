"use client";

import { useProfile } from "../ProfileProvider";
import { cn } from "@/lib/utils";
import { IconStatCard } from "./_components/IconStatCard";
import { LargeStat } from "./_components/LargeStatCard";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { BottomNav } from "@/components/BottomNav";
import { SubHeader } from "@/components/ui/SubHeader";

// ==========================================
// COMPONENT
// ==========================================

export default function StatsPage() {
  const { stats, isLoading } = useProfile();

  if (isLoading) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center">
          <WaffleLoader text="LOADING STATS..." />
        </div>
        <BottomNav />
      </>
    );
  }

  if (!stats) {
    return (
      <>
        <SubHeader title="ALL STATS" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/40 font-display">No stats available</p>
        </div>
        <BottomNav />
      </>
    );
  }

  const formattedWinnings = `$${stats.totalWon.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const formattedWinRate = `${stats.winRate.toFixed(1)}%`;

  return (
    <>
      <SubHeader title="ALL STATS" />
      <main
        className={cn(
          "mx-auto w-full max-w-lg flex-1",
          "px-4",
          "pb-[calc(env(safe-area-inset-bottom)+84px)]",
          "flex flex-col gap-5",
          "mt-4"
        )}
      >
        {/* Main Stats Grid */}
        <section
          className={cn(
            "grid grid-cols-2 gap-3 justify-items-center",
            "w-full max-w-lg",
            "rounded-2xl border border-white/20",
            "py-6 px-3"
          )}
        >
          <LargeStat label="Total games" value={stats.totalGames} />
          <LargeStat label="Wins" value={stats.wins} />
          <LargeStat label="Win rate" value={formattedWinRate} />
          <LargeStat label="Total won" value={formattedWinnings} />
        </section>

        {/* Secondary Stats Grid */}
        <section
          className={cn(
            "grid grid-cols-2 gap-x-6 gap-y-6 justify-items-center",
            "w-full max-w-lg",
            "rounded-2xl border border-white/20",
            "pt-5 pb-5 px-3"
          )}
        >
          <IconStatCard
            icon="/images/icons/trophy.svg"
            label="Highest score"
            value={stats.highestScore}
          />
          <IconStatCard
            icon="/images/icons/average.svg"
            label="Average score"
            value={stats.avgScore}
          />
          <IconStatCard
            icon="/images/icons/streak-flame.svg"
            label="Current streak"
            value={stats.currentStreak}
          />
          <IconStatCard
            icon="/images/icons/rank.svg"
            label="Best rank"
            value={stats.bestRank ?? "-"}
          />
        </section>
      </main>
      <BottomNav />
    </>
  );
}
