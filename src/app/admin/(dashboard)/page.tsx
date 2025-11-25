import { prisma } from "@/lib/db";
import { StatsCard } from "@/components/admin/StatsCard";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import {
    UsersIcon,
    TrophyIcon,
    BanknotesIcon,
    TicketIcon,
    ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

async function getStats() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
        totalUsers,
        activeUsers,
        totalGames,
        liveGames,
        totalTickets,
        paidTickets,
        recentUsers,
        recentTickets
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.game.count(),
        prisma.game.count({ where: { status: "LIVE" } }),
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: "PAID" } }),
        // Fetch recent data for charts (simplified for now, fetching last 7 days raw)
        prisma.user.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { createdAt: true },
        }),
        prisma.ticket.findMany({
            where: {
                status: "PAID",
                purchasedAt: { gte: sevenDaysAgo }
            },
            select: { purchasedAt: true, amountUSDC: true },
        }),
    ]);

    // Calculate total revenue
    const revenue = await prisma.ticket.aggregate({
        where: { status: { in: ["PAID", "REDEEMED"] } },
        _sum: { amountUSDC: true },
    });

    // Process chart data
    const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        return d.toISOString().split('T')[0];
    });

    const userGrowth = dates.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        count: recentUsers.filter(u => u.createdAt.toISOString().startsWith(date)).length
    }));

    const revenueData = dates.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        amount: recentTickets
            .filter(t => t.purchasedAt.toISOString().startsWith(date))
            .reduce((sum, t) => sum + (t.amountUSDC || 0), 0)
    }));

    return {
        totalUsers,
        activeUsers,
        totalGames,
        liveGames,
        totalTickets,
        paidTickets,
        totalRevenue: revenue._sum.amountUSDC || 0,
        userGrowth,
        revenueData,
    };
}

async function getRecentActivity() {
    const [games, users] = await Promise.all([
        prisma.game.findMany({
            take: 3,
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { players: true } } },
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
                <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
                <p className="text-slate-400 mt-1">
                    Overview of your Waffles trivia platform
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Users"
                    value={stats.totalUsers.toLocaleString()}
                    subtitle={`${stats.activeUsers} active`}
                    icon={<UsersIcon className="h-6 w-6 text-purple-600" />}
                    trend={{ value: "12%", isPositive: true }}
                />
                <StatsCard
                    title="Total Games"
                    value={stats.totalGames}
                    subtitle={`${stats.liveGames} live now`}
                    icon={<TrophyIcon className="h-6 w-6 text-blue-600" />}
                />
                <StatsCard
                    title="Revenue"
                    value={`$${stats.totalRevenue.toLocaleString()}`}
                    subtitle="USDC"
                    icon={<BanknotesIcon className="h-6 w-6 text-green-600" />}
                    trend={{ value: "5%", isPositive: true }}
                />
                <StatsCard
                    title="Tickets Sold"
                    value={stats.paidTickets.toLocaleString()}
                    subtitle={`${stats.totalTickets} total`}
                    icon={<TicketIcon className="h-6 w-6 text-pink-600" />}
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
                <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700">
                    <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-100">Recent Games</h2>
                        <Link href="/admin/games" className="text-sm text-purple-600 hover:underline">View all</Link>
                    </div>
                    <div className="divide-y divide-slate-700">
                        {activity.games.length === 0 ? (
                            <div className="p-6 text-center text-slate-400">No games yet</div>
                        ) : (
                            activity.games.map((game) => (
                                <div key={game.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-900">
                                    <div>
                                        <p className="font-medium text-slate-100">{game.title}</p>
                                        <p className="text-xs text-slate-400">{new Date(game.startsAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${game.status === "LIVE" ? "bg-green-100 text-green-800" : "bg-slate-700 text-slate-400"
                                            }`}>
                                            {game.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* New Users */}
                <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700">
                    <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-100">New Users</h2>
                        <Link href="/admin/users" className="text-sm text-purple-600 hover:underline">View all</Link>
                    </div>
                    <div className="divide-y divide-slate-700">
                        {activity.users.length === 0 ? (
                            <div className="p-6 text-center text-slate-400">No users yet</div>
                        ) : (
                            activity.users.map((user) => (
                                <div key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-900">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs">
                                            {user.username?.[0] || "U"}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-100">{user.username || "Anonymous"}</p>
                                            <p className="text-xs text-slate-400">@{user.username}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400">
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
