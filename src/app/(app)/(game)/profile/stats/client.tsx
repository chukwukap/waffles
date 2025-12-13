"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/miniapp-sdk";
import { AllTimeStats } from "@/lib/types";
import { cn } from "@/lib/utils";
import { IconStatCard } from "./_components/IconStatCard";
import { LargeStat } from "./_components/LargeStatCard";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { BottomNav } from "@/components/BottomNav";

export default function StatsClient() {
  const router = useRouter();
  const [allTimeStats, setAllTimeStats] = useState<AllTimeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch user's game history to calculate stats
        const gamesRes = await sdk.quickAuth.fetch("/api/v1/me/games");
        if (!gamesRes.ok) {
          if (gamesRes.status === 401) {
            router.push("/invite");
            return;
          }
          throw new Error("Failed to fetch games");
        }
        const gamesData = await gamesRes.json();

        const totalGames = gamesData.length;
        if (totalGames === 0) {
          setAllTimeStats({
            totalGames: 0,
            wins: 0,
            winRate: "0%",
            totalWon: "$0.00",
            highestScore: 0,
            averageScore: 0,
            currentStreak: 0,
            bestRank: "-",
          });
          setIsLoading(false);
          return;
        }

        // Calculate stats from games
        let wins = 0;
        let totalWon = 0;
        let highestScore = 0;
        let scoreSum = 0;
        let bestRank: number = Infinity;

        for (const game of gamesData) {
          if (game.rank === 1) {
            wins++;
            totalWon += 50; // Winner prize placeholder
          }
          if (game.score > highestScore) {
            highestScore = game.score;
          }
          scoreSum += game.score ?? 0;
          if (game.rank !== null && game.rank < bestRank) {
            bestRank = game.rank;
          }
        }

        const averageScore = totalGames > 0 ? scoreSum / totalGames : 0;
        const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

        setAllTimeStats({
          totalGames,
          wins,
          winRate: `${winRate.toFixed(1)}%`,
          totalWon: totalWon.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          }),
          highestScore,
          averageScore: Math.round(averageScore),
          currentStreak: 0, // TODO: implement streak calculation
          bestRank: bestRank === Infinity ? "-" : bestRank,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [router]);

  const formattedStats = useMemo(() => {
    if (!allTimeStats) return null;
    return allTimeStats;
  }, [allTimeStats]);

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

  return (
    <>
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
                "w-full max-w-lg h-[200px]",
                "rounded-2xl border border-white/20",
                "py-6 px-3"
              )}
            >
              <LargeStat
                label="Total games"
                value={formattedStats?.totalGames ?? 0}
              />
              <LargeStat label="Wins" value={formattedStats?.wins ?? 0} />
              <LargeStat
                label="Win rate"
                value={formattedStats?.winRate ?? ""}
              />
              <LargeStat
                label="Total won"
                value={formattedStats?.totalWon ?? ""}
              />
            </section>
            <section
              className={cn(
                "grid grid-cols-2 gap-x-6 gap-y-6 justify-items-center",
                "w-full max-w-lg h-[262px]",
                "rounded-2xl border border-white/20",
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
            </section>
          </>
        )}

        {!allTimeStats && (
          <div className="panel rounded-2xl p-6 text-center text-sm text-muted mt-6">
            No stats available yet.
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
