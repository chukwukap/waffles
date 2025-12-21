import { prisma } from "@/lib/db";
import { StatsCard } from "@/components/admin/StatsCard";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import {
    UsersIcon,
    TrophyIcon,
    BanknotesIcon,
    TicketIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { getGamePhase } from "@/lib/game-utils";

async function getStats() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
        totalUsers,
        activeUsers,
        totalGames,
        // Count live games using time-based phase
        liveGamesRaw,
        // Use gameEntry instead of ticket
        totalEntries,
        paidEntries,
        recentUsers,
        recentEntries
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { hasGameAccess: true } }),
        prisma.game.count(),
        prisma.game.findMany({
            where: { startsAt: { lte: now }, endsAt: { gt: now } },
            select: { id: true },
        }),
        prisma.gameEntry.count(),
        prisma.gameEntry.count({ where: { paidAt: { not: null } } }),
        // Fetch recent data for charts
        prisma.user.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { createdAt: true },
        }),
        prisma.gameEntry.findMany({
            where: {
                paidAt: { not: null, gte: sevenDaysAgo }
            },
            select: {
                paidAt: true,
                paidAmount: true,
            },
        }),
    ]);

    // Calculate total revenue from games' prizePool
    const revenueResult = await prisma.game.aggregate({
        _sum: { prizePool: true },
    });

    // Process chart data
    const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        return d.toISOString().split('T')[0];
    });

    const userGrowth = dates.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        count: recentUsers.filter((u: { createdAt: Date }) => u.createdAt.toISOString().startsWith(date)).length
    }));

    const revenueData = dates.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        amount: recentEntries
            .filter((e: { paidAt: Date | null }) => e.paidAt?.toISOString().startsWith(date))
            .reduce((sum: number, e: { paidAmount: number | null }) => sum + (e.paidAmount || 0), 0)
    }));

    return {
        totalUsers,
        activeUsers,
        totalGames,
        liveGames: liveGamesRaw.length,
        totalTickets: totalEntries,
        paidTickets: paidEntries,
        totalRevenue: revenueResult._sum.prizePool || 0,
        userGrowth,
        revenueData,
    };
}

async function getRecentActivity() {
    const [games, users] = await Promise.all([
        prisma.game.findMany({
            take: 3,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                startsAt: true,
                endsAt: true,
                playerCount: true,
            },
        }),
        prisma.user.findMany({
            take: 3,
            orderBy: { createdAt: "desc" },
        }),
    ]);

    return { games, users };
}

export default async function AdminDashboard() {
    const stats = await getStats();
    const activity = await getRecentActivity();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white font-display">Dashboard</h1>
                <p className="text-white/60 mt-1">
                    Overview of your Waffles trivia platform
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Users"
                    value={stats.totalUsers.toLocaleString()}
                    subtitle={`${stats.activeUsers} active`}
                    icon={<UsersIcon className="h-6 w-6 text-[#00CFF2]" />}
                    trend={{ value: "12%", isPositive: true }}
                    glowVariant="cyan"
                />
                <StatsCard
                    title="Total Games"
                    value={stats.totalGames}
                    subtitle={`${stats.liveGames} live now`}
                    icon={<TrophyIcon className="h-6 w-6 text-[#FB72FF]" />}
                    glowVariant="pink"
                />
                <StatsCard
                    title="Revenue"
                    value={`$${stats.totalRevenue.toLocaleString()}`}
                    subtitle="USDC"
                    icon={<BanknotesIcon className="h-6 w-6 text-[#FFC931]" />}
                    trend={{ value: "5%", isPositive: true }}
                    glowVariant="gold"
                />
                <StatsCard
                    title="Tickets Sold"
                    value={stats.paidTickets.toLocaleString()}
                    subtitle={`${stats.totalTickets} total`}
                    icon={<TicketIcon className="h-6 w-6 text-[#14B985]" />}
                    glowVariant="success"
                />
            </div>

            {/* Charts */}
            <DashboardCharts
                userGrowth={stats.userGrowth}
                revenueData={stats.revenueData}
            />

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Games */}
                <div className="bg-linear-to-br from-[#FB72FF]/5 to-transparent border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white font-display">Recent Games</h2>
                        <Link href="/admin/games" className="text-sm text-[#FFC931] hover:underline font-display">View all</Link>
                    </div>
                    <div className="divide-y divide-white/10">
                        {activity.games.length === 0 ? (
                            <div className="p-6 text-center text-white/50">No games yet</div>
                        ) : (
                            activity.games.map((game) => {
                                const phase = getGamePhase(game);
                                return (
                                    <div key={game.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/3 transition-colors">
                                        <div>
                                            <p className="font-medium text-white">{game.title}</p>
                                            <p className="text-xs text-white/50">{new Date(game.startsAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${phase === "LIVE"
                                                ? "bg-[#14B985]/20 text-[#14B985]"
                                                : "bg-white/10 text-white/60"
                                                }`}>
                                                {phase}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* New Users */}
                <div className="bg-linear-to-br from-[#00CFF2]/5 to-transparent border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white font-display">New Users</h2>
                        <Link href="/admin/users" className="text-sm text-[#FFC931] hover:underline font-display">View all</Link>
                    </div>
                    <div className="divide-y divide-white/10">
                        {activity.users.length === 0 ? (
                            <div className="p-6 text-center text-white/50">No users yet</div>
                        ) : (
                            activity.users.map((user) => (
                                <div key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/3 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-[#FFC931]/20 rounded-full flex items-center justify-center text-[#FFC931] font-bold text-xs">
                                            {user.username?.[0] || "U"}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{user.username || "Anonymous"}</p>
                                            <p className="text-xs text-white/50">@{user.username}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-white/50">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
