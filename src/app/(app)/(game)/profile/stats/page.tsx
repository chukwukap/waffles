"use client";

import { useProfile } from "../ProfileProvider";
import { cn } from "@/lib/utils";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { BottomNav } from "@/components/BottomNav";
import { SubHeader } from "@/components/ui/SubHeader";
import Image from "next/image";

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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

  const formattedWinRate = `${stats.winRate.toFixed(0)}%`;

  return (
    <>
      <SubHeader title="ALL STATS" />
      <main
        className={cn(
          "mx-auto w-full max-w-lg flex-1",
          "px-4",
          // "pb-[calc(env(safe-area-inset-bottom)+84px)]",
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

const LargeStat = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex flex-col items-center justify-center gap-1.5 w-[162.5px] h-[70px]">
    <p className="text-muted font-display font-medium text-base leading-[1.3] tracking-[-0.03em] text-center">
      {label}
    </p>
    <p className="text-white font-body font-normal text-[38px] leading-[1.3] tracking-normal">
      {typeof value === "number" ? value.toLocaleString() : value}
    </p>
  </div>
);

const IconStatCard = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) => (
  <div className="flex h-[99px] w-[156px] flex-col items-center justify-center gap-1">
    <Image
      src={icon}
      alt=""
      width={36}
      height={36}
      className="h-9 w-9"
      priority={false}
    />
    <p className="font-display font-medium text-base leading-[130%] tracking-[-0.03em] text-center text-[#99A0AE]">
      {label}
    </p>
    <p className="font-body font-normal text-[38px] leading-none tracking-normal text-white">
      {typeof value === "number" ? value.toLocaleString() : value}
    </p>
  </div>
);
