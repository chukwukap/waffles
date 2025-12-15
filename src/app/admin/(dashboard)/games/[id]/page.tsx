import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  PencilIcon,
  QuestionMarkCircleIcon,
  ArrowLeftIcon,
  UsersIcon,
  ClockIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { GameLifecyclePanel } from "./_components/GameLifecyclePanel";
import { getOnChainGame } from "@/lib/settlement";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gameId = Number(id);

  if (isNaN(gameId)) {
    notFound();
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      _count: {
        select: {
          players: true,
          questions: true,
        },
      },
    },
  });

  if (!game) {
    notFound();
  }

  // Get on-chain status
  let onChainStatus = {
    exists: false,
    ended: false,
    settled: false,
    merkleRoot: undefined as string | undefined,
  };

  try {
    const onChainGame = (await getOnChainGame(gameId)) as {
      entryFee: bigint;
      ticketCount: bigint;
      merkleRoot: `0x${string}`;
      settledAt: bigint;
      ended: boolean;
    };

    if (onChainGame && onChainGame.entryFee > BigInt(0)) {
      const zeroRoot = "0x0000000000000000000000000000000000000000000000000000000000000000";
      onChainStatus = {
        exists: true,
        ended: onChainGame.ended,
        settled: onChainGame.merkleRoot !== zeroRoot,
        merkleRoot:
          onChainGame.merkleRoot !== zeroRoot
            ? onChainGame.merkleRoot
            : undefined,
      };
    }
  } catch (error) {
    console.log("[Admin] On-chain lookup failed:", error);
  }

  const statusColors: Record<string, string> = {
    SCHEDULED: "bg-[#FFC931]/20 text-[#FFC931] border-[#FFC931]/30",
    LIVE: "bg-[#14B985]/20 text-[#14B985] border-[#14B985]/30",
    ENDED: "bg-white/10 text-white/60 border-white/20",
    CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const themeIcons: Record<string, string> = {
    FOOTBALL: "⚽",
    MOVIES: "🎬",
    ANIME: "🎌",
    POLITICS: "🏛️",
    CRYPTO: "₿",
  };

  // Format dates for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/admin/games"
        className="inline-flex items-center gap-2 text-white/50 hover:text-[#FFC931] font-medium transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Games
      </Link>

      {/* Header */}
      <div className="admin-panel p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Theme Icon */}
            <div className="w-14 h-14 rounded-xl bg-linear-to-br from-[#FFC931]/20 to-[#FFC931]/5 flex items-center justify-center text-2xl border border-[#FFC931]/20">
              {themeIcons[game.theme] || "🎮"}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white font-display">
                  {game.title}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    statusColors[game.status] || statusColors.CANCELLED
                  }`}
                >
                  {game.status === "LIVE" && (
                    <span className="w-2 h-2 bg-current rounded-full animate-pulse" />
                  )}
                  {game.status}
                </span>
              </div>

              {game.description && (
                <p className="text-white/50 mt-1 text-sm max-w-xl">
                  {game.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 text-sm text-white/40">
                <span className="flex items-center gap-1.5">
                  <SparklesIcon className="h-4 w-4" />
                  {game.theme}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDaysIcon className="h-4 w-4" />
                  {formatDate(game.startsAt)} - {formatDate(game.endsAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/games/${game.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl transition-colors font-medium"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </Link>
            <Link
              href={`/admin/games/${game.id}/questions`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFC931] hover:bg-[#FFD966] text-black rounded-xl transition-colors font-bold shadow-lg shadow-[#FFC931]/20"
            >
              <QuestionMarkCircleIcon className="h-4 w-4" />
              Manage Questions
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Players"
          value={game._count.players.toString()}
          icon={<UsersIcon className="h-5 w-5" />}
          color="cyan"
        />
        <StatCard
          label="Questions"
          value={game._count.questions.toString()}
          icon={<QuestionMarkCircleIcon className="h-5 w-5" />}
          color="pink"
        />
        <StatCard
          label="Entry Fee"
          value={`$${game.entryFee}`}
          icon={<BanknotesIcon className="h-5 w-5" />}
          color="gold"
        />
        <StatCard
          label="Prize Pool"
          value={`$${game.prizePool.toLocaleString()}`}
          icon={<BanknotesIcon className="h-5 w-5" />}
          color="green"
        />
      </div>

      {/* Game Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Configuration */}
        <div className="admin-panel p-5">
          <h3 className="text-lg font-bold text-white font-display mb-4">
            Configuration
          </h3>
          <div className="space-y-3">
            <ConfigRow label="Round Duration" value={`${game.roundDurationSec}s`} />
            <ConfigRow label="Max Players" value={game.maxPlayers.toString()} />
            <ConfigRow label="Entry Fee" value={`$${game.entryFee} USDC`} />
            <ConfigRow
              label="Prize Pool"
              value={`$${game.prizePool.toLocaleString()} USDC`}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="admin-panel p-5 lg:col-span-2">
          <h3 className="text-lg font-bold text-white font-display mb-4">
            Schedule
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                <ClockIcon className="h-4 w-4" />
                Starts At
              </div>
              <p className="text-white font-medium">
                {game.startsAt.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                <ClockIcon className="h-4 w-4" />
                Ends At
              </div>
              <p className="text-white font-medium">
                {game.endsAt.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Game Lifecycle Panel */}
      <div className="admin-panel p-6">
        <GameLifecyclePanel
          gameId={game.id}
          gameStatus={game.status as "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED"}
          questionsCount={game._count.questions}
          playersCount={game._count.players}
          prizePool={game.prizePool}
          onChainStatus={onChainStatus}
        />
      </div>
    </div>
  );
}

// Helper Components
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "cyan" | "pink" | "gold" | "green";
}) {
  const colors = {
    cyan: "text-[#00CFF2] bg-[#00CFF2]/10 border-[#00CFF2]/20",
    pink: "text-[#FB72FF] bg-[#FB72FF]/10 border-[#FB72FF]/20",
    gold: "text-[#FFC931] bg-[#FFC931]/10 border-[#FFC931]/20",
    green: "text-[#14B985] bg-[#14B985]/10 border-[#14B985]/20",
  };

  return (
    <div className="admin-panel p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg border ${colors[color]}`}>{icon}</div>
        <div>
          <p className="text-white/50 text-xs font-medium">{label}</p>
          <p className={`text-xl font-bold font-display ${colors[color].split(" ")[0]}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-white/50 text-sm">{label}</span>
      <span className="text-white font-medium text-sm">{value}</span>
    </div>
  );
}
