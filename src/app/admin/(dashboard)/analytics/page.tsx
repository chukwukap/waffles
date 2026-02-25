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
    GameInsights,
    QuestionDifficulty,
    PlayerEngagement,
    ChatAnalytics,
    AnalyticsTabs,
    type AnalyticsTab,
} from "@/components/admin/analytics";
import { getGamePhase } from "@/lib/types";

// ============================================================
// DATA FETCHING (Updated for new schema: GameEntry, no ticket)
// ============================================================

async function getOverviewData(start: Date, end: Date) {
    const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(start.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const now = new Date();

    const [
        // Revenue from game entries
        currentRevenue,
        previousRevenue,
        entriesByDay,
        // User stats
        totalUsers,
        previousPeriodUsers,
        activeUsers,
        usersByDay,
        userStatusCounts,
        // Games
        gamesEnded,
        topGames,
        liveGamesRaw,
        // Player stats
        avgScoreResult,
        activePlayersInLive,
        // Referrals
        referredUsers,
        usersWhoPlayed,
        claimedRewards,
        topReferrersData,
        // Activity
        recentEntries,
        recentSignups,
        recentGameEnds,
    ] = await Promise.all([
        // Revenue: sum of prizePool contributions from entries
        prisma.gameEntry.aggregate({
            where: { paidAt: { gte: start, lte: end } },
            _count: true,
        }),
        prisma.gameEntry.aggregate({
            where: { paidAt: { gte: previousStart, lt: start } },
            _count: true,
        }),
        prisma.gameEntry.groupBy({
            by: ["paidAt"],
            where: { paidAt: { gte: start, lte: end } },
            _count: true,
        }),
        prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.user.count({ where: { createdAt: { gte: previousStart, lt: start } } }),
        prisma.user.count({ where: { hasGameAccess: true, entries: { some: {} } } }),
        prisma.user.groupBy({ by: ["createdAt"], where: { createdAt: { gte: start, lte: end } }, _count: true }),
        prisma.user.groupBy({ by: ["hasGameAccess", "isBanned"], _count: true }),
        prisma.game.count({ where: { endsAt: { lte: now, gte: start } } }),
        prisma.game.findMany({
            take: 10,
            orderBy: { playerCount: "desc" },
            where: { startsAt: { gte: start, lte: end } },
            select: {
                id: true,
                title: true,
                theme: true,
                startsAt: true,
                endsAt: true,
                playerCount: true,
                prizePool: true,
                tierPrices: true,
            },
        }),
        prisma.game.findMany({
            where: { startsAt: { lte: now }, endsAt: { gt: now } },
        }),
        prisma.gameEntry.aggregate({
            where: { paidAt: { not: null } },
            _avg: { score: true }
        }),
        prisma.gameEntry.count({
            where: {
                game: { startsAt: { lte: now }, endsAt: { gt: now } }
            }
        }),
        prisma.user.count({ where: { referredById: { not: null } } }),
        prisma.user.count({ where: { referredById: { not: null }, entries: { some: {} } } }),
        prisma.referralReward.count({ where: { status: "CLAIMED" } }),
        prisma.user.findMany({
            take: 10,
            where: { referrals: { some: {} } },
            select: {
                id: true,
                username: true,
                _count: { select: { referrals: true } },
            },
            orderBy: { referrals: { _count: "desc" } },
        }),
        prisma.gameEntry.findMany({
            take: 5,
            orderBy: { paidAt: "desc" },
            where: { paidAt: { not: null } },
            include: {
                user: { select: { username: true } },
                game: { select: { title: true } }
            },
        }),
        prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            select: { id: true, username: true, createdAt: true }
        }),
        prisma.game.findMany({
            take: 3,
            orderBy: { endsAt: "desc" },
            where: { endsAt: { lte: now } },
            select: { id: true, title: true, endsAt: true, playerCount: true },
        }),
    ]);

    // Calculate total revenue from top games
    const totalRevenue = topGames.reduce((sum, g) => sum + g.prizePool, 0);
    const previousRevenueTotal = 0; // Would need historical data

    // Process daily data
    type DailyData = { revenue: number; entries: number; signups: number };
    const dailyMap = new Map<string, DailyData>();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dailyMap.set(d.toISOString().split("T")[0], { revenue: 0, entries: 0, signups: 0 });
    }

    entriesByDay.forEach((day) => {
        if (day.paidAt) {
            const dateStr = new Date(day.paidAt).toISOString().split("T")[0];
            const existing = dailyMap.get(dateStr) || { revenue: 0, entries: 0, signups: 0 };
            existing.entries += day._count;
            dailyMap.set(dateStr, existing);
        }
    });

    usersByDay.forEach((day) => {
        const dateStr = new Date(day.createdAt).toISOString().split("T")[0];
        const existing = dailyMap.get(dateStr) || { revenue: 0, entries: 0, signups: 0 };
        existing.signups += day._count;
        dailyMap.set(dateStr, existing);
    });

    const sortedDates = Array.from(dailyMap.keys()).sort();
    let cumulativeUsers = 0;
    const revenueData = sortedDates.map((date) => ({ date: date.slice(5), ...dailyMap.get(date)! }));
    const userGrowthData = sortedDates.map((date) => {
        cumulativeUsers += dailyMap.get(date)!.signups;
        return { date: date.slice(5), signups: dailyMap.get(date)!.signups, cumulative: cumulativeUsers };
    });

    const userStatusData = userStatusCounts.map((s) => {
        let label = "None";
        let color = "#666";
        if (s.isBanned) {
            label = "Banned";
            color = "#EF4444";
        } else if (s.hasGameAccess) {
            label = "Active";
            color = "#14B985";
        } else {
            label = "No Access";
            color = "#FFC931";
        }
        return { status: label, count: s._count, color };
    });

    // Game performance using pre-computed counters
    const gamePerformance = topGames.map((game) => ({
        id: game.id,
        title: game.title,
        theme: game.theme,
        status: getGamePhase(game),
        playerCount: game.playerCount,
        ticketCount: game.playerCount,
        revenue: game.prizePool,
        avgScore: 0, // Would need to compute from entries
    }));

    const themeRevenueMap = new Map<string, { games: number; revenue: number; players: number }>();
    topGames.forEach((game) => {
        const existing = themeRevenueMap.get(game.theme) || { games: 0, revenue: 0, players: 0 };
        existing.games += 1;
        existing.revenue += game.prizePool;
        existing.players += game.playerCount;
        themeRevenueMap.set(game.theme, existing);
    });
    const themeData = Array.from(themeRevenueMap.entries()).map(([theme, data]) => ({ theme, ...data }));

    const topReferrers = topReferrersData.map((user) => ({
        id: user.id,
        username: user.username || `user${user.id}`,
        referralCount: user._count.referrals,
        revenueGenerated: 0, // Would need to compute from referrals' entries
    }));

    const totalInviters = await prisma.user.count({ where: { referrals: { some: {} } } });
    const kFactor = totalInviters > 0 ? referredUsers / totalInviters : 0;
    const entryBuyers = await prisma.user.count({ where: { entries: { some: { paidAt: { not: null } } } } });
    const allUsers = await prisma.user.count();
    const conversionRate = allUsers > 0 ? (entryBuyers / allUsers) * 100 : 0;

    const recentActivities = [
        ...recentEntries.map((e) => ({
            type: "ticket" as const,
            message: `${e.user.username || "User"} bought a ticket for ${e.game.title}`,
            timestamp: e.paidAt!,
            metadata: { amount: e.paidAmount ?? 0 }
        })),
        ...recentSignups.map((u) => ({
            type: "signup" as const,
            message: `@${u.username || `user${u.id}`} joined Waffles`,
            timestamp: u.createdAt
        })),
        ...recentGameEnds.map((g) => ({
            type: "game_end" as const,
            message: `${g.title} ended with ${g.playerCount} players`,
            timestamp: g.endsAt
        })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    return {
        totalRevenue,
        previousRevenue: previousRevenueTotal,
        totalUsers,
        previousUsers: previousPeriodUsers,
        gamesPlayed: gamesEnded,
        avgScore: avgScoreResult._avg.score || 0,
        conversionRate,
        kFactor,
        revenueSparkline: revenueData.slice(-7).map((d) => d.revenue),
        usersSparkline: userGrowthData.slice(-7).map((d) => d.signups),
        revenueData,
        userGrowthData,
        userStatusData,
        gamePerformance,
        themeData,
        referralFunnel: { invitesSent: allUsers, registered: referredUsers, played: usersWhoPlayed, rewardsClaimed: claimedRewards },
        topReferrers,
        liveGamesCount: liveGamesRaw.length,
        activePlayersCount: activePlayersInLive,
        recentActivities,
    };
}

async function getGameInsights() {
    const now = new Date();

    const [games, entries] = await Promise.all([
        prisma.game.findMany({
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
                id: true,
                title: true,
                theme: true,
                startsAt: true,
                endsAt: true,
                playerCount: true,
                prizePool: true,
                tierPrices: true,
                maxPlayers: true,
            },
        }),
        prisma.gameEntry.groupBy({
            by: ["gameId"],
            _avg: { score: true },
            _count: true,
        }),
    ]);

    const entryMap = new Map(entries.map(e => [e.gameId, e]));

    return games.map((game) => {
        const entry = entryMap.get(game.id);
        return {
            id: game.id,
            title: game.title,
            theme: game.theme,
            status: getGamePhase(game),
            playerCount: game.playerCount,
            maxPlayers: game.maxPlayers,
            prizePool: game.prizePool,
            avgScore: entry?._avg.score || 0,
            fillRate: game.maxPlayers > 0 ? (game.playerCount / game.maxPlayers) * 100 : 0,
        };
    });
}

