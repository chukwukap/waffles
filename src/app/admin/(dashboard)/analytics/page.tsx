import { prisma } from "@/lib/db";
import { Suspense } from "react";
import {
    BanknotesIcon,
    UsersIcon,
    TrophyIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon,
    SparklesIcon,
} from "@heroicons/react/24/outline";
import {
    DateRangePicker,
    getDateRangeFromParam,
    KPICard,
    RevenueChart,
    UserGrowthChart,
    GamePerformanceTable,
    ReferralFunnel,
    ThemeAnalytics,
    ActivityFeed,
} from "@/components/admin/analytics";

interface AnalyticsData {
    // KPIs
    totalRevenue: number;
    previousRevenue: number;
    totalUsers: number;
    previousUsers: number;
    activeUsers: number;
    gamesPlayed: number;
    avgScore: number;
    conversionRate: number;
    kFactor: number;

    // Sparklines (daily data)
    revenueSparkline: number[];
    usersSparkline: number[];

    // Charts
    revenueData: Array<{ date: string; revenue: number; tickets: number }>;
    userGrowthData: Array<{ date: string; signups: number; cumulative: number }>;
    userStatusData: Array<{ status: string; count: number; color: string }>;

    // Tables
    gamePerformance: Array<{
        id: number;
        title: string;
        theme: string;
        status: string;
        playerCount: number;
        ticketCount: number;
        revenue: number;
        avgScore: number;
    }>;

    // Theme Analytics
    themeData: Array<{ theme: string; games: number; revenue: number; players: number }>;

    // Referral
    referralFunnel: {
        invitesSent: number;
        registered: number;
        played: number;
        rewardsClaimed: number;
    };
    topReferrers: Array<{
        id: number;
        username: string;
        referralCount: number;
        revenueGenerated: number;
    }>;

    // Activity
    liveGamesCount: number;
    activePlayersCount: number;
    recentActivities: Array<{
        type: "ticket" | "signup" | "game_end" | "game_start";
        message: string;
        timestamp: Date;
        metadata?: { amount?: number };
    }>;
}

