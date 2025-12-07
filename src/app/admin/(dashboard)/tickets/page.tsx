import { prisma } from "@/lib/db";
import Link from "next/link";

async function getTickets(searchParams: { page?: string; status?: string; game?: string }) {
    const page = parseInt(searchParams.page || "1");
    const pageSize = 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (searchParams.status) {
        where.status = searchParams.status;
    }

    if (searchParams.game) {
        where.gameId = parseInt(searchParams.game);
    }

    const [tickets, total, games] = await Promise.all([
        prisma.ticket.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { purchasedAt: "desc" },
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
                    },
                },
            },
        }),
        prisma.ticket.count({ where }),
        prisma.game.findMany({
            select: { id: true, title: true },
            orderBy: { createdAt: "desc" },
            take: 20,
        }),
    ]);

    return { tickets, total, page, pageSize, games };
}

export default async function TicketsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; status?: string; game?: string }>;
}) {
    const resolvedParams = await searchParams;
    const { tickets, total, page, pageSize, games } = await getTickets(resolvedParams);
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white font-display">Tickets</h1>
                <p className="text-white/60 mt-1">
                    <span className="text-[#FFC931] font-bold">{total.toLocaleString()}</span> total tickets
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
                        <option value="PENDING" className="bg-[#0a0a0b]">Pending</option>
                        <option value="PAID" className="bg-[#0a0a0b]">Paid</option>
                        <option value="REDEEMED" className="bg-[#0a0a0b]">Redeemed</option>
                        <option value="REFUNDED" className="bg-[#0a0a0b]">Refunded</option>
                    </select>
                    <select
                        name="game"
                        defaultValue={resolvedParams.game}
                        className="flex-1 min-w-[200px] px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                    >
                        <option value="" className="bg-[#0a0a0b]">All Games</option>
                        {games.map((game) => (
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

            {/* Tickets Table */}
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
                                Created
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/6">
                        {tickets.map((ticket) => (
                            <tr key={ticket.id} className="admin-table-row">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[#00CFF2]">
                                    #{ticket.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-[#FFC931]/20 rounded-full flex items-center justify-center text-[#FFC931] font-bold text-xs">
                                            {ticket.user.username?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div>
                                            <div className="text-sm text-white">
                                                {ticket.user.username || "Anonymous"}
                                            </div>
                                            <div className="text-xs text-white/50">@{ticket.user.username}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-white">
                                    {ticket.game.title}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#FFC931]">
                                    ${ticket.amountUSDC}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${ticket.status === "PAID" || ticket.status === "REDEEMED"
                                            ? "bg-[#14B985]/20 text-[#14B985]"
                                            : ticket.status === "PENDING"
                                                ? "bg-[#FFC931]/20 text-[#FFC931]"
                                                : "bg-white/10 text-white/60"
                                            }`}
                                    >
                                        {ticket.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/50">
                                    {new Date(ticket.purchasedAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {tickets.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                                            <span className="text-3xl">🎟️</span>
                                        </div>
                                        <p className="text-white font-display">No tickets found</p>
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

