"use client";

import Link from "next/link";
import useSWR from "swr";
import { GameHistoryEntry } from "@/state/types";
import { BottomNav } from "@/components/BottomNav";
import LogoIcon from "@/components/logo/LogoIcon";
import { ArrowLeftIcon, WalletIcon } from "@/components/icons";
import { GameHistoryItem } from "@/app/(authenticated)/profile/_components/GameHistory";
import { cn } from "@/lib/utils";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { env } from "@/lib/env";
import { base } from "wagmi/chains";
import { useAccount } from "wagmi";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

const fetcher = (url: string, fid: string | null) => {
  if (!fid) throw new Error("User FID not available for fetching history.");
  return fetch(url, {
    headers: { "x-farcaster-id": fid },
    cache: "no-store",
  }).then((res) => {
    if (!res.ok) {
      throw new Error("Failed to fetch game history");
    }
    return res.json();
  });
};

const TopBar = () => {
  const { address } = useAccount();
  const { status, roundedBalance } = useGetTokenBalance(
    address as `0x${string}`,
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
        "border-b border-white/5",
        "bg-black/80 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-3">
        <LogoIcon />
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
          <WalletIcon className="h-4 w-4 text-white" />
          <span
            className="text-center text-white font-display tabular-nums"
            style={{
              fontSize: "clamp(.9rem, 1.8vw, .95rem)",
              lineHeight: "1.1",
            }}
          >
            {status === "pending" ? "Loading..." : `$${roundedBalance}`}{" "}
          </span>
        </div>
      </div>
    </header>
  );
};

const SubPageHeader = ({ title }: { title: string }) => (
  <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 pt-4">
    <Link
      href="/profile"
      className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/15 transition-opacity hover:opacity-80"
      aria-label="Back to profile"
    >
      <ArrowLeftIcon />
    </Link>
    <h1
      className="grow text-center text-white font-body"
      style={{
        fontWeight: 400,
        fontSize: "clamp(1.25rem, 4.5vw, 1.375rem)",
        lineHeight: ".92",
        letterSpacing: "-0.03em",
      }}
    >
      {title}
    </h1>
    <div className="h-[34px] w-[34px]" aria-hidden="true" />
  </div>
);

export default function GameHistoryPage() {
  const { context: miniKitContext } = useMiniKit();
  const fid = miniKitContext?.user?.fid;
  const {
    data: gameHistory,
    error,
    isLoading,
  } = useSWR<GameHistoryEntry[]>(
    fid ? "/api/profile/history" : null,
    (url) => fetcher(url, fid ? String(fid) : null),
    {
      revalidateOnFocus: false,
    }
  );

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col",
        "app-background noise",
        "text-foreground"
      )}
    >
      <TopBar />
      <SubPageHeader title="GAME HISTORY" />
      <main
        className={cn(
          "mx-auto w-full max-w-lg",
          "px-4",
          "pb-[calc(env(safe-area-inset-bottom)+84px)]",
          "mt-4 flex-1"
        )}
      >
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
          <ul className="flex flex-col gap-3.5 sm:gap-4">
            {gameHistory.map((g) => (
              <li key={g.id}>
                <GameHistoryItem game={g} />
              </li>
            ))}
          </ul>
        )}

        {!isLoading && !error && (!gameHistory || gameHistory.length === 0) && (
          <div className="panel rounded-2xl p-6 text-center text-sm text-muted mt-6">
            You haven&apos;t played any games yet.
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
