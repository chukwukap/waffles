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

  const handleShare = useCallback(async () => {
    if (summary.status !== "ready") return;
    const { rank, score } = summary.data;
    const message = `I placed #${rank} with a score of ${formatNumber(
      score
    )} in Waffles!`;
    const shareData = {
      title: "Waffles",
      text: message,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          `${message} ${shareData.url ?? ""}`
        );
        alert("Link copied to clipboard!");
      } else {
        alert(message);
      }
    } catch (err) {
      console.error("Share failed", err);
      alert("Unable to share right now.");
    }
  }, [summary]);

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
    <main className="relative min-h-[100dvh] w-full bg-figmaYay noise">
      <div className="relative mx-auto flex w-full max-w-[420px] flex-col items-center px-4 pb-[calc(env(safe-area-inset-bottom)+48px)] pt-16">
        <Image
          src="/images/illustration/waffle-ticket.png"
          alt="Pixel waffle"
          width={228}
          height={132}
          priority
          className="mb-6 h-auto w-[228px]"
        />

        <h1
          className="font-edit-undo text-white"
          style={{
            fontSize: "44px",
            lineHeight: "0.92",
            letterSpacing: "-0.03em",
          }}
        >
          GAME OVER
        </h1>

        <p className="mt-1 text-base font-display text-[#99A0AE]">
          {headingTheme}
        </p>

        <div className="mt-10 flex w-full max-w-[361px] flex-col items-center gap-6">
          <div className="w-full rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_rgba(0,0,0,0))] p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
              <span className="mx-auto text-sm font-display text-[#99A0AE]">
                Your final rank
              </span>
              <div className="flex items-center gap-2">
                <div className="relative size-8 overflow-hidden rounded-full border border-white/20">
                  <Image
                    src={avatarUrl || "/images/avatars/a.png"}
                    alt={playerName}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="font-edit-undo text-white">{playerName}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <p
                  className="font-edit-undo text-white"
                  style={{ fontSize: "78px", lineHeight: "0.9" }}
                >
                  {rankDisplay}
                </p>
              </div>
              <div className="flex h-[70px] w-[70px] items-center justify-center">
                <TrophyIcon
                  className="h-14 w-14 text-[#FFC931]"
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
              "w-full rounded-[12px] bg-white px-6 py-4 text-center font-edit-undo text-2xl text-[#14B985] transition active:translate-x-[2px] active:translate-y-[2px]",
              "border-r-[5px] border-b-[5px] border-[#14B985]"
            )}
          >
            SHARE SCORE
          </button>

          <div className="flex w-full max-w-[361px] flex-row items-center justify-between">
            <TextButton onClick={handleBackHome}>BACK TO HOME</TextButton>
            <TextButton onClick={handleViewLeaderboard}>
              VIEW LEADERBOARD
            </TextButton>
          </div>

          {percentile !== null && (
            <div className="mt-4 flex items-center gap-2 text-sm font-display text-white">
              <ZapIcon className="h-4 w-4 text-[#FFC931]" />
              <span>
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