async function getAnalytics(range: string): Promise<AnalyticsData> {
    const { start, end } = getDateRangeFromParam(range);
    const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(start.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Parallel data fetching for performance
    const [
        // Revenue metrics
        currentRevenue,
        previousRevenue,
        ticketsByDay,

        // User metrics
        totalUsers,
        previousPeriodUsers,
        activeUsers,
        usersByDay,
        userStatusCounts,

        // Game metrics
        gamesPlayed,
        topGames,
        gamesByTheme,
        liveGames,

        // Player metrics
        avgScoreResult,
        activePlayersInLive,

        // Referral metrics
        referredUsers,
        usersWhoPlayed,
        claimedRewards,
        topReferrersData,

        // Recent activity
        recentTickets,
        recentSignups,
        recentGameEnds,
    ] = await Promise.all([
        // Current period revenue
        prisma.ticket.aggregate({
            where: {
                status: { in: ["PAID", "REDEEMED"] },
                purchasedAt: { gte: start, lte: end },
            },
            _sum: { amountUSDC: true },
        }),

        // Previous period revenue
        prisma.ticket.aggregate({
            where: {
                status: { in: ["PAID", "REDEEMED"] },
                purchasedAt: { gte: previousStart, lt: start },
            },
            _sum: { amountUSDC: true },
        }),

        // Daily tickets
        prisma.ticket.groupBy({
            by: ["purchasedAt"],
            where: {
                status: { in: ["PAID", "REDEEMED"] },
                purchasedAt: { gte: start, lte: end },
            },
            _sum: { amountUSDC: true },
            _count: true,
        }),

        // Total users in period
        prisma.user.count({
            where: { createdAt: { gte: start, lte: end } },
        }),

        // Previous period users
        prisma.user.count({
            where: { createdAt: { gte: previousStart, lt: start } },
        }),

        // Active users (have played a game)
        prisma.user.count({
            where: {
                status: "ACTIVE",
                games: { some: {} },
            },
        }),

        // Users by day
        prisma.user.groupBy({
            by: ["createdAt"],
            where: { createdAt: { gte: start, lte: end } },
            _count: true,
        }),

        // User status distribution
        prisma.user.groupBy({
            by: ["status"],
            _count: true,
        }),

        // Games played (ENDED status)
        prisma.game.count({
            where: {
                status: "ENDED",
                endsAt: { gte: start, lte: end },
            },
        }),

        // Top games by revenue
        prisma.game.findMany({
            take: 10,
            orderBy: { tickets: { _count: "desc" } },
            where: {
                startsAt: { gte: start, lte: end },
            },
            include: {
                _count: { select: { players: true, tickets: true } },
                tickets: {
                    where: { status: { in: ["PAID", "REDEEMED"] } },
                    select: { amountUSDC: true },
                },
                players: {
                    select: { score: true },
                },
            },
        }),

        // Games by theme
        prisma.game.groupBy({
            by: ["theme"],
            where: { startsAt: { gte: start, lte: end } },
            _count: true,
        }),

        // Live games count
        prisma.game.count({
            where: { status: "LIVE" },
        }),

        // Average score
        prisma.gamePlayer.aggregate({
            _avg: { score: true },
        }),

        // Active players in live games
        prisma.gamePlayer.count({
            where: {
                game: { status: "LIVE" },
            },
        }),

        // Referred users (have invitedById)
        prisma.user.count({
            where: { invitedById: { not: null } },
        }),

        // Users who played after being referred
        prisma.user.count({
            where: {
                invitedById: { not: null },
                games: { some: {} },
            },
        }),

        // Claimed rewards
        prisma.referralReward.count({
            where: { status: "CLAIMED" },
        }),

        // Top referrers
        prisma.user.findMany({
            take: 10,
            where: {
                invites: { some: {} },
            },
            select: {
                id: true,
                username: true,
                _count: { select: { invites: true } },
                invites: {
                    select: {
                        tickets: {
                            where: { status: { in: ["PAID", "REDEEMED"] } },
                            select: { amountUSDC: true },
                        },
                    },
                },
            },
            orderBy: { invites: { _count: "desc" } },
        }),

        // Recent tickets
        prisma.ticket.findMany({
            take: 5,
            orderBy: { purchasedAt: "desc" },
            where: { status: { in: ["PAID", "REDEEMED"] } },
            include: { user: { select: { username: true } }, game: { select: { title: true } } },
        }),

        // Recent signups
        prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            select: { id: true, username: true, createdAt: true },
        }),

        // Recent game ends
        prisma.game.findMany({
            take: 3,
            orderBy: { endsAt: "desc" },
            where: { status: "ENDED" },
            select: { id: true, title: true, endsAt: true, _count: { select: { players: true } } },
        }),
    ]);

    // Process daily data for charts
    const dailyMap = new Map<string, { revenue: number; tickets: number; signups: number }>();

    // Initialize all dates in range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        dailyMap.set(dateStr, { revenue: 0, tickets: 0, signups: 0 });
    }

    // Fill in ticket data
    ticketsByDay.forEach((day) => {
        const dateStr = new Date(day.purchasedAt).toISOString().split("T")[0];
        const existing = dailyMap.get(dateStr) || { revenue: 0, tickets: 0, signups: 0 };
        existing.revenue += day._sum.amountUSDC || 0;
        existing.tickets += day._count;
        dailyMap.set(dateStr, existing);
    });

    // Fill in user data
    usersByDay.forEach((day) => {
        const dateStr = new Date(day.createdAt).toISOString().split("T")[0];
        const existing = dailyMap.get(dateStr) || { revenue: 0, tickets: 0, signups: 0 };
        existing.signups += day._count;
        dailyMap.set(dateStr, existing);
    });

    // Convert to arrays
    const sortedDates = Array.from(dailyMap.keys()).sort();
    let cumulativeUsers = 0;

    const revenueData = sortedDates.map((date) => {
        const data = dailyMap.get(date)!;
        return { date: date.slice(5), revenue: data.revenue, tickets: data.tickets };
    });

    const userGrowthData = sortedDates.map((date) => {
        const data = dailyMap.get(date)!;
        cumulativeUsers += data.signups;
        return { date: date.slice(5), signups: data.signups, cumulative: cumulativeUsers };
    });

    // Process user status
    const statusColors: Record<string, string> = {
        ACTIVE: "#14B985",
        WAITLIST: "#FFC931",
        NONE: "#666",
        BANNED: "#EF4444",
    };

    const userStatusData = userStatusCounts.map((s) => ({
        status: s.status,
        count: s._count,
        color: statusColors[s.status] || "#666",
    }));

    // Process game performance
    const gamePerformance = topGames.map((game) => ({
        id: game.id,
        title: game.title,
        theme: game.theme,
        status: game.status,
        playerCount: game._count.players,
        ticketCount: game._count.tickets,
        revenue: game.tickets.reduce((sum, t) => sum + t.amountUSDC, 0),
        avgScore: game.players.length > 0
            ? game.players.reduce((sum, p) => sum + p.score, 0) / game.players.length
            : 0,
    }));

    // Process theme data with revenue
    const themeRevenueMap = new Map<string, { games: number; revenue: number; players: number }>();
    topGames.forEach((game) => {
        const existing = themeRevenueMap.get(game.theme) || { games: 0, revenue: 0, players: 0 };
        existing.games += 1;
        existing.revenue += game.tickets.reduce((sum, t) => sum + t.amountUSDC, 0);
        existing.players += game._count.players;
        themeRevenueMap.set(game.theme, existing);
    });

    const themeData = Array.from(themeRevenueMap.entries()).map(([theme, data]) => ({
        theme,
        ...data,
    }));

    // Process top referrers
    const topReferrers = topReferrersData.map((user) => ({
        id: user.id,
        username: user.username || `user${user.id}`,
        referralCount: user._count.invites,
        revenueGenerated: user.invites.reduce(
            (sum, invite) => sum + invite.tickets.reduce((ts, t) => ts + t.amountUSDC, 0),
            0
        ),
    }));

    // Calculate K-factor
    const totalInviters = await prisma.user.count({ where: { invites: { some: {} } } });
    const kFactor = totalInviters > 0 ? referredUsers / totalInviters : 0;

    // Calculate conversion rate
    const ticketBuyers = await prisma.user.count({ where: { tickets: { some: {} } } });
    const allUsers = await prisma.user.count();
    const conversionRate = allUsers > 0 ? (ticketBuyers / allUsers) * 100 : 0;

    // Build recent activities
    const recentActivities: AnalyticsData["recentActivities"] = [
        ...recentTickets.map((t) => ({
            type: "ticket" as const,
            message: `${t.user.username || "User"} bought a ticket for ${t.game.title}`,
            timestamp: t.purchasedAt,
            metadata: { amount: t.amountUSDC },
        })),
        ...recentSignups.map((u) => ({
            type: "signup" as const,
            message: `@${u.username || `user${u.id}`} joined Waffles`,
            timestamp: u.createdAt,
        })),
        ...recentGameEnds.map((g) => ({
            type: "game_end" as const,
            message: `${g.title} ended with ${g._count.players} players`,
            timestamp: g.endsAt,
        })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    // Sparkline data (last 7 values)
    const revenueSparkline = revenueData.slice(-7).map((d) => d.revenue);
    const usersSparkline = userGrowthData.slice(-7).map((d) => d.signups);

    return {
        totalRevenue: currentRevenue._sum.amountUSDC || 0,
        previousRevenue: previousRevenue._sum.amountUSDC || 0,
        totalUsers,
        previousUsers: previousPeriodUsers,
        activeUsers,
        gamesPlayed,
        avgScore: avgScoreResult._avg.score || 0,
        conversionRate,
        kFactor,
        revenueSparkline,
        usersSparkline,
        revenueData,
        userGrowthData,
        userStatusData,
        gamePerformance,
        themeData,
        referralFunnel: {
            invitesSent: allUsers, // Approximate
            registered: referredUsers,
            played: usersWhoPlayed,
            rewardsClaimed: claimedRewards,
        },
        topReferrers,
        liveGamesCount: liveGames,
        activePlayersCount: activePlayersInLive,
        recentActivities,
    };
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="admin-panel p-5 h-32">
                        <div className="h-4 w-20 bg-white/10 rounded mb-3" />
                        <div className="h-8 w-24 bg-white/10 rounded" />
                    </div>
                ))}
            </div>
            <div className="admin-panel h-96" />
        </div>
    );
}

