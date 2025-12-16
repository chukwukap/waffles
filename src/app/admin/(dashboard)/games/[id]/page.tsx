import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { forceEndGameAction } from "@/actions/admin/games";
import {
    PencilIcon,
    QuestionMarkCircleIcon,
    StopIcon,
} from "@heroicons/react/24/outline";
import { SettlementPanel } from "./_components/SettlementPanel";
import { getOnChainGame } from "@/lib/settlement";
import { getGamePhase } from "@/lib/game-utils";

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
            title: true,
            description: true,
            theme: true,
            coverUrl: true,
            startsAt: true,
            endsAt: true,
            ticketPrice: true,
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
        },
    });

    if (!game) {
        notFound();
    }

    // Derive phase from time
    const phase = getGamePhase(game);

    // Get on-chain status (optional, may fail if not deployed)
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
            onChainStatus = {
                exists: true,
                ended: onChainGame.ended,
                settled: onChainGame.merkleRoot !== "0x0000000000000000000000000000000000000000000000000000000000000000",
                merkleRoot:
                    onChainGame.merkleRoot !== "0x0000000000000000000000000000000000000000000000000000000000000000"
                        ? onChainGame.merkleRoot
                        : undefined,
            };
        }
    } catch (error) {
        // On-chain lookup failed - likely not deployed yet
        console.log("[Admin] On-chain lookup failed:", error);
    }

    const statusColors: Record<string, string> = {
        SCHEDULED: "bg-[#FFC931]/20 text-[#FFC931]",
        LIVE: "bg-[#14B985]/20 text-[#14B985]",
        ENDED: "bg-white/10 text-white/60",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/games"
                    className="text-white/50 hover:text-[#FFC931] font-medium transition-colors"
                >
                    ← Back
                </Link>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white font-display">
                        {game.title}
                    </h1>
                    <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium mt-2 ${statusColors[phase] || statusColors.ENDED
                            }`}
                    >
                        {phase}
                    </span>
                </div>
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

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="admin-panel p-6">
                    <h3 className="text-white/50 text-sm font-medium mb-2 font-display">
                        Status
                    </h3>
                    <p
                        className={`text-2xl font-bold font-body ${phase === "LIVE"
                            ? "text-[#14B985] admin-stat-glow-success"
                            : phase === "SCHEDULED"
                                ? "text-[#FFC931] admin-stat-glow"
                                : "text-white"
                            }`}
                    >
                        {phase}
                    </p>
                </div>
                <div className="admin-panel p-6">
                    <h3 className="text-white/50 text-sm font-medium mb-2 font-display">
                        Players
                    </h3>
                    <p className="text-2xl font-bold text-[#00CFF2] font-body admin-stat-glow-cyan">
                        {game.playerCount}
                    </p>
                </div>
                <div className="admin-panel p-6">
                    <h3 className="text-white/50 text-sm font-medium mb-2 font-display">
                        Questions
                    </h3>
                    <p className="text-2xl font-bold text-[#FB72FF] font-body admin-stat-glow-pink">
                        {game._count.questions}
                    </p>
                </div>
                <div className="admin-panel p-6">
                    <h3 className="text-white/50 text-sm font-medium mb-2 font-display">
                        Prize Pool
                    </h3>
                    <p className="text-2xl font-bold text-[#14B985] font-body">
                        ${game.prizePool.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Game Actions */}
            <div className="admin-panel p-6 space-y-4">
                <h2 className="text-xl font-bold text-white font-display">
                    Game Actions
                </h2>
                <div className="flex flex-wrap gap-4">
                    {phase === "LIVE" && (
                        <form
                            action={async () => {
                                "use server";
                                await forceEndGameAction(game.id);
                            }}
                        >
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors font-medium border border-red-500/30"
                            >
                                <StopIcon className="h-4 w-4" />
                                End Game (Calculate Ranks)
                            </button>
                        </form>
                    )}
                    {phase === "ENDED" && (
                        <div className="flex items-center gap-2 text-[#14B985]">
                            <span className="text-lg">✓</span>
                            <p className="font-medium">
                                Game has ended. Ranks have been calculated.
                            </p>
                        </div>
                    )}
                    {phase === "SCHEDULED" && (
                        <p className="text-white/50">
                            Game is scheduled. Actions will be available when the game goes
                            live.
                        </p>
                    )}
                </div>
            </div>

            {/* On-Chain Settlement Panel */}
            <div className="admin-panel p-6">
                <SettlementPanel
                    gameId={game.id}
                    gameStatus={phase}
                    onChainStatus={onChainStatus}
                />
            </div>
        </div>
    );
}
