import { AllTimeStats } from "@/lib/types";
import React, { use } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { IconStatCard } from "./_components/IconStatCard";
import { LargeStat } from "./_components/LargeStatCard";
export default function StatsClient({
  payloadPromise,
}: {
  payloadPromise: Promise<AllTimeStats>;
}) {
  const allTimeStats = use(payloadPromise);

  const formattedStats = React.useMemo(() => {
    if (!allTimeStats) return null;

    const safeNumber = (value: any) => (isNaN(Number(value)) ? 0 : Number(value));

    return {
      totalGames: allTimeStats.totalGames,
      wins: allTimeStats.wins,
      winRate: `${Math.round(safeNumber(allTimeStats.winRate) * 10) / 10}%`,
      totalWon: `$${safeNumber(allTimeStats.totalWon).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      highestScore: allTimeStats.highestScore,
      averageScore: Math.round(safeNumber(allTimeStats.averageScore) * 100) / 100,
      currentStreak: allTimeStats.currentStreak,
      bestRank:
        allTimeStats.bestRank === Infinity ? "-" : allTimeStats.bestRank,
    };
  }, [allTimeStats]);

  return (
    <main
      className={cn(
        "mx-auto w-full max-w-lg flex-1",
        "px-4",
        "pb-[calc(env(safe-area-inset-bottom)+84px)]",
        "flex flex-col gap-5 sm:gap-6",
        "mt-4"
      )}
    >
      {allTimeStats && (
        <>
          <section
            className={cn(
              "grid grid-cols-2 gap-3 justify-items-center",
              "w-[361px] h-[200px]",
              "rounded-2xl border border-white/20",
              "py-6 px-3"
            )}
          >
            <LargeStat
              label="Total games"
              value={formattedStats?.totalGames ?? 0}
            />{" "}
            <LargeStat label="Wins" value={formattedStats?.wins ?? 0} />
            <LargeStat
              label="Win rate"
              value={formattedStats?.winRate ?? ""}
            />{" "}
            <LargeStat
              label="Total won"
              value={formattedStats?.totalWon ?? ""}
            />{" "}
          </section>
          <section
            className={cn(
              "grid grid-cols-2 gap-x-6 gap-y-6 justify-items-center",
              "w-[361px] h-[262px]",
              "rounded-2xl border border-white/20", // Assuming border color, user said border-width: 1px
              "pt-5 pb-5 px-3"
            )}
          >


            <IconStatCard
              icon="/images/icons/trophy.svg"
              label="Highest score"
              value={formattedStats?.highestScore ?? 0}
            />
            <IconStatCard
              icon="/images/icons/average.svg"
              label="Average score"
              value={formattedStats?.averageScore ?? 0}
            />
            <IconStatCard
              icon="/images/icons/streak-flame.svg"
              label="Current streak"
              value={formattedStats?.currentStreak ?? 0}
            />
            <IconStatCard
              icon="/images/icons/rank.svg"
              label="Best rank"
              value={formattedStats?.bestRank ?? ""}
            />

          </section>{" "}
        </>
      )
      }

      {
        !allTimeStats && (
          <div className="panel rounded-2xl p-6 text-center text-sm text-muted mt-6">
            No stats available yet.
          </div>
        )
      }
    </main >
  );
}