// ============================================================
// PAGE COMPONENT
// ============================================================

export default async function AnalyticsPage({
    searchParams,
}: {
    searchParams: Promise<{ range?: string; tab?: string }>;
}) {
    const { range, tab } = await searchParams;
    const { start, end } = getDateRangeFromParam(range ?? "7d");
    const validTabs: AnalyticsTab[] = ["overview", "games", "players"];
    const activeTab = validTabs.includes(tab as AnalyticsTab)
        ? (tab as AnalyticsTab)
        : "overview";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white font-display">Analytics</h1>
                    <p className="text-sm text-white/60">
                        Track platform performance and user engagement
                    </p>
                </div>
                <DateRangePicker currentRange={range || "7d"} />
            </div>

            <AnalyticsTabs currentTab={activeTab} />

            <Suspense fallback={<AnalyticsSkeleton />}>
                <AnalyticsContent start={start} end={end} activeTab={activeTab} />
            </Suspense>
        </div>
    );
}

async function AnalyticsContent({
    start,
    end,
    activeTab,
}: {
    start: Date;
    end: Date;
    activeTab: AnalyticsTab;
}) {
    if (activeTab === "overview") {
        const data = await getOverviewData(start, end);
        return <OverviewTab data={data} />;
    }
    if (activeTab === "games") {
        const games = await getGameInsights();
        // Compute aggregate stats
        const totalPrizePool = games.reduce((sum, g) => sum + g.prizePool, 0);
        const gamesCompleted = games.filter(g => g.status === "ENDED").length;
        const avgPlayersPerGame = games.length > 0 ? games.reduce((sum, g) => sum + g.playerCount, 0) / games.length : 0;
        const totalEntries = games.reduce((sum, g) => sum + g.playerCount, 0);
        const playedEntries = games.filter(g => g.status === "ENDED").reduce((sum, g) => sum + g.playerCount, 0);
        const completionRate = totalEntries > 0 ? (playedEntries / totalEntries) * 100 : 0;

        const data = {
            ticketConversion: {
                pending: 0, // Would need to track separately
                paid: totalEntries,
                redeemed: playedEntries,
                failed: 0,
            },
            totalPrizePool,
            gamesCompleted,
            avgPlayersPerGame,
            completionRate,
        };
        return <GameInsights data={data} />;
    }
    return null;
}

