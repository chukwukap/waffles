"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useAppStore } from "@/state/store";
import { useMiniUser } from "@/hooks/useMiniUser";
import { ZapIcon, WinningsIcon, TrophyIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import { env } from "@/lib/env";
import { notify } from "@/components/ui/Toaster";

interface GameResultData {
  rank: number;
  score: number;
  totalPlayers: number;
  totalPoints: number;
  user: {
    name: string;
    imageUrl: string | null;
  };
}

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((res) => {
    if (!res.ok) {
      throw new Error("Failed to load game results");
    }
    return res.json();
  });

const numberFormatter = new Intl.NumberFormat("en-US"); //
const formatNumber = (value: number | null | undefined): string =>
  numberFormatter.format(Math.max(0, Math.round(value ?? 0)));

export default function GameOverView() {
  const router = useRouter();
  const activeGame = useAppStore((state) => state.activeGame);

  const {
    fid,
    username: fallbackUsername,
    pfpUrl: fallbackAvatar,
  } = useMiniUser();

  const gameId = activeGame?.id;
  const resultsUrl =
    fid && gameId ? `/api/game/${gameId}/results?fid=${fid}` : null;

  const {
    data: resultsData,
    error: resultsError,
    isLoading: isLoadingResults,
  } = useSWR<GameResultData>(resultsUrl, fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });

  const percentile = useMemo(() => {
    if (!resultsData) return null;
    const { rank, totalPlayers } = resultsData;
    if (!rank || !totalPlayers || totalPlayers <= 0) return null;
    return Math.max(
      0,
      Math.min(100, Math.round(((totalPlayers - rank) / totalPlayers) * 100))
    );
  }, [resultsData]);

  const { composeCastAsync } = useComposeCast();

  const handleShare = useCallback(async () => {
    if (!resultsData) return;
    const { rank, score } = resultsData;
    const message = `I placed #${rank} with a score of ${formatNumber(
      score
    )} in Waffles! 🧇`;

    notify.info("Opening Farcaster composer...");
    try {
      const result = await composeCastAsync({
        text: message,
        embeds: [env.rootUrl ? { url: env.rootUrl } : undefined].filter(
          Boolean
        ) as unknown as [string],
      });

      if (result?.cast) {
        console.log("Cast created successfully:", result.cast.hash);
        notify.success("Shared successfully!");
      } else {
        console.log("User cancelled the cast");
        notify.info("Share cancelled.");
      }
    } catch (error) {
      console.error("Error sharing to Farcaster:", error);
      notify.error("Failed to share score.");
    }
  }, [resultsData, composeCastAsync]);

  const handleBackHome = useCallback(() => {
    router.replace("/lobby");
  }, [router]);

  const handleViewLeaderboard = useCallback(() => {
    router.push("/leaderboard?tab=current");
  }, [router]);

  const headingTheme =
    activeGame?.description || activeGame?.name || "Game Over";

  const displayRank =
    !isLoadingResults && resultsData ? `#${resultsData.rank}` : "--";
  const displayScore =
    !isLoadingResults && resultsData ? formatNumber(resultsData.score) : "--";
  const displayEarnings =
    !isLoadingResults && resultsData ? formatNumber(3) : "--";
  const displayName =
    !isLoadingResults && resultsData
      ? resultsData.user.name
      : fallbackUsername || "Player";
  const displayAvatar =
    !isLoadingResults && resultsData
      ? resultsData.user.imageUrl
      : fallbackAvatar ?? "/images/avatars/a.png";

  return (
    <main className="relative min-h w-full bg-figma noise animate-up">
      <div className="relative mx-auto flex w-full max-w-lg flex-col items-center px-4 pb-[calc(env(safe-area-inset-bottom)+7vw)] pt-12 sm:pt-16">
        {/* Waffle Image */}
        <div className="w-full flex justify-center">
          <Image
            src="/images/illustrations/waffle-ticket.png"
            alt="Pixel waffle"
            width={228}
            height={132}
            priority
            className="mb-6 w-full max-w-xs h-auto"
            style={{
              aspectRatio: "228/132",
              height: "auto",
              width: "100%",
              maxWidth: "228px",
            }}
          />
        </div>
        <h1
          className="font-edit-undo text-white leading-none"
          style={{
            fontSize: "clamp(2rem, 9vw, 2.75rem)",
            letterSpacing: "-0.03em",
          }}
        >
          GAME OVER
        </h1>
        {/* Sub-heading */}
        <p className="mt-1 text-base sm:text-lg font-display text-[#99A0AE] text-center">
          {headingTheme}
        </p>
        <div className="mt-10 flex w-full max-w-md flex-col items-center gap-3">
          <div className="w-full rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_rgba(0,0,0,0))] p-4 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
              <span className="mx-auto text-sm font-display text-[#99A0AE] whitespace-nowrap">
                Your final rank
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative aspect-square w-8 h-8 overflow-hidden rounded-full border border-white/20 shrink-0">
                  <Image
                    src={displayAvatar ?? "/images/avatars/a.png"}
                    alt={displayName}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="font-edit-undo text-white truncate max-w-[8rem]">
                  {displayName}
                </span>
              </div>
            </div>
            {/* Rank Number and Trophy */}
            <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p
                  className="font-edit-undo text-white"
                  style={{
                    fontSize: "clamp(2.25rem, 13vw, 4.5rem)",
                    lineHeight: "0.9",
                  }}
                >
                  {displayRank}
                </p>
              </div>
              <div
                className="flex items-center justify-center"
                style={{
                  height: "clamp(2.5rem, 10vw, 4.375rem)",
                  width: "clamp(2.5rem, 10vw, 4.375rem)",
                  minWidth: "2.5rem",
                }}
              >
                <TrophyIcon
                  className="w-full h-full text-[#FFC931]"
                  aria-label="Trophy"
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatCard
                label="Score"
                value={displayScore}
                icon={<ZapIcon className="h-5 w-5 text-[#FFC931]" />}
              />
              <StatCard
                label="Earnings"
                value={displayEarnings}
                icon={<WinningsIcon className="h-5 w-5 text-[#14B985]" />}
                prefix="$"
              />
            </div>
            {/* Loading/Error States */}
            {isLoadingResults && (
              <p className="mt-4 text-center text-sm text-muted">
                Calculating final standings…
              </p>
            )}
            {resultsError && !isLoadingResults && (
              <p className="mt-4 text-center text-sm text-red-400">
                {resultsError.message || "Could not load your results."}
              </p>
            )}
            {!isLoadingResults && !resultsData && !resultsError && (
              <p className="mt-4 text-center text-sm text-muted">
                Results not available yet.
              </p>
            )}
          </div>
          {/* Share Button */}
          <button
            onClick={handleShare}
            disabled={isLoadingResults || !resultsData || !!resultsError}
            className={cn(
              "w-full rounded-xl bg-white px-6 py-4 text-center font-edit-undo text-2xl text-[#14B985] transition active:translate-x-[2px] active:translate-y-[2px]",
              "border-r-[5px] border-b-[5px] border-[#14B985]",
              "sm:text-2xl text-xl",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            style={{
              fontSize: "clamp(1.125rem, 4vw, 1.5rem)",
              padding:
                "clamp(0.875rem, 3vw, 1.25rem) clamp(1.25rem, 6vw, 1.5rem)",
            }}
          >
            SHARE SCORE
          </button>
          {/* Navigation Buttons */}
          <div className="flex w-full flex-row items-center justify-between max-w-md flex-wrap gap-2">
            <TextButton onClick={handleBackHome}>BACK TO HOME</TextButton>
            <TextButton onClick={handleViewLeaderboard}>
              VIEW LEADERBOARD
            </TextButton>
          </div>
          {/* Percentile Info */}
          {percentile !== null && !isLoadingResults && resultsData && (
            <div className="mt-4 flex items-center gap-2 text-sm font-display text-white">
              <ZapIcon className="h-4 w-4 text-[#FFC931]" />
              <span className="truncate">
                You ranked in the top {100 - percentile}% of players!
              </span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  prefix,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  prefix?: string;
}) {
  return (
    <div className="flex-1 rounded-[16px] border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
      <p className="text-sm font-display text-[#99A0AE]">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        {icon}
        <span className="font-edit-undo text-2xl text-white">
          {prefix}
          {value}
        </span>
      </div>
    </div>
  );
}

function TextButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-sm font-edit-undo uppercase text-[#00CFF2] transition hover:text-[#33defa]"
    >
      {children}
    </button>
  );
}
