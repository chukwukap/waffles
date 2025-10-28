"use client"; // Required for hooks (SWR, useEffect), Link, etc.

import Link from "next/link"; //
import Image from "next/image"; //
import useSWR from "swr"; // Import useSWR
import { ArrowLeftIcon, WalletIcon } from "@/components/icons"; //
import LogoIcon from "@/components/logo/LogoIcon"; //
import { BottomNav } from "@/components/BottomNav"; //
import { useMiniUser } from "@/hooks/useMiniUser"; //
import { cn } from "@/lib/utils"; // Import cn
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet"; // For balance
import { env } from "@/lib/env"; // For env vars
import { base } from "wagmi/chains"; // For chain ID
import React from "react";

// --- SWR Fetcher ---
// Reusing fetcher from previous refactor
const fetcherWithFid = (url: string, fid: string | null) => {
  if (!fid) return Promise.reject(new Error("FID required for fetch"));
  return fetch(url, {
    headers: { "x-farcaster-id": fid },
    cache: "no-store",
  }).then(async (res) => {
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const error = new Error(
        `API Error (${res.status}): ${errorBody?.error || res.statusText}`
      );
      (error as Error & { status?: number }).status = res.status;
      throw error;
    }
    return res.json();
  });
};

// --- Type for SWR Data ---
// Reusing the type from the previous refactor
interface ProfileStatsData {
  totalGames: number;
  wins: number;
  winRate: number; // Raw number
  totalWon: number; // Raw number
  highestScore: number;
  avgScore: number;
  currentStreak: number;
  bestRank: number | string;
}

/* ---------- Top bar (shared look) ---------- */
// This TopBar is identical to the one in history/page.tsx - consider moving to a shared component
const TopBar = () => {
  const user = useMiniUser();
  const { status, roundedBalance } = useGetTokenBalance(
    user.wallet as `0x${string}`,
    {
      address: env.nextPublicUsdcAddress as `0x${string}`,
      chainId: base.id,
      decimals: 6,
      image: "/images/tokens/usdc.png",
      name: "USDC",
      symbol: "USDC",
    }
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-10 w-full",
        "border-b border-[color:var(--surface-stroke)]",
        "bg-[color:var(--brand-ink-900)]/80 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-3">
        <LogoIcon />
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
          <WalletIcon className="h-4 w-4 text-[color:var(--text-primary)]" />
          <span
            className="text-center text-[color:var(--text-primary)] font-display tabular-nums"
            style={{
              fontSize: "clamp(.9rem, 1.8vw, .95rem)",
              lineHeight: "1.1",
            }}
          >
            {status === "pending" ? "Loading..." : `$${roundedBalance}`}
          </span>
        </div>
      </div>
    </header>
  );
};

/* ---------- Sub page header ---------- */
// Also identical to history/page.tsx - consider moving to a shared component
const SubPageHeader = (
  { title }: { title: string } //
) => (
  <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 pt-4">
    {" "}
    {/* */}
    <Link
      href="/profile" //
      className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/15 transition-opacity hover:opacity-80" //
      aria-label="Back to profile" //
    >
      <ArrowLeftIcon /> {/* */}
    </Link>
    <h1
      className="flex-grow text-center text-white font-body" //
      style={{
        fontWeight: 400, //
        fontSize: "clamp(1.25rem, 4.5vw, 1.375rem)", //
        lineHeight: ".92", //
        letterSpacing: "-0.03em", //
      }}
    >
      {title} {/* */}
    </h1>
    <div className="h-[34px] w-[34px]" aria-hidden="true" /> {/* Spacer */}
  </div>
);

/* ---------- Stat atoms (identical to history/page.tsx - move to shared) ---------- */
// Assuming LargeStat and IconStat components are defined or imported from a shared location
const LargeStat = ({
  //
  label, //
  value, //
}: {
  label: string; //
  value: string | number; //
}) => (
  <div className="flex flex-col items-center justify-center gap-2">
    {" "}
    {/* */}
    <p
      className="text-muted font-display" //
      style={{
        fontWeight: 500, //
        fontSize: "clamp(.9rem, 2.8vw, 1rem)", //
        lineHeight: "1.3", //
        letterSpacing: "-0.03em", //
      }}
    >
      {label} {/* */}
    </p>{" "}
    {/* */}
    <p
      className="text-white font-body" //
      style={{
        fontSize: "clamp(1.15rem, 4vw, 1.25rem)", //
        lineHeight: "1", //
      }}
    >
      {/* Format numbers */}
      {typeof value === "number" ? value.toLocaleString() : value}
    </p>{" "}
    {/* */}
  </div>
);

const IconStat = ({
  //
  icon, //
  label, //
  value, //
}: {
  icon: string; // Expects image src string
  label: string; //
  value: string | number; //
}) => (
  <div className="flex flex-col items-center justify-center gap-1">
    {" "}
    {/* */}
    <Image
      src={icon} //
      alt="" // Decorative icon
      width={36} //
      height={36} //
      className="h-9 w-9" //
      // sizes="(max-width: 420px) 36px, 36px" // Optional sizes
      priority={false} // Icons likely not priority
    />
    <p
      className="text-muted text-center font-display" // Use muted for label text
      style={{
        fontWeight: 500, //
        fontSize: "clamp(.9rem, 2.8vw, 1rem)", //
        lineHeight: "1.3", //
        letterSpacing: "-0.03em", //
      }}
    >
      {label} {/* */}
    </p>{" "}
    {/* */}
    <p
      className="text-white leading-none font-body" //
      style={{
        fontSize: "clamp(1.15rem, 4vw, 1.25rem)", //
        lineHeight: "1", //
      }}
    >
      {/* Format numbers */}
      {typeof value === "number" ? value.toLocaleString() : value}
    </p>{" "}
    {/* */}
  </div>
);

