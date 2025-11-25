import { GameStatus, prisma } from "@/lib/db";
import Link from "next/link";
import { GameFilters } from "@/components/admin/GameFilters";
import { GameActions } from "@/components/admin/GameActions";
import { GameRow } from "@/components/admin/GameRow";

// Define status type locally to avoid import issues
const VALID_STATUSES: GameStatus[] = ["SCHEDULED", "LIVE", "ENDED", "CANCELLED"];

async function getGames(searchParams: { search?: string; status?: string }) {
    const where: any = {};

    if (searchParams.search) {
        where.title = {
            contains: searchParams.search,
            mode: "insensitive",
        };
    }

    if (searchParams.status && VALID_STATUSES.includes(searchParams.status as GameStatus)) {
        where.status = searchParams.status as GameStatus;
    }

    return prisma.game.findMany({
        where,
        orderBy: [{ status: "asc" }, { startsAt: "desc" }],
        include: {
            _count: {
                select: {
                    players: true,
                    questions: true,
                    tickets: true,
                },
            },
        },
    });
}

export default async function GamesListPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; status?: string }>;
}) {
    const resolvedParams = await searchParams;
    const games = await getGames(resolvedParams);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 font-display">Games</h1>
                    <p className="text-slate-400 mt-1">Manage game sessions and questions</p>
                </div>
                <Link
                    href="/admin/games/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >                  Create Game
                </Link>
            </div>

            <GameFilters />

            <div className="bg-slate-800 shadow-sm rounded-xl border border-slate-700 overflow-visible">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Game
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Starts At
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Participants
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Questions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-800 divide-y divide-slate-700">
                            {games.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <p className="text-lg font-medium text-slate-100 mb-1">No games found</p>
                                            <p className="text-sm text-slate-400">
                                                Try adjusting your filters or create a new game.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                games.map((game) => <GameRow key={game.id} game={game} />)
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