function OverviewTab({ data }: { data: Awaited<ReturnType<typeof getOverviewData>> }) {
    const revenueChange = data.previousRevenue > 0
        ? ((data.totalRevenue - data.previousRevenue) / data.previousRevenue) * 100
        : 0;
    const usersChange = data.previousUsers > 0
        ? ((data.totalUsers - data.previousUsers) / data.previousUsers) * 100
        : 0;

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Revenue"
                    value={`$${data.totalRevenue.toLocaleString()}`}
                    change={{ value: revenueChange, isPositive: revenueChange >= 0 }}
                    icon={<BanknotesIcon className="h-5 w-5 text-[#FFC931]" />}
                    sparklineData={data.revenueSparkline}
                />
                <KPICard
                    title="New Users"
                    value={data.totalUsers.toLocaleString()}
                    change={{ value: usersChange, isPositive: usersChange >= 0 }}
                    icon={<UsersIcon className="h-5 w-5 text-[#00CFF2]" />}
                    sparklineData={data.usersSparkline}
                    glowVariant="cyan"
                />
                <KPICard
                    title="Games Played"
                    value={data.gamesPlayed.toString()}
                    icon={<TrophyIcon className="h-5 w-5 text-[#14B985]" />}
                    glowVariant="success"
                />
                <KPICard
                    title="Conversion Rate"
                    value={`${data.conversionRate.toFixed(1)}%`}
                    icon={<ChartBarIcon className="h-5 w-5 text-[#FB72FF]" />}
                    glowVariant="pink"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueChart data={data.revenueData.map(d => ({ date: d.date, revenue: d.revenue, tickets: d.entries }))} />
                <UserGrowthChart dailyData={data.userGrowthData} statusData={data.userStatusData} />
            </div>

            {/* Game Performance */}
            <GamePerformanceTable games={data.gamePerformance} />

            {/* Theme Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ThemeAnalytics data={data.themeData} />
                <ReferralFunnel funnel={data.referralFunnel} kFactor={data.kFactor} topReferrers={data.topReferrers} />
            </div>

            {/* Activity Feed */}
            <ActivityFeed activities={data.recentActivities} liveGamesCount={data.liveGamesCount} activePlayersCount={data.activePlayersCount} />
        </div>
    );
}

function AnalyticsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-white/5 border border-white/10 rounded-2xl" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80 bg-white/5 border border-white/10 rounded-2xl" />
                <div className="h-80 bg-white/5 border border-white/10 rounded-2xl" />
            </div>
        </div>
    );
}
