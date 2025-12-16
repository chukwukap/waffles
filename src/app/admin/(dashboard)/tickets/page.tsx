import { prisma } from "@/lib/db";
import Link from "next/link";

// Type for game entry with relations
interface EntryWithRelations {
    id: number;
    paidAt: Date | null;
    createdAt: Date;
    score: number;
    rank: number | null;
    user: {
        id: number;
        username: string | null;
        fid: number;
    };
    game: {
        id: number;
        title: string;
        ticketPrice: number;
    };
}

async function getEntries(searchParams: { page?: string; status?: string; game?: string }) {
    const page = parseInt(searchParams.page || "1");
    const pageSize = 50;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    // Filter by payment status
    if (searchParams.status === "PAID") {
        where.paidAt = { not: null };
    } else if (searchParams.status === "PENDING") {
        where.paidAt = null;
    }

    if (searchParams.game) {
        where.gameId = parseInt(searchParams.game);
    }

    const [entries, total, games] = await Promise.all([
        prisma.gameEntry.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        fid: true,
                    },
                },
                game: {
                    select: {
                        id: true,
                        title: true,
                        ticketPrice: true,
                    },
                },
            },
        }),
        prisma.gameEntry.count({ where }),
        prisma.game.findMany({
            select: { id: true, title: true },
            orderBy: { createdAt: "desc" },
            take: 20,
        }),
    ]);

    return { entries: entries as EntryWithRelations[], total, page, pageSize, games };
}

export default async function TicketsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; status?: string; game?: string }>;
}) {
    const resolvedParams = await searchParams;
    const { entries, total, page, pageSize, games } = await getEntries(resolvedParams);
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white font-display">Game Entries</h1>
                <p className="text-white/60 mt-1">
                    <span className="text-[#FFC931] font-bold">{total.toLocaleString()}</span> total entries
                </p>
            </div>

            {/* Filters */}
            <div className="admin-panel p-4">
                <form className="flex flex-wrap gap-4">
                    <select
                        name="status"
                        defaultValue={resolvedParams.status}
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                    >
                        <option value="" className="bg-[#0a0a0b]">All Statuses</option>
                        <option value="PENDING" className="bg-[#0a0a0b]">Pending Payment</option>
                        <option value="PAID" className="bg-[#0a0a0b]">Paid</option>
                    </select>
                    <select
                        name="game"
                        defaultValue={resolvedParams.game}
                        className="flex-1 min-w-[200px] px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                    >
                        <option value="" className="bg-[#0a0a0b]">All Games</option>
                        {games.map((game: { id: number; title: string }) => (
                            <option key={game.id} value={game.id} className="bg-[#0a0a0b]">
                                {game.title}
                            </option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#FFC931] text-black font-bold rounded-xl hover:bg-[#FFD966] transition-colors shadow-lg shadow-[#FFC931]/20"
                    >
                        Apply Filter
                    </button>
                </form>
            </div>

            {/* Entries Table */}
            <div className="admin-panel overflow-hidden">
                <table className="min-w-full divide-y divide-white/6">
                    <thead className="bg-white/3">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase font-display">
                                ID
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase font-display">
                                User
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase font-display">
                                Game
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase font-display">
                                Amount
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase font-display">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase font-display">
                                Score
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase font-display">
                                Created
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/6">
                        {entries.map((entry) => (
                            <tr key={entry.id} className="admin-table-row">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[#00CFF2]">
                                    #{entry.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-[#FFC931]/20 rounded-full flex items-center justify-center text-[#FFC931] font-bold text-xs">
                                            {entry.user.username?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div>
                                            <div className="text-sm text-white">
                                                {entry.user.username || "Anonymous"}
                                            </div>
                                            <div className="text-xs text-white/50">@{entry.user.username}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-white">
                                    {entry.game.title}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#FFC931]">
                                    ${entry.game.ticketPrice}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${entry.paidAt
                                            ? "bg-[#14B985]/20 text-[#14B985]"
                                            : "bg-[#FFC931]/20 text-[#FFC931]"
                                            }`}
                                    >
                                        {entry.paidAt ? "PAID" : "PENDING"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                    {entry.score}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/50">
                                    {new Date(entry.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {entries.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                                            <span className="text-3xl">🎟️</span>
                                        </div>
                                        <p className="text-white font-display">No entries found</p>
                                        <p className="text-sm text-white/50 mt-1">Try adjusting your filters.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-white/50">
                        Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        {page > 1 && (
                            <Link
                                href={`?page=${page - 1}${resolvedParams.status ? `&status=${resolvedParams.status}` : ""}${resolvedParams.game ? `&game=${resolvedParams.game}` : ""}`}
                                className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 text-sm font-medium text-white transition-colors"
                            >
                                Previous
                            </Link>
                        )}
                        {page < totalPages && (
                            <Link
                                href={`?page=${page + 1}${resolvedParams.status ? `&status=${resolvedParams.status}` : ""}${resolvedParams.game ? `&game=${resolvedParams.game}` : ""}`}
                                className="px-4 py-2 bg-[#FFC931] text-black rounded-xl hover:bg-[#FFD966] text-sm font-bold transition-colors"
                            >
                                Next
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
