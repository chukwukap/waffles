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
    WaitlistAnalytics,
    GameInsights,
    QuestionDifficulty,
    PlayerEngagement,
    ChatAnalytics,
    AnalyticsTabs,
    type AnalyticsTab,
} from "@/components/admin/analytics";
import { QUESTS } from "@/lib/quests";

// ============================================================
// DATA FETCHING
// ============================================================

async function getOverviewData(start: Date, end: Date) {
    const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(start.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const [
        currentRevenue,
        previousRevenue,
        ticketsByDay,
        totalUsers,
        previousPeriodUsers,
        activeUsers,
        usersByDay,
        userStatusCounts,
        gamesPlayed,
        topGames,
        liveGames,
        avgScoreResult,
        activePlayersInLive,
        referredUsers,
        usersWhoPlayed,
        claimedRewards,
        topReferrersData,
        recentTickets,
        recentSignups,
        recentGameEnds,
    ] = await Promise.all([
        prisma.ticket.aggregate({
            where: { status: { in: ["PAID", "REDEEMED"] }, purchasedAt: { gte: start, lte: end } },
            _sum: { amountUSDC: true },
        }),
        prisma.ticket.aggregate({
            where: { status: { in: ["PAID", "REDEEMED"] }, purchasedAt: { gte: previousStart, lt: start } },
            _sum: { amountUSDC: true },
        }),
        prisma.ticket.groupBy({
            by: ["purchasedAt"],
            where: { status: { in: ["PAID", "REDEEMED"] }, purchasedAt: { gte: start, lte: end } },
            _sum: { amountUSDC: true },
            _count: true,
        }),
        prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.user.count({ where: { createdAt: { gte: previousStart, lt: start } } }),
        prisma.user.count({ where: { status: "ACTIVE", games: { some: {} } } }),
        prisma.user.groupBy({ by: ["createdAt"], where: { createdAt: { gte: start, lte: end } }, _count: true }),
        prisma.user.groupBy({ by: ["status"], _count: true }),
        prisma.game.count({ where: { status: "ENDED", endsAt: { gte: start, lte: end } } }),
        prisma.game.findMany({
            take: 10,
            orderBy: { tickets: { _count: "desc" } },
            where: { startsAt: { gte: start, lte: end } },
            include: {
                _count: { select: { players: true, tickets: true } },
                tickets: { where: { status: { in: ["PAID", "REDEEMED"] } }, select: { amountUSDC: true } },
                players: { select: { score: true } },
            },
        }),
        prisma.game.count({ where: { status: "LIVE" } }),
        prisma.gamePlayer.aggregate({ _avg: { score: true } }),
        prisma.gamePlayer.count({ where: { game: { status: "LIVE" } } }),
        prisma.user.count({ where: { invitedById: { not: null } } }),
        prisma.user.count({ where: { invitedById: { not: null }, games: { some: {} } } }),
        prisma.referralReward.count({ where: { status: "CLAIMED" } }),
        prisma.user.findMany({
            take: 10,
            where: { invites: { some: {} } },
            select: {
                id: true,
                username: true,
                _count: { select: { invites: true } },
                invites: { select: { tickets: { where: { status: { in: ["PAID", "REDEEMED"] } }, select: { amountUSDC: true } } } },
            },
            orderBy: { invites: { _count: "desc" } },
        }),
        prisma.ticket.findMany({
            take: 5,
            orderBy: { purchasedAt: "desc" },
            where: { status: { in: ["PAID", "REDEEMED"] } },
            include: { user: { select: { username: true } }, game: { select: { title: true } } },
        }),
        prisma.user.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, username: true, createdAt: true } }),
        prisma.game.findMany({
            take: 3,
            orderBy: { endsAt: "desc" },
            where: { status: "ENDED" },
            select: { id: true, title: true, endsAt: true, _count: { select: { players: true } } },
        }),
    ]);

    // Process daily data
    const dailyMap = new Map<string, { revenue: number; tickets: number; signups: number }>();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dailyMap.set(d.toISOString().split("T")[0], { revenue: 0, tickets: 0, signups: 0 });
    }
    ticketsByDay.forEach((day) => {
        const dateStr = new Date(day.purchasedAt).toISOString().split("T")[0];
        const existing = dailyMap.get(dateStr) || { revenue: 0, tickets: 0, signups: 0 };
        existing.revenue += day._sum.amountUSDC || 0;
        existing.tickets += day._count;
        dailyMap.set(dateStr, existing);
    });
    usersByDay.forEach((day) => {
        const dateStr = new Date(day.createdAt).toISOString().split("T")[0];
        const existing = dailyMap.get(dateStr) || { revenue: 0, tickets: 0, signups: 0 };
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

    const statusColors: Record<string, string> = { ACTIVE: "#14B985", WAITLIST: "#FFC931", NONE: "#666", BANNED: "#EF4444" };
    const userStatusData = userStatusCounts.map((s) => ({ status: s.status, count: s._count, color: statusColors[s.status] || "#666" }));

    const gamePerformance = topGames.map((game) => ({
        id: game.id,
        title: game.title,
        theme: game.theme,
        status: game.status,
        playerCount: game._count.players,
        ticketCount: game._count.tickets,
        revenue: game.tickets.reduce((sum, t) => sum + t.amountUSDC, 0),
        avgScore: game.players.length > 0 ? game.players.reduce((sum, p) => sum + p.score, 0) / game.players.length : 0,
    }));

    const themeRevenueMap = new Map<string, { games: number; revenue: number; players: number }>();
    topGames.forEach((game) => {
        const existing = themeRevenueMap.get(game.theme) || { games: 0, revenue: 0, players: 0 };
        existing.games += 1;
        existing.revenue += game.tickets.reduce((sum, t) => sum + t.amountUSDC, 0);
        existing.players += game._count.players;
        themeRevenueMap.set(game.theme, existing);
    });
    const themeData = Array.from(themeRevenueMap.entries()).map(([theme, data]) => ({ theme, ...data }));

    const topReferrers = topReferrersData.map((user) => ({
        id: user.id,
        username: user.username || `user${user.id}`,
        referralCount: user._count.invites,
        revenueGenerated: user.invites.reduce((sum, invite) => sum + invite.tickets.reduce((ts, t) => ts + t.amountUSDC, 0), 0),
    }));

    const totalInviters = await prisma.user.count({ where: { invites: { some: {} } } });
    const kFactor = totalInviters > 0 ? referredUsers / totalInviters : 0;
    const ticketBuyers = await prisma.user.count({ where: { tickets: { some: {} } } });
    const allUsers = await prisma.user.count();
    const conversionRate = allUsers > 0 ? (ticketBuyers / allUsers) * 100 : 0;

    const recentActivities = [
        ...recentTickets.map((t) => ({ type: "ticket" as const, message: `${t.user.username || "User"} bought a ticket for ${t.game.title}`, timestamp: t.purchasedAt, metadata: { amount: t.amountUSDC } })),
        ...recentSignups.map((u) => ({ type: "signup" as const, message: `@${u.username || `user${u.id}`} joined Waffles`, timestamp: u.createdAt })),
        ...recentGameEnds.map((g) => ({ type: "game_end" as const, message: `${g.title} ended with ${g._count.players} players`, timestamp: g.endsAt })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    return {
        totalRevenue: currentRevenue._sum.amountUSDC || 0,
        previousRevenue: previousRevenue._sum.amountUSDC || 0,
        totalUsers,
        previousUsers: previousPeriodUsers,
        gamesPlayed,
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
        liveGamesCount: liveGames,
        activePlayersCount: activePlayersInLive,
        recentActivities,
    };
}

async function getWaitlistData() {
    const totalQuests = QUESTS.length;
    const [waitlistUsers, activeUsers, usersWithQuests, invitedUsersCount, totalInviters] = await Promise.all([
        prisma.user.count({ where: { status: "WAITLIST" } }),
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.user.findMany({ where: { status: { in: ["WAITLIST", "ACTIVE"] } }, select: { completedTasks: true } }),
        prisma.user.count({ where: { invitedById: { not: null } } }),
        // @ts-expect-error - distinct is valid but typescript complains sometimes
        prisma.user.count({ where: { invites: { some: {} } }, distinct: ["id"] }),
    ]);

    // Calculate quest completion breakdown
    const questCompletion = {
        all: 0,
        most: 0,
        half: 0,
        none: 0,
    };

    usersWithQuests.forEach((user) => {
        const completed = user.completedTasks.length;
        const percentage = (completed / totalQuests) * 100;
        if (percentage === 100) questCompletion.all++;
        else if (percentage >= 75) questCompletion.most++;
        else if (percentage >= 50) questCompletion.half++;
        else questCompletion.none++;
    });

    return {
        totalWaitlist: waitlistUsers,
        totalActive: activeUsers,
        avgInvitesPerUser: totalInviters > 0 ? invitedUsersCount / totalInviters : 0,
        totalInvitedUsers: invitedUsersCount,
        questCompletion,
    };
}

async function getGameInsightsData() {
    const [ticketCounts, prizePoolSum, gamesEnded, playersWithTickets, playersWhoPlayed] = await Promise.all([
        prisma.ticket.groupBy({ by: ["status"], _count: true }),
        prisma.game.aggregate({ _sum: { prizePool: true } }),
        prisma.game.count({ where: { status: "ENDED" } }),
        prisma.ticket.count({ where: { status: { in: ["PAID", "REDEEMED"] } } }),
        prisma.gamePlayer.count(),
    ]);

    const ticketConversion = { pending: 0, paid: 0, redeemed: 0, failed: 0 };
    ticketCounts.forEach((tc) => {
        const key = tc.status.toLowerCase() as keyof typeof ticketConversion;
        if (key in ticketConversion) ticketConversion[key] = tc._count;
    });

    const avgPlayersPerGame = gamesEnded > 0 ? playersWhoPlayed / gamesEnded : 0;
    const completionRate = playersWithTickets > 0 ? (playersWhoPlayed / playersWithTickets) * 100 : 0;

    return {
        ticketConversion,
        totalPrizePool: prizePoolSum._sum.prizePool || 0,
        gamesCompleted: gamesEnded,
        avgPlayersPerGame,
        completionRate,
    };
}

async function getPlayerData() {
    const [avgScoreResult, totalCorrect, totalAnswers, avgLatencyResult, totalPlayers, repeatPlayers, scores] = await Promise.all([
        prisma.gamePlayer.aggregate({ _avg: { score: true } }),
        prisma.answer.count({ where: { isCorrect: true } }),
        prisma.answer.count(),
        prisma.answer.aggregate({ _avg: { latencyMs: true } }),
        prisma.gamePlayer.groupBy({ by: ["userId"], _count: true }),
        prisma.gamePlayer.groupBy({ by: ["userId"], _count: true, having: { userId: { _count: { gt: 1 } } } }),
        prisma.gamePlayer.findMany({ select: { score: true } }),
    ]);

    // Score distribution buckets
    const buckets = [
        { range: "0-100", min: 0, max: 100, count: 0 },
        { range: "101-250", min: 101, max: 250, count: 0 },
        { range: "251-500", min: 251, max: 500, count: 0 },
        { range: "501-750", min: 501, max: 750, count: 0 },
        { range: "751-1000", min: 751, max: 1000, count: 0 },
        { range: "1000+", min: 1001, max: Infinity, count: 0 },
    ];
    scores.forEach((p) => {
        const bucket = buckets.find((b) => p.score >= b.min && p.score <= b.max);
        if (bucket) bucket.count++;
    });

    const avgAccuracy = totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0;

    return {
        avgScore: avgScoreResult._avg.score || 0,
        avgAccuracy,
        avgAnswerTime: avgLatencyResult._avg.latencyMs || 0,
        scoreDistribution: buckets.map((b) => ({ range: b.range, count: b.count })),
        totalPlayers: totalPlayers.length,
        repeatPlayers: repeatPlayers.length,
    };
}

async function getQuestionData() {
    const questions = await prisma.question.findMany({
        include: {
            game: { select: { title: true } },
            answers: { select: { isCorrect: true, latencyMs: true } },
        },
        take: 100,
        orderBy: { answers: { _count: "desc" } },
    });

    return questions.map((q) => ({
        id: q.id,
        content: q.content.slice(0, 100),
        gameTitle: q.game.title,
        totalAnswers: q.answers.length,
        correctAnswers: q.answers.filter((a) => a.isCorrect).length,
        avgLatencyMs: q.answers.length > 0 ? q.answers.reduce((s, a) => s + a.latencyMs, 0) / q.answers.length : 0,
        accuracy: q.answers.length > 0 ? (q.answers.filter((a) => a.isCorrect).length / q.answers.length) * 100 : 0,
    }));
}

async function getChatData() {
    const [totalMessages, chatters, totalPlayers, messagesByQuestion] = await Promise.all([
        prisma.chat.count(),
        prisma.chat.groupBy({ by: ["userId"], _count: true }),
        prisma.gamePlayer.count(),
        prisma.chat.findMany({ select: { text: true } }),
    ]);

    // Simple keyword extraction (top common words)
    const wordCounts = new Map<string, number>();
    const stopWords = new Set(["the", "a", "an", "is", "it", "to", "of", "and", "in", "for", "on", "that", "this", "i", "you", "we", "he", "she", "they", "what", "how", "why", "when", "where", "who"]);
    messagesByQuestion.forEach((msg) => {
        msg.text.toLowerCase().split(/\s+/).forEach((word) => {
            const clean = word.replace(/[^a-z0-9]/g, "");
            if (clean.length > 2 && !stopWords.has(clean)) {
                wordCounts.set(clean, (wordCounts.get(clean) || 0) + 1);
            }
        });
    });
    const topKeywords = Array.from(wordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word, count]) => ({ word, count }));

    return {
        totalMessages,
        uniqueChatters: chatters.length,
        totalPlayers,
        participationRate: totalPlayers > 0 ? (chatters.length / totalPlayers) * 100 : 0,
        messagesByRound: [], // Would need round tracking
        topKeywords,
    };
}

// ============================================================
// LOADING SKELETON
// ============================================================

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

// ============================================================
// TAB CONTENT COMPONENTS
// ============================================================

async function OverviewContent({ range }: { range: string }) {
    const { start, end } = getDateRangeFromParam(range);
    const data = await getOverviewData(start, end);
    const revenueChange = data.previousRevenue > 0 ? ((data.totalRevenue - data.previousRevenue) / data.previousRevenue) * 100 : 0;
    const userChange = data.previousUsers > 0 ? ((data.totalUsers - data.previousUsers) / data.previousUsers) * 100 : 0;

    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <KPICard title="Revenue" value={`$${data.totalRevenue.toFixed(0)}`} icon={<BanknotesIcon className="h-5 w-5 text-[#FFC931]" />} change={{ value: revenueChange, isPositive: revenueChange >= 0 }} sparklineData={data.revenueSparkline} glowVariant="gold" />
                <KPICard title="New Users" value={data.totalUsers} icon={<UsersIcon className="h-5 w-5 text-[#00CFF2]" />} change={{ value: userChange, isPositive: userChange >= 0 }} sparklineData={data.usersSparkline} glowVariant="cyan" />
                <KPICard title="Games Played" value={data.gamesPlayed} icon={<TrophyIcon className="h-5 w-5 text-[#FB72FF]" />} glowVariant="pink" />
                <KPICard title="Avg Score" value={data.avgScore.toFixed(0)} icon={<ChartBarIcon className="h-5 w-5 text-[#14B985]" />} glowVariant="success" />
                <KPICard title="Conversion" value={`${data.conversionRate.toFixed(1)}%`} icon={<ArrowTrendingUpIcon className="h-5 w-5 text-[#FFC931]" />} subtitle="signups → buyers" glowVariant="gold" />
                <KPICard title="K-Factor" value={data.kFactor.toFixed(2)} icon={<SparklesIcon className="h-5 w-5 text-[#FB72FF]" />} subtitle={data.kFactor >= 1 ? "Viral! 🚀" : "Growing"} glowVariant="pink" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <RevenueChart data={data.revenueData} />
                <UserGrowthChart dailyData={data.userGrowthData} statusData={data.userStatusData} />
            </div>
            <ThemeAnalytics data={data.themeData} />
            <GamePerformanceTable games={data.gamePerformance} />
            <div className="grid gap-6 lg:grid-cols-2">
                <ReferralFunnel funnel={data.referralFunnel} kFactor={data.kFactor} topReferrers={data.topReferrers} />
                <ActivityFeed activities={data.recentActivities} liveGamesCount={data.liveGamesCount} activePlayersCount={data.activePlayersCount} />
            </div>
        </div>
    );
}

