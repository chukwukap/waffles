import { AllTimeStats } from "@/state/types";
import React, { use } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
export default function StatsClient({
  payloadPromise,
}: {
  payloadPromise: Promise<AllTimeStats>;
}) {
  const allTimeStats = use(payloadPromise);

  const formattedStats = React.useMemo(() => {
    if (!allTimeStats) return null;

    return {
      totalGames: allTimeStats.totalGames,
      wins: allTimeStats.wins,
      winRate: `${Math.round(Number(allTimeStats.winRate) * 10) / 10}%`,
      totalWon: `$${Number(allTimeStats.totalWon).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      highestScore: allTimeStats.highestScore,
      averageScore: Math.round(Number(allTimeStats.averageScore) * 100) / 100,
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
            className={cn("rounded-2xl border border-white/20 p-4 sm:p-5")}
            aria-labelledby="total-stats-heading"
          >
            <h2 id="total-stats-heading" className="sr-only">
              Total Statistics
            </h2>
            <div
              className={cn(
                "grid grid-cols-2 gap-x-4 gap-y-4 sm:gap-y-6 justify-items-center"
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
            </div>
          </section>{" "}
          <section
            className={cn("rounded-2xl border border-white/20 p-4 sm:p-5")}
            aria-labelledby="detailed-stats-heading"
          >
            <h2 id="detailed-stats-heading" className="sr-only">
              Detailed Statistics
            </h2>
            <div
              className={cn(
                "grid grid-cols-2 gap-x-6 gap-y-6 sm:gap-y-8 justify-items-center"
              )}
            >
              <IconStat
                icon="/images/icons/trophy.svg"
                label="Highest score"
                value={formattedStats?.highestScore ?? 0}
              />
              <IconStat
                icon="/images/icons/average.svg"
                label="Average score"
                value={formattedStats?.averageScore ?? 0}
              />
              <IconStat
                icon="/images/icons/streak-flame.svg"
                label="Current streak"
                value={formattedStats?.currentStreak ?? 0}
              />
              <IconStat
                icon="/images/icons/rank.svg"
                label="Best rank"
                value={formattedStats?.bestRank ?? ""}
              />
            </div>
          </section>{" "}
        </>
      )}

      {!allTimeStats && (
        <div className="panel rounded-2xl p-6 text-center text-sm text-muted mt-6">
          No stats available yet.
        </div>
      )}
    </main>
  );
}

const LargeStat = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex flex-col items-center justify-center gap-2">
    <p
      className="text-muted font-display"
      style={{
        fontWeight: 500,
        fontSize: "clamp(.9rem, 2.8vw, 1rem)",
        lineHeight: "1.3",
        letterSpacing: "-0.03em",
      }}
    >
      {label}
    </p>{" "}
    <p
      className="text-white font-body"
      style={{
        fontSize: "clamp(1.15rem, 4vw, 1.25rem)",
        lineHeight: "1",
      }}
    >
      {typeof value === "number" ? value.toLocaleString() : value}
    </p>{" "}
  </div>
);

const IconStat = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) => (
  <div className="flex flex-col items-center justify-center gap-1">
    <Image
      src={icon}
      alt=""
      width={36}
      height={36}
      className="h-9 w-9"
      priority={false}
    />
    <p
      className="text-muted text-center font-display"
      style={{
        fontWeight: 500,
        fontSize: "clamp(.9rem, 2.8vw, 1rem)",
        lineHeight: "1.3",
        letterSpacing: "-0.03em",
      }}
    >
      {label}
    </p>{" "}
    <p
      className="text-white leading-none font-body"
      style={{
        fontSize: "clamp(1.15rem, 4vw, 1.25rem)",
        lineHeight: "1",
      }}
    >
      {typeof value === "number" ? value.toLocaleString() : value}
    </p>{" "}
  </div>
);
