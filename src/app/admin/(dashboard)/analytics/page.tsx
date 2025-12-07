import { prisma } from "@/lib/db";
import { StatsCard } from "@/components/admin/StatsCard";
import { UsersIcon, TrophyIcon, BanknotesIcon, ChartBarIcon } from "@heroicons/react/24/outline";

async function getAnalytics() {
    // User growth
    const usersLast7Days = await prisma.user.count({
        where: {
            createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
        },
    });

    const usersLast14Days = await prisma.user.count({
        where: {
            createdAt: {
                gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
        },
    });

    // Revenue
    const revenueLast7Days = await prisma.ticket.aggregate({
        where: {
            status: { in: ["PAID", "REDEEMED"] },
            purchasedAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
        },
        _sum: { amountUSDC: true },
    });

    const revenueLast14Days = await prisma.ticket.aggregate({
        where: {
            status: { in: ["PAID", "REDEEMED"] },
            purchasedAt: {
                gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
        },
        _sum: { amountUSDC: true },
    });

    // Top games by participants
    const topGames = await prisma.game.findMany({
        take: 5,
        orderBy: {
            players: {
                _count: "desc",
            },
        },
        select: {
            id: true,
            title: true,
            status: true,
            _count: {
                select: {
                    players: true,
                    tickets: true,
                },
            },
        },
    });

    // Referral stats
    const totalReferrals = await prisma.user.count({
        where: {
            invitedById: {
                not: null,
            },
        },
    });

    const avgReferralsPerUser = await prisma.user.aggregate({
        _avg: {
            inviteQuota: true,
        },
    });

    return {
        usersLast7Days,
        usersLast14Days,
        revenueLast7Days: revenueLast7Days._sum.amountUSDC || 0,
        revenueLast14Days: revenueLast14Days._sum.amountUSDC || 0,
        topGames,
        totalReferrals,
        avgReferralsPerUser: avgReferralsPerUser._avg.inviteQuota || 0,
    };
}

export default async function AnalyticsPage() {
    const analytics = await getAnalytics();

    const userGrowth =
        analytics.usersLast14Days > 0
            ? (((analytics.usersLast7Days - analytics.usersLast14Days) / analytics.usersLast14Days) * 100).toFixed(1)
            : "0";

    const revenueGrowth =
        analytics.revenueLast14Days > 0
            ? (((analytics.revenueLast7Days - analytics.revenueLast14Days) / analytics.revenueLast14Days) * 100).toFixed(1)
            : "0";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white font-display">Analytics</h1>
                <p className="text-white/60 mt-1 font-display">Detailed platform metrics and insights</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="New Users (7d)"
                    value={analytics.usersLast7Days}
                    icon={<UsersIcon className="h-6 w-6 text-[#00CFF2]" />}
                    trend={{
                        value: `${userGrowth}%`,
                        isPositive: parseInt(userGrowth) >= 0,
                    }}
                    glowVariant="cyan"
                />
                <StatsCard
                    title="Revenue (7d)"
                    value={`$${analytics.revenueLast7Days}`}
                    icon={<BanknotesIcon className="h-6 w-6 text-[#FFC931]" />}
                    trend={{
                        value: `${revenueGrowth}%`,
                        isPositive: parseFloat(revenueGrowth) >= 0,
                    }}
                    glowVariant="gold"
                />
                <StatsCard
                    title="Total Referrals"
                    value={analytics.totalReferrals}
                    icon={<ChartBarIcon className="h-6 w-6 text-[#FB72FF]" />}
                    glowVariant="pink"
                />
                <StatsCard
                    title="Avg. Invite Quota"
                    value={analytics.avgReferralsPerUser.toFixed(1)}
                    icon={<UsersIcon className="h-6 w-6 text-[#14B985]" />}
                    glowVariant="success"
                />
            </div>

            {/* Top Games */}
            <div className="admin-panel overflow-hidden">
                <div className="px-6 py-4 border-b border-white/6">
                    <h2 className="text-lg font-semibold text-white font-display">Top Games by Participation</h2>
                </div>
                <div className="divide-y divide-white/6">
                    {analytics.topGames.map((game, index) => (
                        <div key={game.id} className="px-6 py-4 flex items-center justify-between admin-table-row">
                            <div className="flex items-center gap-4">
                                <span className={`text-2xl font-bold font-body ${index === 0 ? "text-[#FFC931] admin-stat-glow" :
                                        index === 1 ? "text-[#00CFF2]" :
                                            index === 2 ? "text-[#FB72FF]" : "text-white/40"
                                    }`}>
                                    #{index + 1}
                                </span>
                                <div>
                                    <h3 className="font-medium text-white">{game.title}</h3>
                                    <p className="text-sm text-white/50">{game._count.tickets} tickets sold</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-[#FFC931] font-body admin-stat-glow">{game._count.players}</div>
                                <div className="text-xs text-white/50 font-display">players</div>
                            </div>
                        </div>
                    ))}
                    {analytics.topGames.length === 0 && (
                        <div className="px-6 py-8 text-center text-white/50 font-display">
                            No games yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