async function WaitlistContent() {
    const data = await getWaitlistData();
    return <WaitlistAnalytics data={data} />;
}

async function GamesContent() {
    const [gameData, questionData] = await Promise.all([getGameInsightsData(), getQuestionData()]);
    return (
        <div className="space-y-8">
            <GameInsights data={gameData} />
            <QuestionDifficulty questions={questionData} />
        </div>
    );
}

async function PlayersContent() {
    const [playerData, chatData] = await Promise.all([getPlayerData(), getChatData()]);
    return (
        <div className="space-y-8">
            <PlayerEngagement data={playerData} />
            <ChatAnalytics data={chatData} />
        </div>
    );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string; tab?: string }> }) {
    const params = await searchParams;
    const range = params.range || "7d";
    const tab = (params.tab as AnalyticsTab) || "overview";
    const { label } = getDateRangeFromParam(range);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white font-display">Analytics</h1>
                        <p className="text-white/60 mt-1">
                            Platform metrics and insights • <span className="text-[#FFC931]">{label}</span>
                        </p>
                    </div>
                    <DateRangePicker currentRange={range} />
                </div>
                <AnalyticsTabs currentTab={tab} />
            </div>

            {/* Tab Content */}
            <Suspense fallback={<LoadingSkeleton />}>
                {tab === "overview" && <OverviewContent range={range} />}
                {tab === "waitlist" && <WaitlistContent />}
                {tab === "games" && <GamesContent />}
                {tab === "players" && <PlayersContent />}
            </Suspense>
        </div>
    );
}
