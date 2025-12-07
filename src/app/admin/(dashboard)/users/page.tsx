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
        NONE: "bg-white/10 text-white/60",
        WAITLIST: "bg-[#FFC931]/20 text-[#FFC931]",
        ACTIVE: "bg-[#14B985]/20 text-[#14B985]",
        BANNED: "bg-red-500/20 text-red-400",
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
                    <h1 className="text-2xl font-bold text-white font-display">Users</h1>
                    <p className="text-white/60 mt-1">
                        <span className="text-[#FFC931] font-bold">{total.toLocaleString()}</span> total users
                    </p>
                </div>
            </div>

            {/* Filters */}
            <UserFilters />

            {/* Users Table */}
            <div className="admin-panel overflow-hidden">
                <table className="min-w-full divide-y divide-white/6">
                    <thead className="bg-white/3">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase font-display">
                                User
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase font-display">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase font-display">
                                Role
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase font-display">
                                Invites
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase font-display">
                                Activity
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase font-display">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/6">
                        {users.map((user) => (
                            <tr key={user.id} className="admin-table-row">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 bg-[#FFC931]/20 rounded-full flex items-center justify-center text-[#FFC931] font-bold text-sm">
                                            {user.username?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">
                                                {user.username || "Anonymous"}
                                            </div>
                                            <div className="text-sm text-white/50">@{user.username}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <UserStatusBadge status={user.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.role === "ADMIN"
                                        ? "bg-[#FB72FF]/20 text-[#FB72FF]"
                                        : "bg-white/10 text-white/60"
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="text-white">{user._count.invites} <span className="text-white/50">referred</span></div>
                                    <div className="text-xs text-white/40">{user.inviteQuota} quota left</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="text-white">{user._count.games} <span className="text-white/50">games</span></div>
                                    <div className="text-xs text-white/40">{user._count.tickets} tickets</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <Link
                                        href={`/admin/users/${user.id}`}
                                        className="text-[#FFC931] hover:text-[#FFD966] font-medium hover:underline transition-colors"
                                    >
                                        View Details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                                            <span className="text-3xl">👤</span>
                                        </div>
                                        <p className="text-white font-display">No users found</p>
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
                                href={`?page=${page - 1}${resolvedParams.status ? `&status=${resolvedParams.status}` : ""}${resolvedParams.q ? `&q=${resolvedParams.q}` : ""}${resolvedParams.role ? `&role=${resolvedParams.role}` : ""}`}
                                className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 text-sm font-medium text-white transition-colors"
                            >
                                Previous
                            </Link>
                        )}
                        {page < totalPages && (
                            <Link
                                href={`?page=${page + 1}${resolvedParams.status ? `&status=${resolvedParams.status}` : ""}${resolvedParams.q ? `&q=${resolvedParams.q}` : ""}${resolvedParams.role ? `&role=${resolvedParams.role}` : ""}`}
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

