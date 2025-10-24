"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { useGameStore } from "@/stores/gameStore";
import { useMiniUser } from "@/hooks/useMiniUser";
import { useLobbyStore } from "@/stores/lobbyStore";
import { ZapIcon, WinningsIcon, TrophyIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import { env } from "@/lib/env";

type SummaryState =
  | { status: "idle" | "loading" }
  | {
      status: "ready";
      data: {
        rank: number;
        score: number;
        totalPlayers: number;
        totalPoints: number;
        username: string;
        avatarUrl: string | null;
      };
    }
  | { status: "error"; message: string };

const numberFormatter = new Intl.NumberFormat("en-US");
const formatNumber = (value: number | null | undefined) =>
  numberFormatter.format(Math.max(0, Math.round(value ?? 0)));

export default function GameOverView() {
  const router = useRouter();
  const game = useGameStore((s) => s.game);
  const resetGame = useGameStore((s) => s.resetGame);
  const fetchActiveGame = useGameStore((s) => s.fetchActiveGame);

  const {
    fid,
    username: fallbackUsername,
    pfpUrl: fallbackAvatar,
  } = useMiniUser();

  const lobbyStats = useLobbyStore((s) => s.stats);
  const fetchLobbyStats = useLobbyStore((s) => s.fetchStats);

  const [summary, setSummary] = useState<SummaryState>({ status: "idle" });

  // Ensure prize/pool stats are available for earnings interpolation.
  useEffect(() => {
    if (!lobbyStats) {
      fetchLobbyStats().catch((err) =>
        console.error("Failed to load lobby stats", err)
      );
    }
  }, [lobbyStats, fetchLobbyStats]);

  useEffect(() => {
    if (!fid || !game?.id) return;

    const controller = new AbortController();

    const loadSummary = async () => {
      setSummary({ status: "loading" });
      try {
        let userId: number | null = null;
        let resolvedName = fallbackUsername || "Player";
        let resolvedAvatar = fallbackAvatar ?? null;

        const userRes = await fetch(
          `/api/user?farcasterId=${encodeURIComponent(String(fid))}`,
          { signal: controller.signal }
        );
        if (userRes.ok) {
          const payload = await userRes.json();
          if (payload?.user) {
            userId = payload.user.id ?? null;
            resolvedName = payload.user.name ?? resolvedName;
            resolvedAvatar = payload.user.imageUrl ?? resolvedAvatar;
          }
        }

        const params = new URLSearchParams({
          tab: "current",
          page: "0",
          gameId: String(game.id),
        });
        if (userId) params.set("userId", String(userId));

        const standingsRes = await fetch(
          `/api/leaderboard?${params.toString()}`,
          { cache: "no-store", signal: controller.signal }
        );
        if (!standingsRes.ok) throw new Error("Failed to load final standings");
        const standings = await standingsRes.json();

        const me =
          standings.me ??
          standings.users?.find(
            (entry: { id: string }) => Number(entry.id) === userId
          );

        if (!me) {
          throw new Error("Unable to determine your final rank.");
        }

        setSummary({
          status: "ready",
          data: {
            rank: me.rank ?? 0,
            score: me.points ?? 0,
            totalPlayers:
              standings.totalPlayers ?? standings.users?.length ?? 0,
            totalPoints: standings.totalPoints ?? 0,
            username: me.name || resolvedName || "Player",
            avatarUrl: me.imageUrl || resolvedAvatar,
          },
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to prepare game over summary", error);
        setSummary({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Something went wrong while loading your results.",
        });
      }
    };

    loadSummary();

    return () => controller.abort();
  }, [fid, game?.id, fallbackAvatar, fallbackUsername]);

  const earnings = useMemo(() => {
    if (summary.status !== "ready") return 0;
    const totalPrize = lobbyStats?.totalPrize ?? 0;
    if (!totalPrize || summary.data.totalPoints <= 0) return 0;
    return Math.round(
      (summary.data.score / summary.data.totalPoints) * totalPrize
    );
  }, [summary, lobbyStats]);

  const percentile = useMemo(() => {
    if (summary.status !== "ready") return null;
    const { rank, totalPlayers } = summary.data;
    if (!rank || !totalPlayers) return null;
    return Math.max(
      0,
      Math.min(100, Math.round(((totalPlayers - rank) / totalPlayers) * 100))
    );
  }, [summary]);

  const { composeCastAsync } = useComposeCast();

  const handleShare = useCallback(async () => {
    if (summary.status !== "ready") return;
    const { rank, score } = summary.data;
    const message = `I placed #${rank} with a score of ${formatNumber(
      score
    )} in Waffles!`;

    try {
      const result = await composeCastAsync({
        text: message,
        embeds: [env.rootUrl || ""],
      });

      // result.cast can be null if user cancels
      if (result?.cast) {
        console.log("Cast created successfully:", result.cast.hash);
      } else {
        console.log("User cancelled the cast");
      }

      // result.cast can be null if user cancels; do nothing in either case
    } catch (error) {
      console.error("Error sharing to Farcaster:", error);
    }
  }, [summary, composeCastAsync]);

  const handleBackHome = useCallback(() => {
    resetGame();
    fetchActiveGame().catch((error) =>
      console.error("Failed to fetch active game", error)
    );
    router.replace("/game");
  }, [fetchActiveGame, resetGame, router]);

  const handleViewLeaderboard = useCallback(() => {
    router.push("/leaderboard");
  }, [router]);

  const headingTheme = game?.description || game?.name || "Game Over";

  const rankDisplay =
    summary.status === "ready" ? `#${summary.data.rank}` : "--";
  const scoreDisplay =
    summary.status === "ready" ? formatNumber(summary.data.score) : "--";
  const earningsDisplay =
    summary.status === "ready" ? formatNumber(earnings) : "--";
  const playerName =
    summary.status === "ready"
      ? summary.data.username
      : fallbackUsername || "Player";
  const avatarUrl =
    summary.status === "ready"
      ? summary.data.avatarUrl
      : fallbackAvatar ?? "/images/avatars/a.png";

  return (
    <main className="relative min-h w-full bg-figma noise">
      <div className="relative mx-auto flex w-full max-w-lg flex-col items-center px-4 pb-[calc(env(safe-area-inset-bottom)+7vw)] pt-12 sm:pt-16">
        <div className="w-full flex justify-center">
          <Image
            src="/images/illustration/waffle-ticket.png"
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
                    src={avatarUrl || "/images/avatars/a.png"}
                    alt={playerName}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="font-edit-undo text-white truncate max-w-[8rem]">
                  {playerName}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p
                  className="font-edit-undo text-white"
                  style={{
                    fontSize: "clamp(2.25rem, 13vw, 4.5rem)",
                    lineHeight: "0.9",
                  }}
                >
                  {rankDisplay}
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
                value={scoreDisplay}
                icon={<ZapIcon className="h-5 w-5 text-[#FFC931]" />}
              />
              <StatCard
                label="Earnings"
                value={earningsDisplay}
                icon={<WinningsIcon className="h-5 w-5 text-[#14B985]" />}
                prefix="$"
              />
            </div>

            {summary.status === "error" && (
              <p className="mt-4 text-center text-sm text-red-400">
                {summary.message}
              </p>
            )}
            {summary.status === "loading" && (
              <p className="mt-4 text-center text-sm text-muted">
                Calculating final standings…
              </p>
            )}
          </div>

          <button
            onClick={handleShare}
            className={cn(
              "w-full rounded-xl bg-white px-6 py-4 text-center font-edit-undo text-2xl text-[#14B985] transition active:translate-x-[2px] active:translate-y-[2px]",
              "border-r-[5px] border-b-[5px] border-[#14B985]",
              "sm:text-2xl text-xl"
            )}
            style={{
              fontSize: "clamp(1.125rem, 4vw, 1.5rem)",
              padding:
                "clamp(0.875rem, 3vw, 1.25rem) clamp(1.25rem, 6vw, 1.5rem)",
            }}
          >
            SHARE SCORE
          </button>

          <div className="flex w-full flex-row items-center justify-between max-w-md flex-wrap gap-2">
            <TextButton onClick={handleBackHome}>BACK TO HOME</TextButton>
            <TextButton onClick={handleViewLeaderboard}>
              VIEW LEADERBOARD
            </TextButton>
          </div>

          {percentile !== null && (
            <div className="mt-4 flex items-center gap-2 text-sm font-display text-white">
              <ZapIcon className="h-4 w-4 text-[#FFC931]" />
              <span className="truncate">
                You finished faster than {percentile}% of your friends
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
