"use client";

import { UserGroupIcon, UserPlusIcon, PlayIcon, GiftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface ReferralFunnelProps {
    funnel: {
        invitesSent: number;
        registered: number;
        played: number;
        rewardsClaimed: number;
    };
    kFactor: number;
    topReferrers: Array<{
        id: number;
        username: string;
        referralCount: number;
        revenueGenerated: number;
    }>;
}

export function ReferralFunnel({ funnel, kFactor, topReferrers }: ReferralFunnelProps) {
    const steps = [
        {
            label: "Invites Sent",
            value: funnel.invitesSent,
            icon: UserGroupIcon,
            color: "#FFC931",
        },
        {
            label: "Registered",
            value: funnel.registered,
            icon: UserPlusIcon,
            color: "#00CFF2",
            conversionRate: funnel.invitesSent > 0
                ? ((funnel.registered / funnel.invitesSent) * 100).toFixed(1)
                : "0",
        },
        {
            label: "Played Game",
            value: funnel.played,
            icon: PlayIcon,
            color: "#FB72FF",
            conversionRate: funnel.registered > 0
                ? ((funnel.played / funnel.registered) * 100).toFixed(1)
                : "0",
        },
        {
            label: "Rewards Claimed",
            value: funnel.rewardsClaimed,
            icon: GiftIcon,
            color: "#14B985",
            conversionRate: funnel.played > 0
                ? ((funnel.rewardsClaimed / funnel.played) * 100).toFixed(1)
                : "0",
        },
    ];

    const maxValue = Math.max(...steps.map(s => s.value), 1);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Funnel Visualization */}
            <div className="lg:col-span-2 admin-panel p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white font-display">Referral Funnel</h3>
                        <p className="text-sm text-white/50">Viral loop conversion metrics</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-white/50 font-display uppercase tracking-wider mb-1">
                            K-Factor
                        </div>
                        <div className={`text-3xl font-bold font-body ${kFactor >= 1 ? "text-[#14B985] admin-stat-glow-success" : "text-[#FFC931] admin-stat-glow"
                            }`}>
                            {kFactor.toFixed(2)}
                        </div>
                        <div className="text-xs text-white/40">
                            {kFactor >= 1 ? "Viral! 🚀" : "Growing 📈"}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const width = (step.value / maxValue) * 100;

                        return (
                            <div key={step.label} className="relative">
                                {/* Connection line */}
                                {index > 0 && (
                                    <div className="absolute -top-4 left-6 w-0.5 h-4 bg-white/10" />
                                )}

                                <div className="flex items-center gap-4">
                                    {/* Icon */}
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: `${step.color}20` }}
                                    >
                                        <Icon className="h-6 w-6" style={{ color: step.color }} />
                                    </div>

                                    {/* Bar */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-white/70">{step.label}</span>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="text-lg font-bold font-body"
                                                    style={{ color: step.color }}
                                                >
                                                    {step.value.toLocaleString()}
                                                </span>
                                                {step.conversionRate && (
                                                    <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                                                        {step.conversionRate}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{
                                                    width: `${width}%`,
                                                    backgroundColor: step.color,
                                                    boxShadow: `0 0 20px ${step.color}40`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Top Referrers */}
            <div className="admin-panel p-6">
                <h4 className="text-sm font-medium text-white/50 font-display uppercase tracking-wider mb-4">
                    Top Referrers
                </h4>
                <div className="space-y-4">
                    {topReferrers.slice(0, 5).map((referrer, index) => (
                        <div key={referrer.id} className="flex items-center gap-3">
                            <span className={`text-lg font-bold font-body w-6 ${index === 0 ? "text-[#FFC931]" :
                                    index === 1 ? "text-[#C0C0C0]" :
                                        index === 2 ? "text-[#CD7F32]" :
                                            "text-white/40"
                                }`}>
                                {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <Link
                                    href={`/admin/users/${referrer.id}`}
                                    className="text-sm font-medium text-white hover:text-[#FFC931] truncate block transition-colors"
                                >
                                    @{referrer.username || `user${referrer.id}`}
                                </Link>
                                <div className="text-xs text-white/40">
                                    ${referrer.revenueGenerated.toFixed(0)} generated
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[#00CFF2] font-bold font-body">
                                    {referrer.referralCount}
                                </div>
                                <div className="text-xs text-white/40">refs</div>
                            </div>
                        </div>
                    ))}
                    {topReferrers.length === 0 && (
                        <div className="text-center py-8 text-white/40">
                            <UserGroupIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No referrals yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
