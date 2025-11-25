import { prisma } from "@/lib/db";
import Link from "next/link";
import { UserFilters } from "@/components/admin/UserFilters";

async function getUsers(searchParams: { page?: string; status?: string; q?: string; role?: string }) {
    const page = parseInt(searchParams.page || "1");
    const pageSize = 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (searchParams.status) {
        where.status = searchParams.status;
    }

    if (searchParams.role) {
        where.role = searchParams.role;
    }

    if (searchParams.q) {
        const isNumber = !isNaN(parseInt(searchParams.q));
        where.OR = [
            { username: { contains: searchParams.q, mode: "insensitive" } },
            { wallet: { contains: searchParams.q, mode: "insensitive" } },
            ...(isNumber ? [{ fid: { equals: parseInt(searchParams.q) } }] : []),
        ];
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                fid: true,
                username: true,
                wallet: true,
                status: true,
                role: true,
                inviteQuota: true,
                inviteCode: true,
                createdAt: true,
                _count: {
                    select: {
                        invites: true,
                        games: true,
                        tickets: true,
                    },
                },
            },
        }),
        prisma.user.count({ where }),
    ]);

    return { users, total, page, pageSize };
}

function UserStatusBadge({ status }: { status: string }) {
    const colors = {
        NONE: "bg-slate-700 text-slate-400",
        WAITLIST: "bg-yellow-100 text-yellow-800",
        ACTIVE: "bg-green-100 text-green-800",
        BANNED: "bg-red-100 text-red-800",
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.NONE
                }`}
        >
            {status}
        </span>
    );
}

export default async function UsersListPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; status?: string; q?: string; role?: string }>;
}) {
    const resolvedParams = await searchParams;
    const { users, total, page, pageSize } = await getUsers(resolvedParams);
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Users</h1>
                    <p className="text-slate-400 mt-1">
                        {total.toLocaleString()} total users
                    </p>
                </div>
            </div>

            {/* Filters */}
            <UserFilters />

            {/* Users Table */}
            <div className="bg-slate-800 shadow-sm rounded-xl border border-slate-700 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                Invites
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                Activity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-800 divide-y divide-slate-700">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-900 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="font-medium text-slate-100">
                                            {user.username || "Anonymous"}
                                        </div>
                                        <div className="text-sm text-slate-400">@{user.username}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <UserStatusBadge status={user.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.role === "ADMIN"
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-slate-700 text-slate-400"
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                    <div>{user._count.invites} referred</div>
                                    <div className="text-xs text-slate-400">{user.inviteQuota} quota</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                    <div>{user._count.games} games</div>
                                    <div className="text-xs text-slate-400">{user._count.tickets} tickets</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <Link
                                        href={`/admin/users/${user.id}`}
                                        className="text-purple-600 hover:text-purple-800 font-medium hover:underline"
                                    >
                                        View Details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    No users found matching your filters.
                                </td>
                            </tr>
                        )}
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
                                href={`?page=${page - 1}${resolvedParams.status ? `&status=${resolvedParams.status}` : ""}${resolvedParams.q ? `&q=${resolvedParams.q}` : ""}${resolvedParams.role ? `&role=${resolvedParams.role}` : ""}`}
                                className="px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-900 text-sm font-medium"
                            >
                                Previous
                            </Link>
                        )}
                        {page < totalPages && (
                            <Link
                                href={`?page=${page + 1}${resolvedParams.status ? `&status=${resolvedParams.status}` : ""}${resolvedParams.q ? `&q=${resolvedParams.q}` : ""}${resolvedParams.role ? `&role=${resolvedParams.role}` : ""}`}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
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
