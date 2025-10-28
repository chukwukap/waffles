"use client"; // Required for hooks (useEffect, useSWR), Link, etc.

import Link from "next/link";
import useSWR from "swr"; // Import useSWR
import { GameHistoryEntry } from "@/state/types"; // Use type import
import { BottomNav } from "@/components/BottomNav";
import LogoIcon from "@/components/logo/LogoIcon";
import { ArrowLeftIcon, WalletIcon } from "@/components/icons";
import { GameHistoryItem } from "@/app/(authenticated)/profile/_components/GameHistory"; // Import the item component
import { useMiniUser } from "@/hooks/useMiniUser";
import { cn } from "@/lib/utils"; // Import cn
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet"; // For balance
import { env } from "@/lib/env"; // For env vars
import { base } from "wagmi/chains"; // For chain ID

// Basic fetcher for SWR
const fetcher = (url: string, fid: string | null) => {
  if (!fid) throw new Error("User FID not available for fetching history."); // Prevent fetch without FID
  return fetch(url, {
    headers: { "x-farcaster-id": fid }, // Pass FID in header
    cache: "no-store", // Ensure fresh data
  }).then((res) => {
    if (!res.ok) {
      throw new Error("Failed to fetch game history");
    }
    return res.json();
  });
};

/* ---------- Top bar (shared look) ---------- */
const TopBar = () => {
  const user = useMiniUser();
  // Fetch balance within the TopBar component
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
        // Use cn
        "sticky top-0 z-10 w-full", // Sticky positioning
        "border-b border-[color:var(--surface-stroke)]", // Border
        "bg-[color:var(--brand-ink-900)]/80 backdrop-blur-sm" // Semi-transparent background with blur
      )}
    >
      <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-3">
        {" "}
        {/* Layout */}
        <LogoIcon /> {/* */}
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
          {" "}
          {/* Wallet display */}
          <WalletIcon className="h-4 w-4 text-[color:var(--text-primary)]" />{" "}
          {/* */}
          <span
            className="text-center text-[color:var(--text-primary)] font-display tabular-nums" // Added tabular-nums
            style={{
              fontSize: "clamp(.9rem, 1.8vw, .95rem)", // Adjusted size slightly
              lineHeight: "1.1", //
            }}
          >
            {status === "pending" ? "Loading..." : `$${roundedBalance}`}{" "}
            {/* Show balance or loading */}
          </span>{" "}
          {/* */}
        </div>
      </div>
    </header>
  );
};

/* ---------- Sub-page header ---------- */
const SubPageHeader = (
  { title }: { title: string } //
) => (
  <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 pt-4">
    {" "}
    {/* */}
    {/* Back Link */}
    <Link
      href="/profile" // Link back to main profile page
      className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/15 transition-opacity hover:opacity-80" // Styling
      aria-label="Back to profile" // Improved label
    >
      <ArrowLeftIcon /> {/* */}
    </Link>
    {/* Title */}
    <h1
      className="flex-grow text-center text-white font-body" // Styling
      style={{
        fontWeight: 400, //
        fontSize: "clamp(1.25rem, 4.5vw, 1.375rem)", // Responsive font size
        lineHeight: ".92", //
        letterSpacing: "-0.03em", //
      }}
    >
      {title} {/* Display title prop */}
    </h1>
    {/* Spacer to balance back button */}
    <div className="h-[34px] w-[34px]" aria-hidden="true" /> {/* */}
  </div>
);

/* ---------- Page Component ---------- */
export default function GameHistoryPage() {
  const { fid } = useMiniUser(); // Get current user's FID

  // Use SWR to fetch game history
  const {
    data: gameHistory, // Fetched data will be here (or undefined)
    error, // Error object if fetch fails
    isLoading, // Loading state
  } = useSWR<GameHistoryEntry[]>(
    fid ? "/api/profile/history" : null, // SWR key - URL, or null if no FID
    (url) => fetcher(url, fid ? String(fid) : null), // Pass fetcher function and FID
    {
      revalidateOnFocus: false, // History data likely doesn't change often on focus
      // Add other SWR options if needed (e.g., error retries)
    }
  );

  return (
    //
    <div
      className={cn(
        // Base styles
        "min-h-screen flex flex-col", // Full height, flex column
        "bg-figma noise", // Background gradient/noise
        "text-[color:var(--text-primary)]" // Default text color
      )}
    >
      <TopBar /> {/* Render shared top bar */}
      <SubPageHeader title="GAME HISTORY" /> {/* Render sub-page header */}
      <main
        className={cn(
          // Main content area styles
          "mx-auto w-full max-w-lg", // Centered, max width
          "px-4", // Horizontal padding
          "pb-[calc(env(safe-area-inset-bottom)+84px)]", // Bottom padding with safe area + nav height
          "mt-4 flex-1" // Top margin, allow grow
        )}
      >
        {/* Conditional Rendering based on SWR state */}
        {isLoading && (
          <div className="flex justify-center items-center pt-10 text-muted">
            Loading history...
          </div>
        )}

        {error && (
          <div className="panel rounded-2xl p-4 text-center text-sm text-danger">
            Error loading game history: {error.message}
          </div>
        )}

        {!isLoading && !error && gameHistory && gameHistory.length > 0 && (
          // List of Game History Items
          <ul className="flex flex-col gap-3.5 sm:gap-4">
            {" "}
            {/* Use ul, define gap */}
            {gameHistory.map(
              (
                g // Map through fetched history
              ) => (
                <li key={g.id}>
                  {" "}
                  {/* Use game id as key */}
                  <GameHistoryItem game={g} /> {/* Render item component */}
                </li>
              )
            )}
          </ul>
        )}

        {!isLoading && !error && (!gameHistory || gameHistory.length === 0) && (
          // Empty State
          <div className="panel rounded-2xl p-6 text-center text-sm text-muted mt-6">
            You haven&apos;t played any games yet.
          </div>
        )}
      </main>
      <BottomNav /> {/* Render bottom navigation */}
    </div>
  );
} //
