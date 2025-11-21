import { GameStatus, prisma } from "@/lib/db";
import Link from "next/link";
import { GameFilters } from "@/components/admin/GameFilters";
import { GameActions } from "@/components/admin/GameActions";

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

function GameStatusBadge({ status }: { status: string }) {
    const colors = {
        SCHEDULED: "bg-blue-100 text-blue-800",
        LIVE: "bg-green-100 text-green-800",
        ENDED: "bg-gray-100 text-gray-800",
        CANCELLED: "bg-red-100 text-red-800",
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]
                }`}
        >
            {status}
        </span>
    );
}

async function GameRow({ game }: { game: any }) {
    return (
        <tr className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-slate-900 text-base">{game.title}</div>
                <div className="text-xs text-slate-500 capitalize mt-0.5 bg-slate-100 inline-block px-2 py-0.5 rounded-md">
                    {game.theme.toLowerCase()}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <GameStatusBadge status={game.status} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {new Date(game.startsAt).toLocaleString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                <div className="font-medium">{game._count.players} players</div>
                <div className="text-xs text-slate-400">{game._count.tickets} tickets</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {game._count.questions} questions
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
                <GameActions game={game} />
            </td>
        </tr>
    );
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
                    <h1 className="text-2xl font-bold text-slate-900 font-display">Games</h1>
                    <p className="text-slate-600 mt-1">Manage game sessions and questions</p>
                </div>
                <Link
                    href="/admin/games/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >                  Create Game
                </Link>
            </div>

            <GameFilters />

            <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Game
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Starts At
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Participants
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Questions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {games.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <p className="text-lg font-medium text-slate-900 mb-1">No games found</p>
                                            <p className="text-sm text-slate-500">
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
