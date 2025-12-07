import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { endGameAction } from "@/actions/admin/games";
import { PencilIcon, QuestionMarkCircleIcon, StopIcon } from "@heroicons/react/24/outline";

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

    const statusColors: Record<string, string> = {
        SCHEDULED: "bg-[#FFC931]/20 text-[#FFC931]",
        LIVE: "bg-[#14B985]/20 text-[#14B985]",
        ENDED: "bg-white/10 text-white/60",
        CANCELLED: "bg-red-500/20 text-red-400",
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
                    <h1 className="text-2xl font-bold text-white font-display">{game.title}</h1>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium mt-2 ${statusColors[game.status] || statusColors.CANCELLED}`}>
                        {game.status}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="admin-panel p-6">
                    <h3 className="text-white/50 text-sm font-medium mb-2 font-display">Status</h3>
                    <p className={`text-2xl font-bold font-body ${game.status === "LIVE" ? "text-[#14B985] admin-stat-glow-success" :
                            game.status === "SCHEDULED" ? "text-[#FFC931] admin-stat-glow" : "text-white"
                        }`}>{game.status}</p>
                </div>
                <div className="admin-panel p-6">
                    <h3 className="text-white/50 text-sm font-medium mb-2 font-display">Players</h3>
                    <p className="text-2xl font-bold text-[#00CFF2] font-body admin-stat-glow-cyan">{game._count.players}</p>
                </div>
                <div className="admin-panel p-6">
                    <h3 className="text-white/50 text-sm font-medium mb-2 font-display">Questions</h3>
                    <p className="text-2xl font-bold text-[#FB72FF] font-body admin-stat-glow-pink">
                        {game._count.questions}
                    </p>
                </div>
            </div>

            <div className="admin-panel p-6 space-y-4">
                <h2 className="text-xl font-bold text-white font-display">Actions</h2>
                <div className="flex flex-wrap gap-4">
                    {game.status === "LIVE" && (
                        <form
                            action={async () => {
                                "use server";
                                await endGameAction(game.id);
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
                    {game.status === "ENDED" && (
                        <div className="flex items-center gap-2 text-[#14B985]">
                            <span className="text-lg">✓</span>
                            <p className="font-medium">Game has ended. Ranks have been calculated.</p>
                        </div>
                    )}
                    {game.status === "SCHEDULED" && (
                        <p className="text-white/50">Game is scheduled. Actions will be available when the game goes live.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

