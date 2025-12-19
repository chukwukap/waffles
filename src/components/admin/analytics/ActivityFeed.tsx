"use client";

import { TicketIcon, UserPlusIcon, TrophyIcon, PlayIcon } from "@heroicons/react/24/outline";

interface Activity {
    type: "ticket" | "signup" | "game_end" | "game_start";
    message: string;
    timestamp: Date;
    metadata?: {
        amount?: number;
        gameTitle?: string;
        username?: string;
    };
}

interface ActivityFeedProps {
    activities: Activity[];
    liveGamesCount: number;
    activePlayersCount: number;
}

const ACTIVITY_CONFIG = {
    ticket: {
        icon: TicketIcon,
        color: "#FFC931",
        bg: "bg-[#FFC931]/10",
    },
    signup: {
        icon: UserPlusIcon,
        color: "#00CFF2",
        bg: "bg-[#00CFF2]/10",
    },
    game_end: {
        icon: TrophyIcon,
        color: "#14B985",
        bg: "bg-[#14B985]/10",
    },
    game_start: {
        icon: PlayIcon,
        color: "#FB72FF",
        bg: "bg-[#FB72FF]/10",
    },
};

function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export function ActivityFeed({ activities, liveGamesCount, activePlayersCount }: ActivityFeedProps) {
    return (
        <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-white font-display">Live Activity</h3>
                    <p className="text-sm text-white/50">Real-time platform events</p>
                </div>
            </div>

            {/* Live Counters */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-[#FB72FF]/10 border border-[#FB72FF]/20">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FB72FF] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FB72FF]" />
                        </span>
                        <span className="text-xs text-white/50 font-display uppercase tracking-wider">Live Games</span>
                    </div>
                    <div className="text-3xl font-bold text-[#FB72FF] font-body ">
                        {liveGamesCount}
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-[#00CFF2]/10 border border-[#00CFF2]/20">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00CFF2] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00CFF2]" />
                        </span>
                        <span className="text-xs text-white/50 font-display uppercase tracking-wider">Active Players</span>
                    </div>
                    <div className="text-3xl font-bold text-[#00CFF2] font-body ">
                        {activePlayersCount}
                    </div>
                </div>
            </div>

            {/* Activity List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {activities.map((activity, index) => {
                    const config = ACTIVITY_CONFIG[activity.type];
                    const Icon = config.icon;

                    return (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors"
                        >
                            <div className={`p-2 rounded-lg shrink-0 ${config.bg}`}>
                                <Icon className="h-4 w-4" style={{ color: config.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white/80 leading-relaxed">
                                    {activity.message}
                                </p>
                                <p className="text-xs text-white/40 mt-1">
                                    {formatRelativeTime(new Date(activity.timestamp))}
                                </p>
                            </div>
                            {activity.metadata?.amount && (
                                <span className="text-sm font-bold text-[#FFC931] shrink-0">
                                    +${activity.metadata.amount}
                                </span>
                            )}
                        </div>
                    );
                })}
                {activities.length === 0 && (
                    <div className="text-center py-8 text-white/40">
                        <PlayIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent activity</p>
                    </div>
                )}
            </div>
        </div>
    );
}
