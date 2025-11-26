import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { endGameAction } from "@/actions/admin/games";

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-100">{game.title}</h1>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/admin/games/${game.id}/edit`}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                        Edit
                    </Link>
                    <Link
                        href={`/admin/games/${game.id}/questions`}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                    >
                        Manage Questions
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-slate-400 text-sm font-medium mb-2">Status</h3>
                    <p className="text-2xl font-bold text-white">{game.status}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-slate-400 text-sm font-medium mb-2">Players</h3>
                    <p className="text-2xl font-bold text-white">{game._count.players}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-slate-400 text-sm font-medium mb-2">Questions</h3>
                    <p className="text-2xl font-bold text-white">
                        {game._count.questions}
                    </p>
                </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
                <h2 className="text-xl font-bold text-white">Actions</h2>
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
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-medium"
                            >
                                End Game (Calculate Ranks)
                            </button>
                        </form>
                    )}
                    {game.status === "ENDED" && (
                        <p className="text-slate-400">Game has ended. Ranks have been calculated.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
