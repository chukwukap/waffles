import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { forceEndGameAction } from "@/actions/admin/games";
import {
    PencilIcon,
    QuestionMarkCircleIcon,
    StopIcon,
    CalendarIcon,
    ClockIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    LinkIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { SettlementPanel } from "./_components/SettlementPanel";
import { GameResults } from "./_components/GameResults";
import { getOnChainGame } from "@/lib/settlement";
import { getGamePhase } from "@/lib/game-utils";

// ============================================
// HELPER COMPONENTS
// ============================================

function StatCard({
    icon: Icon,
    label,
    value,
    color = "white",
    subtext,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color?: "white" | "gold" | "green" | "blue" | "pink";
    subtext?: string;
}) {
    const colors = {
        white: "text-white",
        gold: "text-[#FFC931]",
        green: "text-[#14B985]",
        blue: "text-[#00CFF2]",
        pink: "text-[#FB72FF]",
    };

    const iconBg = {
        white: "bg-white/10",
        gold: "bg-[#FFC931]/10",
        green: "bg-[#14B985]/10",
        blue: "bg-[#00CFF2]/10",
        pink: "bg-[#FB72FF]/10",
    };

    return (
        <div className="group relative overflow-hidden bg-linear-to-br from-white/6 to-white/2 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all duration-300">
            {/* Subtle glow on hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${iconBg[color]} blur-3xl`} />

            <div className="relative flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${iconBg[color]}`}>
                    <Icon className={`h-5 w-5 ${colors[color]}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1">
                        {label}
                    </p>
                    <p className={`text-2xl font-bold ${colors[color]} font-display tracking-tight`}>
                        {value}
                    </p>
                    {subtext && (
                        <p className="text-white/40 text-xs mt-0.5">{subtext}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ phase }: { phase: string }) {
    const config = {
        SCHEDULED: {
            bg: "bg-gradient-to-r from-[#FFC931]/20 to-[#FFC931]/10",
            border: "border-[#FFC931]/30",
            text: "text-[#FFC931]",
            dot: "bg-[#FFC931]",
            label: "Scheduled",
        },
        LIVE: {
            bg: "bg-gradient-to-r from-[#14B985]/20 to-[#14B985]/10",
            border: "border-[#14B985]/30",
            text: "text-[#14B985]",
            dot: "bg-[#14B985] animate-pulse",
            label: "Live Now",
        },
        ENDED: {
            bg: "bg-gradient-to-r from-white/10 to-white/5",
            border: "border-white/20",
            text: "text-white/70",
            dot: "bg-white/50",
            label: "Ended",
        },
    };

    const c = config[phase as keyof typeof config] || config.ENDED;

    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${c.bg} ${c.border} ${c.text} border`}>
            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

// ============================================
// MAIN PAGE
// ============================================

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
        select: {
            id: true,
            onchainId: true,
            title: true,
            description: true,
            theme: true,
            coverUrl: true,
            startsAt: true,
            endsAt: true,
            tierPrices: true,
            prizePool: true,
            playerCount: true,
            maxPlayers: true,
            roundBreakSec: true,
            _count: {
                select: {
                    questions: true,
                    entries: true,
                },
            },
            entries: {
                where: { paidAt: { not: null } },
                orderBy: { score: "desc" },
                take: 10,
                select: {
                    score: true,
                    rank: true,
                    prize: true,
                    user: {
                        select: { username: true, pfpUrl: true },
                    },
                },
            },
        },
    });

    if (!game) {
        notFound();
    }

    const phase = getGamePhase(game);

    // Get on-chain status
    let onChainStatus = {
        exists: false,
        ended: false,
        settled: false,
        merkleRoot: undefined as string | undefined,
        claimCount: 0,
    };

    try {
        if (game.onchainId) {
            const onChainGame = (await getOnChainGame(game.onchainId as `0x${string}`)) as {
                entryFee: bigint;
                ticketCount: bigint;
                merkleRoot: `0x${string}`;
                settledAt: bigint;
                claimCount: bigint;
                ended: boolean;
            };

            if (onChainGame && onChainGame.entryFee > BigInt(0)) {
                onChainStatus = {
                    exists: true,
                    ended: onChainGame.ended,
                    settled: onChainGame.merkleRoot !== "0x0000000000000000000000000000000000000000000000000000000000000000",
                    merkleRoot:
                        onChainGame.merkleRoot !== "0x0000000000000000000000000000000000000000000000000000000000000000"
                            ? onChainGame.merkleRoot
                            : undefined,
                    claimCount: Number(onChainGame.claimCount),
                };
            }
        }
    } catch (error) {
        console.log("[Admin] On-chain lookup failed:", error);
    }

    // Format dates
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }).format(date);
    };

    const duration = Math.round((game.endsAt.getTime() - game.startsAt.getTime()) / (1000 * 60));

    return (
        <div className="space-y-8 max-w-6xl">
            {/* Breadcrumb & Actions Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/games"
                        className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm"
                    >
                        <span>←</span>
                        <span>Games</span>
                    </Link>
                    <span className="text-white/20">/</span>
                    <span className="text-white/60 text-sm truncate max-w-[200px]">{game.title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/admin/games/${game.id}/edit`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition-all text-sm font-medium border border-white/8 hover:border-white/15"
                    >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                    </Link>
                    <Link
                        href={`/admin/games/${game.id}/questions`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFC931] hover:bg-[#FFD966] text-black rounded-xl transition-all text-sm font-bold shadow-lg shadow-[#FFC931]/20 hover:shadow-[#FFC931]/30"
                    >
                        <QuestionMarkCircleIcon className="h-4 w-4" />
                        Questions
                    </Link>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-linear-to-br from-white/6 to-transparent border border-white/8 rounded-3xl p-6 sm:p-8">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-bl from-[#FFC931]/10 to-transparent rounded-full blur-3xl" />

                <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <div className="space-y-4">
                        <StatusBadge phase={phase} />
                        <h1 className="text-3xl sm:text-4xl font-bold text-white font-display tracking-tight">
                            {game.title}
                        </h1>
                        {game.description && (
                            <p className="text-white/50 text-sm max-w-lg leading-relaxed">
                                {game.description}
                            </p>
                        )}

                        {/* Time Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-white/40">
                                <CalendarIcon className="h-4 w-4" />
                                <span>{formatDate(game.startsAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/40">
                                <ClockIcon className="h-4 w-4" />
                                <span>{duration} min</span>
                            </div>
                            {game.theme && (
                                <span className="px-2 py-0.5 bg-white/10 rounded-md text-white/50 text-xs">
                                    {game.theme}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Cover Image */}
                    {game.coverUrl && (
                        <div className="shrink-0">
                            <img
                                src={game.coverUrl}
                                alt={game.title}
                                className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-2xl border border-white/10 shadow-2xl"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={UserGroupIcon}
                    label="Players"
                    value={game.playerCount}
                    color="blue"
                    subtext={game.maxPlayers ? `of ${game.maxPlayers} max` : undefined}
                />
                <StatCard
                    icon={QuestionMarkCircleIcon}
                    label="Questions"
                    value={game._count.questions}
                    color="pink"
                />
                <StatCard
                    icon={CurrencyDollarIcon}
                    label="Prize Pool"
                    value={`$${game.prizePool.toLocaleString()}`}
                    color="green"
                />
                <StatCard
                    icon={LinkIcon}
                    label="On-Chain"
                    value={onChainStatus.exists ? "Deployed" : "Not Found"}
                    color={onChainStatus.exists ? "gold" : "white"}
                    subtext={onChainStatus.settled ? "Settled" : onChainStatus.ended ? "Ended" : undefined}
                />
            </div>

            {/* Game Actions */}
            <div className="bg-linear-to-br from-white/6 to-white/2 border border-white/8 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white font-display mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        ⚡
                    </span>
                    Game Actions
                </h2>
                <div className="flex flex-wrap gap-3">
                    {phase === "LIVE" && (
                        <form
                            action={async () => {
                                "use server";
                                await forceEndGameAction(game.id);
                            }}
                        >
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all font-medium border border-red-500/20 hover:border-red-500/40"
                            >
                                <StopIcon className="h-4 w-4" />
                                End Game Now
                            </button>
                        </form>
                    )}
                    {phase === "ENDED" && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-[#14B985]/10 rounded-xl border border-[#14B985]/20">
                            <CheckCircleIcon className="h-5 w-5 text-[#14B985]" />
                            <span className="text-[#14B985] font-medium">
                                Game ended • Ranks calculated
                            </span>
                        </div>
                    )}
                    {phase === "SCHEDULED" && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-[#FFC931]/10 rounded-xl border border-[#FFC931]/20">
                            <ExclamationTriangleIcon className="h-5 w-5 text-[#FFC931]" />
                            <span className="text-[#FFC931]/80">
                                Game is scheduled • Starts {formatDate(game.startsAt)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Two Column Layout for Results & Settlement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Game Results */}
                <div className="bg-linear-to-br from-white/6 to-white/2 border border-white/8 rounded-2xl p-6">
                    {phase === "ENDED" ? (
                        game.entries.length > 0 ? (
                            <GameResults
                                gameId={game.id}
                                gameTitle={game.title}
                                totalEntries={game._count.entries}
                                prizePool={game.prizePool}
                                winners={game.entries.map((e, i) => ({
                                    rank: e.rank || i + 1,
                                    username: e.user?.username || null,
                                    score: e.score,
                                    prize: e.prize,
                                    pfpUrl: e.user?.pfpUrl || null,
                                }))}
                                totalWinners={game.entries.filter(e => (e.prize || 0) > 0).length}
                            />
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                                    <span className="text-3xl">📊</span>
                                </div>
                                <p className="text-white font-medium mb-1">No Entries</p>
                                <p className="text-white/50 text-sm">No paid entries found for this game.</p>
                            </div>
                        )
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                                <span className="text-3xl">🏆</span>
                            </div>
                            <p className="text-white font-medium mb-1">Results Pending</p>
                            <p className="text-white/50 text-sm">Results will be available after the game ends.</p>
                        </div>
                    )}
                </div>

                {/* Settlement Panel */}
                <div className="bg-linear-to-br from-white/6 to-white/2 border border-white/8 rounded-2xl p-6">
                    <SettlementPanel
                        gameId={game.id}
                        gameStatus={phase}
                        onChainStatus={onChainStatus}
                    />
                </div>
            </div>

            {/* On-Chain ID (if exists) */}
            {game.onchainId && (
                <div className="bg-white/3 border border-white/6 rounded-xl p-4">
                    <p className="text-white/40 text-xs mb-1">On-Chain Game ID</p>
                    <code className="text-xs text-[#00CFF2]/70 break-all font-mono">
                        {game.onchainId}
                    </code>
                </div>
            )}
        </div>
    );
}