async function AnalyticsContent({ range }: { range: string }) {
    const data = await getAnalytics(range);

    const revenueChange = data.previousRevenue > 0
        ? ((data.totalRevenue - data.previousRevenue) / data.previousRevenue) * 100
        : 0;

    const userChange = data.previousUsers > 0
        ? ((data.totalUsers - data.previousUsers) / data.previousUsers) * 100
        : 0;

    return (
        <div className="space-y-8">
            {/* Hero KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <KPICard
                    title="Revenue"
                    value={`$${data.totalRevenue.toFixed(0)}`}
                    icon={<BanknotesIcon className="h-5 w-5 text-[#FFC931]" />}
                    change={{ value: revenueChange, isPositive: revenueChange >= 0 }}
                    sparklineData={data.revenueSparkline}
                    glowVariant="gold"
                />
                <KPICard
                    title="New Users"
                    value={data.totalUsers}
                    icon={<UsersIcon className="h-5 w-5 text-[#00CFF2]" />}
                    change={{ value: userChange, isPositive: userChange >= 0 }}
                    sparklineData={data.usersSparkline}
                    glowVariant="cyan"
                />
                <KPICard
                    title="Games Played"
                    value={data.gamesPlayed}
                    icon={<TrophyIcon className="h-5 w-5 text-[#FB72FF]" />}
                    glowVariant="pink"
                />
                <KPICard
                    title="Avg Score"
                    value={data.avgScore.toFixed(0)}
                    icon={<ChartBarIcon className="h-5 w-5 text-[#14B985]" />}
                    glowVariant="success"
                />
                <KPICard
                    title="Conversion"
                    value={`${data.conversionRate.toFixed(1)}%`}
                    icon={<ArrowTrendingUpIcon className="h-5 w-5 text-[#FFC931]" />}
                    subtitle="signups → buyers"
                    glowVariant="gold"
                />
                <KPICard
                    title="K-Factor"
                    value={data.kFactor.toFixed(2)}
                    icon={<SparklesIcon className="h-5 w-5 text-[#FB72FF]" />}
                    subtitle={data.kFactor >= 1 ? "Viral! 🚀" : "Growing"}
                    glowVariant="pink"
                />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                <RevenueChart data={data.revenueData} />
                <UserGrowthChart dailyData={data.userGrowthData} statusData={data.userStatusData} />
            </div>

            {/* Theme Analytics */}
            <ThemeAnalytics data={data.themeData} />

            {/* Game Performance & Activity */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <GamePerformanceTable games={data.gamePerformance} />
                </div>
                <ActivityFeed
                    activities={data.recentActivities}
                    liveGamesCount={data.liveGamesCount}
                    activePlayersCount={data.activePlayersCount}
                />
            </div>

            {/* Referral Analytics */}
            <ReferralFunnel
                funnel={data.referralFunnel}
                kFactor={data.kFactor}
                topReferrers={data.topReferrers}
            />
        </div>
    );
}

export default async function AnalyticsPage({
    searchParams,
}: {
    searchParams: Promise<{ range?: string }>;
}) {
    const params = await searchParams;
    const range = params.range || "7d";
    const { label } = getDateRangeFromParam(range);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white font-display">Analytics</h1>
                    <p className="text-white/60 mt-1">
                        Platform metrics and insights • <span className="text-[#FFC931]">{label}</span>
                    </p>
                </div>
                <DateRangePicker currentRange={range} />
            </div>

            {/* Content */}
            <Suspense fallback={<LoadingSkeleton />}>
                <AnalyticsContent range={range} />
            </Suspense>
        </div>
    );
}