/* ---------- Page Component ---------- */
export default function AllTimeStatsPage() {
  const { fid } = useMiniUser(); // Get user FID
  const fidString = fid ? String(fid) : null;

  // --- SWR Fetching ---
  const {
    data: allTimeStats,
    error,
    isLoading,
  } = useSWR<ProfileStatsData>(
    fidString ? "/api/profile/stats" : null, // SWR key
    (url: string) => fetcherWithFid(url, fidString), // Fetcher
    { revalidateOnFocus: false } // Options
  );

  // --- Data Formatting --- (Memoize for stability)
  const formattedStats = React.useMemo(() => {
    if (!allTimeStats) return null;

    return {
      totalGames: allTimeStats.totalGames,
      wins: allTimeStats.wins,
      winRate: `${Math.round(allTimeStats.winRate * 10) / 10}%`, // Format %
      totalWon: `$${allTimeStats.totalWon.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`, // Format $
      highestScore: allTimeStats.highestScore,
      averageScore: Math.round(allTimeStats.avgScore * 100) / 100, // Format avg
      currentStreak: allTimeStats.currentStreak,
      bestRank:
        allTimeStats.bestRank === Infinity ? "-" : allTimeStats.bestRank, // Handle infinity
    };
  }, [allTimeStats]);

  // --- Render ---
  return (
    //
    <div className={cn("min-h-screen flex flex-col", "bg-figma noise")}>
      {" "}
      {/* Base styles */}
      <TopBar /> {/* Shared header */}
      <SubPageHeader title="ALL-TIME STATS" /> {/* Sub header */}
      <main
        className={cn(
          // Main content styles
          "mx-auto w-full max-w-lg flex-1", // Layout, grow
          "px-4", // Padding
          "pb-[calc(env(safe-area-inset-bottom)+84px)]", // Bottom padding
          "flex flex-col gap-5 sm:gap-6", // Flex column, gap
          "mt-4" // Top margin
        )}
      >
        {/* Conditional Rendering based on SWR state */}
        {isLoading && (
          <div className="flex justify-center items-center pt-10 text-muted">
            Loading stats...
          </div>
        )}

        {error && (
          <div className="panel rounded-2xl p-4 text-center text-sm text-danger">
            Error loading stats: {error.message}
          </div>
        )}

        {!isLoading &&
          !error &&
          formattedStats && ( // Render only if data is loaded and formatted
            <>
              {/* ---- Block 1: Totals ---- */}
              <section
                className={cn("rounded-2xl border border-white/20 p-4 sm:p-5")} // Styling
                aria-labelledby="total-stats-heading" // Accessibility
              >
                <h2 id="total-stats-heading" className="sr-only">
                  Total Statistics
                </h2>
                <div
                  className={cn(
                    "grid grid-cols-2 gap-x-4 gap-y-4 sm:gap-y-6 justify-items-center"
                  )} // Grid layout
                >
                  <LargeStat
                    label="Total games"
                    value={formattedStats.totalGames}
                  />{" "}
                  {/* */}
                  <LargeStat label="Wins" value={formattedStats.wins} /> {/* */}
                  <LargeStat
                    label="Win rate"
                    value={formattedStats.winRate}
                  />{" "}
                  {/* Use formatted */}
                  <LargeStat
                    label="Total won"
                    value={formattedStats.totalWon}
                  />{" "}
                  {/* Use formatted */}
                </div>
              </section>{" "}
              {/* */}
              {/* ---- Block 2: Icon stats ---- */}
              <section
                className={cn("rounded-2xl border border-white/20 p-4 sm:p-5")} // Styling
                aria-labelledby="detailed-stats-heading" // Accessibility
              >
                <h2 id="detailed-stats-heading" className="sr-only">
                  Detailed Statistics
                </h2>
                <div
                  className={cn(
                    "grid grid-cols-2 gap-x-6 gap-y-6 sm:gap-y-8 justify-items-center"
                  )} // Grid layout
                >
                  <IconStat
                    icon="/images/icons/trophy.svg" //
                    label="Highest score" //
                    value={formattedStats.highestScore} //
                  />
                  <IconStat
                    icon="/images/icons/average.svg" //
                    label="Average score" //
                    value={formattedStats.averageScore} // Use formatted
                  />
                  <IconStat
                    icon="/images/icons/streak-flame.svg" //
                    label="Current streak" //
                    value={formattedStats.currentStreak} //
                  />
                  <IconStat
                    icon="/images/icons/rank.svg" //
                    label="Best rank" //
                    value={formattedStats.bestRank} // Use formatted
                  />
                </div>
              </section>{" "}
              {/* */}
            </>
          )}

        {!isLoading && !error && !formattedStats && (
          // Empty State (if API returns null/empty but no error)
          <div className="panel rounded-2xl p-6 text-center text-sm text-muted mt-6">
            No stats available yet.
          </div>
        )}
      </main>
      <BottomNav /> {/* Shared bottom navigation */}
    </div>
  );
} //
