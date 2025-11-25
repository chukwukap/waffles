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
                <h1 className="text-2xl font-bold text-slate-100">Tickets</h1>
                <p className="text-slate-400 mt-1">{total.toLocaleString()} total tickets</p>
            </div>

            {/* Filters */}
            <div className="bg-slate-800 shadow-sm rounded-xl border border-slate-700 p-4">
                <form className="flex gap-4">
                    <select
                        name="status"
                        defaultValue={resolvedParams.status}
                        className="px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="PAID">Paid</option>
                        <option value="REDEEMED">Redeemed</option>
                        <option value="REFUNDED">Refunded</option>
                    </select>
                    <select
                        name="game"
                        defaultValue={resolvedParams.game}
                        className="flex-1 px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">All Games</option>
                        {games.map((game) => (
                            <option key={game.id} value={game.id}>
                                {game.title}
                            </option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
                    >
                        Filter
                    </button>
                </form>
            </div>

            {/* Tickets Table */}
            <div className="bg-slate-800 shadow-sm rounded-xl border border-slate-700 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                Game
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                Created
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-800 divide-y divide-slate-700">
                        {tickets.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-slate-900">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-100">
                                    #{ticket.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-slate-100">
                                        {ticket.user.username || "Anonymous"}
                                    </div>
                                    <div className="text-xs text-slate-400">@{ticket.user.username}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-100">
                                    {ticket.game.title}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                                    ${ticket.amountUSDC}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${ticket.status === "PAID" || ticket.status === "REDEEMED"
                                            ? "bg-green-100 text-green-800"
                                            : ticket.status === "PENDING"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-gray-100 text-slate-200"
                                            }`}
                                    >
                                        {ticket.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                    {new Date(ticket.purchasedAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        {page > 1 && (
                            <Link
                                href={`?page=${page - 1}${resolvedParams.status ? `&status=${resolvedParams.status}` : ""}${resolvedParams.game ? `&game=${resolvedParams.game}` : ""}`}
                                className="px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-900"
                            >
                                Previous
                            </Link>
                        )}
                        {page < totalPages && (
                            <Link
                                href={`?page=${page + 1}${resolvedParams.status ? `&status=${resolvedParams.status}` : ""}${resolvedParams.game ? `&game=${resolvedParams.game}` : ""}`}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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
