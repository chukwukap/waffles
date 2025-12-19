import { prisma } from "@/lib/db";
import Link from "next/link";
import { UserActions } from "@/components/admin/UserActions";
import { notFound } from "next/navigation";

async function getUser(id: number) {
    return prisma.user.findUnique({
        where: { id },
        include: {
            referrals: {
                select: {
                    id: true,
                    fid: true,
                    username: true,
                    hasGameAccess: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            },
            referredBy: {
                select: {
                    id: true,
                    fid: true,
                    username: true,
                },
            },
            // Use entries instead of tickets and games
            entries: {
                select: {
                    id: true,
                    paidAmount: true,
                    game: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    score: true,
                    paidAt: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            },
            _count: {
                select: {
                    referrals: true,
                    entries: true,
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

    // Count paid entries
    const paidEntriesCount = user.entries.filter(e => e.paidAt).length;

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

            <div className="flex items-center justify-between">
                <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${user.isBanned
                        ? "bg-red-500/20 text-red-400"
                        : user.hasGameAccess
                            ? "bg-[#14B985]/20 text-[#14B985]"
                            : "bg-[#FFC931]/20 text-[#FFC931]"
                        }`}
                >
                    {user.isBanned ? "BANNED" : user.hasGameAccess ? "ACTIVE" : "WAITLIST"}
                </span>
                <UserActions user={user} />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* User Info */}
                    <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-6">
                        <h2 className="text-xl font-bold text-white mb-4 font-display">User Information</h2>
                        <dl className="grid grid-cols-2 gap-4">
                            <div>
                                <dt className="text-sm text-white/50 font-display">User ID</dt>
                                <dd className="text-white font-mono">{user.id}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-white/50 font-display">Farcaster ID</dt>
                                <dd className="text-white font-mono">{user.fid}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-white/50 font-display">Role</dt>
                                <dd className={`${user.role === "ADMIN" ? "text-[#FB72FF]" : "text-white"}`}>
                                    {user.role}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-white/50 font-display">Wallet</dt>
                                <dd className="text-white font-mono text-xs truncate">
                                    {user.wallet || "Not connected"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-white/50 font-display">Invite Code</dt>
                                <dd className="text-[#FFC931] font-mono">{user.inviteCode}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-white/50 font-display">Referred By</dt>
                                <dd className="text-white">
                                    {user.referredBy ? (
                                        <Link href={`/admin/users/${user.referredBy.id}`} className="text-[#FFC931] hover:underline">
                                            @{user.referredBy.username}
                                        </Link>
                                    ) : (
                                        <span className="text-white/50">-</span>
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-white/50 font-display">Joined At</dt>
                                <dd className="text-white">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Activity Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-4">
                            <div className="text-2xl font-bold text-[#FFC931] font-body ">{user._count.referrals}</div>
                            <div className="text-sm text-white/50 font-display">Referrals</div>
                        </div>
                        <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-4">
                            <div className="text-2xl font-bold text-[#00CFF2] font-body ">{user._count.entries}</div>
                            <div className="text-sm text-white/50 font-display">Game Entries</div>
                        </div>
                        <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-4">
                            <div className="text-2xl font-bold text-[#FB72FF] font-body ">{paidEntriesCount}</div>
                            <div className="text-sm text-white/50 font-display">Paid Entries</div>
                        </div>
                    </div>

                    {/* Recent Game Entries */}
                    {user.entries.length > 0 && (
                        <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 font-display">
                                Recent Game Entries
                            </h3>
                            <div className="space-y-3">
                                {user.entries.map((entry) => (
                                    <div key={entry.id} className="flex justify-between items-center py-3 border-b border-white/6 last:border-0">
                                        <div>
                                            <div className="font-medium text-white">{entry.game.title}</div>
                                            <div className="text-sm text-white/50">
                                                {entry.paidAt ? new Date(entry.paidAt).toLocaleDateString() : "Pending payment"}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-[#FFC931]">${entry.paidAmount ?? 0}</div>
                                            <div className={`text-xs ${entry.paidAt
                                                ? "text-[#14B985]"
                                                : "text-white/50"
                                                }`}>{entry.paidAt ? "PAID" : "PENDING"}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Referrals Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 font-display">
                            Referrals ({user._count.referrals})
                        </h3>
                        {user.referrals.length === 0 ? (
                            <p className="text-white/50 text-sm">No referrals yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {user.referrals.map((referral) => (
                                    <Link
                                        key={referral.id}
                                        href={`/admin/users/${referral.id}`}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                                    >
                                        <div className="h-8 w-8 bg-[#FFC931]/20 rounded-full flex items-center justify-center text-[#FFC931] font-bold text-xs">
                                            {referral.username?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                @{referral.username}
                                            </p>
                                            <p className="text-xs text-white/50">
                                                {new Date(referral.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span
                                            className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${referral.hasGameAccess
                                                ? "bg-[#14B985]/20 text-[#14B985]"
                                                : "bg-[#FFC931]/20 text-[#FFC931]"
                                                }`}
                                        >
                                            {referral.hasGameAccess ? "ACTIVE" : "WAITLIST"}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
