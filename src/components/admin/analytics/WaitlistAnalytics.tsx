"use client";

import { UsersIcon, CheckCircleIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface WaitlistAnalyticsProps {
    data: {
        totalWaitlist: number;
        totalActive: number;
        questCompletion: {
            all: number;      // 100%
            most: number;     // 75%+
            half: number;     // 50%+
            none: number;     // 0%
        };
        avgInvitesPerUser: number;
        totalInvitedUsers: number;
    };
}

const COMPLETION_COLORS = {
    all: "#14B985",
    most: "#FFC931",
    half: "#00CFF2",
    none: "#666",
};

export function WaitlistAnalytics({ data }: WaitlistAnalyticsProps) {
    const pieData = [
        { name: "All Quests (100%)", value: data.questCompletion.all, color: COMPLETION_COLORS.all },
        { name: "Most Quests (75%+)", value: data.questCompletion.most, color: COMPLETION_COLORS.most },
        { name: "Some Quests (50%+)", value: data.questCompletion.half, color: COMPLETION_COLORS.half },
        { name: "No Quests (0%)", value: data.questCompletion.none, color: COMPLETION_COLORS.none },
    ].filter(d => d.value > 0);

    const totalQuestUsers = data.questCompletion.all + data.questCompletion.most + data.questCompletion.half + data.questCompletion.none;

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="admin-panel p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-[#FFC931]/10">
                            <UsersIcon className="h-5 w-5 text-[#FFC931]" />
                        </div>
                        <span className="text-sm text-white/50 font-display uppercase tracking-wider">Waitlist</span>
                    </div>
                    <div className="text-3xl font-bold text-[#FFC931] font-body admin-stat-glow">
                        {data.totalWaitlist.toLocaleString()}
                    </div>
                    <div className="text-xs text-white/40 mt-1">users on waitlist</div>
                </div>

                <div className="admin-panel p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-[#14B985]/10">
                            <CheckCircleIcon className="h-5 w-5 text-[#14B985]" />
                        </div>
                        <span className="text-sm text-white/50 font-display uppercase tracking-wider">Active</span>
                    </div>
                    <div className="text-3xl font-bold text-[#14B985] font-body admin-stat-glow-success">
                        {data.totalActive.toLocaleString()}
                    </div>
                    <div className="text-xs text-white/40 mt-1">converted users</div>
                </div>

                <div className="admin-panel p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-[#00CFF2]/10">
                            <UserPlusIcon className="h-5 w-5 text-[#00CFF2]" />
                        </div>
                        <span className="text-sm text-white/50 font-display uppercase tracking-wider">Invited</span>
                    </div>
                    <div className="text-3xl font-bold text-[#00CFF2] font-body admin-stat-glow-cyan">
                        {data.totalInvitedUsers.toLocaleString()}
                    </div>
                    <div className="text-xs text-white/40 mt-1">came from invites</div>
                </div>

                <div className="admin-panel p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-[#FB72FF]/10">
                            <UsersIcon className="h-5 w-5 text-[#FB72FF]" />
                        </div>
                        <span className="text-sm text-white/50 font-display uppercase tracking-wider">Avg Invites</span>
                    </div>
                    <div className="text-3xl font-bold text-[#FB72FF] font-body admin-stat-glow-pink">
                        {data.avgInvitesPerUser.toFixed(1)}
                    </div>
                    <div className="text-xs text-white/40 mt-1">per user</div>
                </div>
            </div>

            {/* Quest Completion Chart */}
            <div className="admin-panel p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white font-display">Quest Completion Breakdown</h3>
                        <p className="text-sm text-white/50">How many waitlist quests users completed</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Donut Chart */}
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "rgba(10, 10, 11, 0.95)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "12px",
                                    }}
                                    formatter={(value: number) => [`${value} users`, ""]}
                                />
                                <Legend
                                    formatter={(value) => <span className="text-white/70 text-sm">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Breakdown Stats */}
                    <div className="space-y-4">
                        {[
                            { label: "Completed ALL quests (100%)", value: data.questCompletion.all, color: COMPLETION_COLORS.all },
                            { label: "Completed 75%+ quests", value: data.questCompletion.most, color: COMPLETION_COLORS.most },
                            { label: "Completed 50%+ quests", value: data.questCompletion.half, color: COMPLETION_COLORS.half },
                            { label: "Completed NO quests (0%)", value: data.questCompletion.none, color: COMPLETION_COLORS.none },
                        ].map((item) => {
                            const percentage = totalQuestUsers > 0 ? (item.value / totalQuestUsers) * 100 : 0;
                            return (
                                <div key={item.label} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white/70">{item.label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold" style={{ color: item.color }}>
                                                {item.value}
                                            </span>
                                            <span className="text-xs text-white/40">({percentage.toFixed(1)}%)</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%`, backgroundColor: item.color }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
