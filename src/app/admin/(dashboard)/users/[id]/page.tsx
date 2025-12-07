import { prisma } from "@/lib/db";
import Link from "next/link";
import { UserActions } from "@/components/admin/UserActions";
import { notFound } from "next/navigation";

async function getUser(id: number) {
    return prisma.user.findUnique({
        where: { id },
        include: {
            invites: {
                select: {
                    id: true,
                    fid: true,
                    username: true,
                    status: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            },
            invitedBy: {
                select: {
                    id: true,
                    fid: true,
                    username: true,
                },
            },
            tickets: {
                select: {
                    id: true,
                    game: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    status: true,
                    amountUSDC: true,
                    purchasedAt: true,
                },
                orderBy: { purchasedAt: "desc" },
                take: 5,
            },
            games: {
                select: {
                    game: {
                        select: {
                            id: true,
                            title: true,
                            startsAt: true,
                        },
                    },
                    score: true,
                },
                orderBy: { game: { startsAt: "desc" } },
                take: 5,
            },
            _count: {
                select: {
                    invites: true,
                    tickets: true,
                    games: true,
                },
            },
        },
    });
}

export default async function UserDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getUser(parseInt(id));

    if (!user) {
        notFound();
    }

    const statusColors: Record<string, string> = {
        NONE: "bg-white/10 text-white/60",
        WAITLIST: "bg-[#FFC931]/20 text-[#FFC931]",
        ACTIVE: "bg-[#14B985]/20 text-[#14B985]",
        BANNED: "bg-red-500/20 text-red-400",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/users"
                    className="text-white/50 hover:text-[#FFC931] transition-colors"
                >
                    ← Back
                </Link>
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-[#FFC931]/20 rounded-full flex items-center justify-center text-[#FFC931] font-bold text-lg">
                        {user.username?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white font-display">
                            {user.username || "Anonymous"}
                        </h1>
                        <p className="text-white/50">@{user.username}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="admin-panel p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 font-display">
                            User Information
                        </h3>
                        <dl className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <dt className="font-medium text-white/50">User ID</dt>
                                <dd className="mt-1 text-white font-mono">{user.fid}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-white/50">Username</dt>
                                <dd className="mt-1 text-white">{user.username || "—"}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-white/50">Wallet</dt>
                                <dd className="mt-1 text-[#00CFF2] font-mono text-xs truncate">
                                    {user.wallet || "—"}
                                </dd>
                            </div>
                            <div>
                                <dt className="font-medium text-white/50">Status</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[user.status] || statusColors.NONE}`}>
                                        {user.status}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="font-medium text-white/50">Role</dt>
                                <dd className="mt-1">
                                    <span className={user.role === "ADMIN" ? "text-[#FB72FF] font-semibold" : "text-white"}>
                                        {user.role}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="font-medium text-white/50">Invite Code</dt>
                                <dd className="mt-1 text-[#FFC931] font-mono">{user.inviteCode}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-white/50">Invite Quota</dt>
                                <dd className="mt-1 text-white">{user.inviteQuota}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-white/50">Joined</dt>
                                <dd className="mt-1 text-white">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Activity Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="admin-panel p-4">
                            <div className="text-2xl font-bold text-[#FFC931] font-body admin-stat-glow">{user._count.invites}</div>
                            <div className="text-sm text-white/50 font-display">Referrals</div>
                        </div>
                        <div className="admin-panel p-4">
                            <div className="text-2xl font-bold text-[#00CFF2] font-body admin-stat-glow-cyan">{user._count.games}</div>
                            <div className="text-sm text-white/50 font-display">Games Played</div>
                        </div>
                        <div className="admin-panel p-4">
                            <div className="text-2xl font-bold text-[#FB72FF] font-body admin-stat-glow-pink">{user._count.tickets}</div>
                            <div className="text-sm text-white/50 font-display">Tickets</div>
                        </div>
                    </div>

                    {/* Recent Tickets */}
                    {user.tickets.length > 0 && (
                        <div className="admin-panel p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 font-display">
                                Recent Tickets
                            </h3>
                            <div className="space-y-3">
                                {user.tickets.map((ticket) => (
                                    <div key={ticket.id} className="flex justify-between items-center py-3 border-b border-white/6 last:border-0">
                                        <div>
                                            <div className="font-medium text-white">{ticket.game.title}</div>
                                            <div className="text-sm text-white/50">
                                                {new Date(ticket.purchasedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-[#FFC931]">${ticket.amountUSDC}</div>
                                            <div className={`text-xs ${ticket.status === "PAID" || ticket.status === "REDEEMED"
                                                    ? "text-[#14B985]"
                                                    : "text-white/50"
                                                }`}>{ticket.status}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions Sidebar */}
                <div>
                    <UserActions user={user} />
                </div>
            </div>
        </div>
    );
}

