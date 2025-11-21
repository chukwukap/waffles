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
    params: { id: string };
}) {
    const user = await getUser(parseInt(params.id));

    if (!user) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/users"
                    className="text-slate-600 hover:text-slate-900"
                >
                    ← Back
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {user.username || "Anonymous"}
                    </h1>
                    <p className="text-slate-600">FID: {user.fid}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                            User Information
                        </h3>
                        <dl className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <dt className="font-medium text-slate-500">FID</dt>
                                <dd className="mt-1 text-slate-900">{user.fid}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">Username</dt>
                                <dd className="mt-1 text-slate-900">{user.username || "—"}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">Wallet</dt>
                                <dd className="mt-1 text-slate-900 font-mono text-xs truncate">
                                    {user.wallet || "—"}
                                </dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">Status</dt>
                                <dd className="mt-1">
                                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {user.status}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">Role</dt>
                                <dd className="mt-1">
                                    <span className={user.role === "ADMIN" ? "text-purple-600 font-semibold" : "text-slate-900"}>
                                        {user.role}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">Invite Code</dt>
                                <dd className="mt-1 text-slate-900 font-mono">{user.inviteCode}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">Invite Quota</dt>
                                <dd className="mt-1 text-slate-900">{user.inviteQuota}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">Joined</dt>
                                <dd className="mt-1 text-slate-900">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Activity Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                            <div className="text-2xl font-bold text-slate-900">{user._count.invites}</div>
                            <div className="text-sm text-slate-600">Referrals</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                            <div className="text-2xl font-bold text-slate-900">{user._count.games}</div>
                            <div className="text-sm text-slate-600">Games Played</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                            <div className="text-2xl font-bold text-slate-900">{user._count.tickets}</div>
                            <div className="text-sm text-slate-600">Tickets</div>
                        </div>
                    </div>

                    {/* Recent Tickets */}
                    {user.tickets.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                Recent Tickets
                            </h3>
                            <div className="space-y-3">
                                {user.tickets.map((ticket) => (
                                    <div key={ticket.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                                        <div>
                                            <div className="font-medium text-slate-900">{ticket.game.title}</div>
                                            <div className="text-sm text-slate-500">
                                                {new Date(ticket.purchasedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium text-slate-900">${ticket.amountUSDC}</div>
                                            <div className="text-xs text-slate-500">{ticket.status}</div>
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
